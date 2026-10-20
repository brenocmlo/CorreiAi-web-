import { NextRequest, NextResponse } from 'next/server';
import { openRouterChat, type ChatMessage } from '@/lib/openrouter';
import { createPublicLead } from '@/lib/public-leads';
import { recomendarImoveis, type PreferenciasLead } from '@/lib/recomendacao';
import { createServerSupabaseClient } from '@/lib/supabase';
import { FAIXAS_ORCAMENTO, TIPOS_IMOVEL } from '@/types/lead';

type ConversationMessage = { role: 'user' | 'assistant'; text: string };

const SYSTEM_PROMPT = `Você é CorretorIA, assistente imobiliário da CorreIA.
Responda em português brasileiro de forma cordial e objetiva. Descubra tipo de imóvel,
orçamento e bairro. Apresente somente imóveis incluídos no portfólio abaixo; nunca invente
imóveis ou disponibilidade. Se houver interesse, peça nome completo, e-mail e telefone.
Nunca afirme que uma visita foi agendada ou que um contato foi salvo: ofereça o encaminhamento
para um corretor após receber os dados.`;

function validMessages(value: unknown): value is ConversationMessage[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 30 &&
    value.every((message) => message && typeof message === 'object' &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.text === 'string' && message.text.trim().length > 0 &&
      message.text.length <= 2000) && value[value.length - 1].role === 'user';
}

function preferencesFrom(messages: ConversationMessage[]): PreferenciasLead {
  const text = messages.filter((m) => m.role === 'user').map((m) => m.text).join(' ').toLowerCase();
  const tipoImovel = TIPOS_IMOVEL.find((tipo) => text.includes(tipo.toLowerCase()));
  const faixaOrcamento = FAIXAS_ORCAMENTO.find((faixa) => text.includes(faixa.toLowerCase()));
  const bairro = text.match(/\bbairro\s+(?:da|de|do|na|no)?\s*([\p{L}\s-]{2,40})/iu)?.[1]?.trim();
  return { tipoImovel, faixaOrcamento, bairro };
}

function hasContactHints(messages: ConversationMessage[]): boolean {
  const text = messages.filter((m) => m.role === 'user').map((m) => m.text).join(' ');
  const possiblePhones = text.match(/\+?\d[\d\s()-]{8,}\d/g) ?? [];
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text) &&
    possiblePhones.some((phone) => { const length = phone.replace(/\D/g, '').length; return length >= 10 && length <= 15; });
}

function parseExtractedLead(raw: string, messages: ConversationMessage[]) {
  try {
    const data = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')) as Record<string, unknown>;
    if (typeof data.nome !== 'string' || typeof data.email !== 'string' || typeof data.telefone !== 'string') return null;
    const text = messages.filter((m) => m.role === 'user').map((m) => m.text).join(' ');
    const nome = data.nome.trim();
    const email = data.email.trim();
    const telefone = data.telefone.trim();
    if (!nome || !text.toLowerCase().includes(nome.toLowerCase()) ||
      !text.toLowerCase().includes(email.toLowerCase()) ||
      !text.replace(/\D/g, '').includes(telefone.replace(/\D/g, ''))) return null;

    return {
      nome,
      email,
      telefone,
      faixaOrcamento: FAIXAS_ORCAMENTO.includes(data.faixaOrcamento as typeof FAIXAS_ORCAMENTO[number])
        ? data.faixaOrcamento as string : 'Não informado',
      tipoImovel: TIPOS_IMOVEL.includes(data.tipoImovel as typeof TIPOS_IMOVEL[number])
        ? data.tipoImovel as string : 'Não informado',
    };
  } catch {
    return null;
  }
}

async function registerLeadIfComplete(messages: ConversationMessage[]): Promise<boolean> {
  if (!hasContactHints(messages)) return false;

  const userText = messages.filter((m) => m.role === 'user').map((m) => m.text).join('\n');
  const raw = await openRouterChat([
    { role: 'system', content: `Extraia APENAS informações explicitamente fornecidas pelo cliente.
Retorne somente JSON com nome, email, telefone, faixaOrcamento e tipoImovel.
Campos ausentes devem ser null. Não invente dados nem use informações do assistente.` },
    { role: 'user', content: userText },
  ], 256);
  const lead = parseExtractedLead(raw, messages);
  if (!lead) return false;

  const supabase = createServerSupabaseClient();
  const { data: existing, error } = await supabase
    .from('leads')
    .select('id')
    .eq('email', lead.email)
    .maybeSingle();
  if (error) throw error;
  if (existing) return false;

  const result = await createPublicLead(lead);
  if (!result.ok) throw new Error(`Falha ao criar lead: ${result.status}`);
  return true;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const messages = (body && typeof body === 'object' && !Array.isArray(body))
    ? (body as Record<string, unknown>).messages : null;
  if (!validMessages(messages)) {
    return NextResponse.json({ error: 'Histórico da conversa inválido.' }, { status: 400 });
  }
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'Assistente indisponível no momento.' }, { status: 503 });
  }

  try {
    const prefs = preferencesFrom(messages);
    const imoveis = await recomendarImoveis(prefs);
    const portfolio = imoveis.map((i) =>
      `${i.tipo} | ${i.endereco}, ${i.bairro} | R$ ${i.valor.toLocaleString('pt-BR')}`
    ).join('\n');
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\nPORTFÓLIO DISPONÍVEL:\n${portfolio || 'Nenhum imóvel compatível encontrado.'}` },
      ...messages.map((m) => ({ role: m.role, content: m.text })),
    ];
    const reply = await openRouterChat(chatMessages);

    let leadRegistrado = false;
    try {
      leadRegistrado = await registerLeadIfComplete(messages);
    } catch (error) {
      console.error('Falha ao registrar lead extraído:', error instanceof Error ? error.message : 'erro desconhecido');
    }

    return NextResponse.json({ reply, leadRegistrado });
  } catch (error) {
    console.error('Falha no assistente:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'Não foi possível responder agora. Tente novamente.' }, { status: 502 });
  }
}
