import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { recomendarImoveis, type PreferenciasLead } from '@/lib/recomendacao';
import { FAIXAS_ORCAMENTO, TIPOS_IMOVEL } from '@/types/lead';
import { createServerSupabaseClient } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `Você é o assistente virtual da imobiliária CorreIA. Seu nome é CorretorIA.

Seu objetivo é ajudar pessoas a encontrar o imóvel ideal. Você deve:

1. Receber o visitante com simpatia e se apresentar brevemente.
2. Perguntar sobre as preferências do cliente: tipo de imóvel (Apartamento, Casa, Cobertura, Studio, Terreno, Comercial), faixa de orçamento e bairro de interesse.
3. Quando receber uma lista de imóveis compatíveis no contexto da conversa, apresente os melhores de forma clara: nome do imóvel, tipo, bairro, valor e características.
4. Se o cliente demonstrar interesse em algum imóvel, oferecer agendamento de visita.
5. Para agendar, coletar: nome completo, telefone e e-mail do cliente.
6. Ser sempre cordial, profissional e objetivo. Não invente imóveis que não estejam na lista fornecida.
7. Responda em português do Brasil, com tom acolhedor mas direto.`; 

function extrairPreferencias(messages: { role: string; text: string }[]): PreferenciasLead {
  const texto = messages.map((m) => m.text).join(' ').toLowerCase();
  const prefs: PreferenciasLead = {};

  for (const tipo of TIPOS_IMOVEL) {
    if (texto.includes(tipo.toLowerCase())) {
      prefs.tipoImovel = tipo;
      break;
    }
  }

  for (const faixa of FAIXAS_ORCAMENTO) {
    if (texto.includes(faixa.toLowerCase())) {
      prefs.faixaOrcamento = faixa;
      break;
    }
  }

  return prefs;
}

function formatarImoveisParaPrompt(imoveis: Awaited<ReturnType<typeof recomendarImoveis>>): string {
  if (imoveis.length === 0) return '';
  return imoveis
    .map(
      (i, idx) =>
        `${idx + 1}. ${i.tipo} - ${i.endereco}, ${i.bairro} | R$ ${i.valor.toLocaleString('pt-BR')} | ${i.metragem || '?'}m² | ${i.quartos || '?'} quartos | ${i.vagas || '?'} vagas`
    )
    .join('\n');
}

async function extrairDadosLeadComGemini(messages: { role: string; text: string }[]): Promise<{
  nome: string | null;
  email: string | null;
  telefone: string | null;
  faixaOrcamento: string | null;
  tipoImovel: string | null;
} | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const conversationText = messages
      .map((m) => `${m.role === 'assistant' ? 'Assistente' : 'Cliente'}: ${m.text}`)
      .join('\n');

    const prompt = `Analise a conversa abaixo entre um assistente imobiliário (CorretorIA) e um cliente.
Extraia as informações de contato do cliente (se fornecidas na conversa) e as suas preferências de imóvel.
Retorne um objeto JSON estritamente no seguinte formato:
{
  "nome": string ou null (nome completo do cliente),
  "email": string ou null (email do cliente),
  "telefone": string ou null (telefone do cliente),
  "faixaOrcamento": string ou null (ex: "Até R$ 300 mil", "R$ 300 mil – R$ 500 mil", "R$ 500 mil – R$ 800 mil", "R$ 800 mil – R$ 1,2 mi", "Acima de R$ 1,2 mi"),
  "tipoImovel": string ou null (ex: "Apartamento", "Casa", "Cobertura", "Studio", "Terreno", "Comercial")
}

Preencha apenas o que foi explicitamente fornecido na conversa. Se o cliente não forneceu nome, email ou telefone de contato, retorne null para esses campos.

Conversa:
${conversationText}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);
    return data;
  } catch (err) {
    console.error('Erro ao extrair lead via Gemini:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array é obrigatório' }, { status: 400 });
    }

    const prefs = extrairPreferencias(messages);
    const imoveis = await recomendarImoveis(prefs);
    const listaImoveis = formatarImoveisParaPrompt(imoveis);

    let systemPrompt = SYSTEM_PROMPT;
    if (listaImoveis) {
      systemPrompt += `\n\nIMÓVEIS DISPONÍVEIS NO PORTFÓLIO (use estes dados para recomendar):\n${listaImoveis}`;
    }

    const model = getGeminiModel(systemPrompt);

    const primeiroUser = messages.findIndex((m: { role: string }) => m.role === 'user');
    const history = messages
      .slice(primeiroUser >= 0 ? primeiroUser : 0, -1)
      .map((m: { role: string; text: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

    const chat = model.startChat({ history });
    const lastMsg = messages[messages.length - 1]?.text || '';

    const result = await chat.sendMessage(lastMsg);
    const reply = result.response.text();

    // Tenta extrair dados do lead e salvar no banco em background
    if (messages.length > 0) {
      try {
        const dadosLead = await extrairDadosLeadComGemini(messages);
        if (dadosLead && dadosLead.nome && dadosLead.email && dadosLead.telefone) {
          const supabase = createServerSupabaseClient();
          
          // Verifica se o lead com este email já existe
          const { data: existente } = await supabase
            .from('leads')
            .select('id')
            .eq('email', dadosLead.email.trim())
            .maybeSingle();

          if (!existente) {
            // Busca o primeiro corretor cadastrado no sistema para associar o lead
            const { data: corretores } = await supabase
              .from('perfis')
              .select('id')
              .eq('role', 'corretor')
              .limit(1);

            const corretorId = corretores && corretores.length > 0 ? corretores[0].id : null;

            await supabase
              .from('leads')
              .insert([
                {
                  nome: dadosLead.nome.trim(),
                  telefone: dadosLead.telefone.trim(),
                  email: dadosLead.email.trim(),
                  faixa_orcamento: dadosLead.faixaOrcamento || 'Até R$ 300 mil',
                  tipo_imovel: dadosLead.tipoImovel || 'Apartamento',
                  etapa: 'novo',
                  corretor_id: corretorId,
                },
              ]);
            console.log(`[Assistente] Lead ${dadosLead.nome} inserido e associado ao corretor ${corretorId}`);
          }
        }
      } catch (err) {
        console.error('Erro ao salvar lead extraído da conversa:', err);
      }
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Erro no assistente:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a mensagem. Tente novamente.' },
      { status: 500 }
    );
  }
}
