import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { recomendarImoveis, type PreferenciasLead } from '@/lib/recomendacao';
import { FAIXAS_ORCAMENTO, TIPOS_IMOVEL } from '@/types/lead';

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

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Erro no assistente:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a mensagem. Tente novamente.' },
      { status: 500 }
    );
  }
}
