import { NextRequest, NextResponse } from 'next/server';
import { openRouterChat, OpenRouterError } from '@/lib/openrouter';
import {
  normalize,
  qualificationFrom,
  selectPortfolio,
} from '@/lib/assistant-qualification';
import {
  conversationPrompt,
  extractionMessages,
  fallbackReply,
} from '@/lib/assistant-prompt';
import {
  ASSISTANT_COOKIE,
  assistantSession,
  getAssistantLead,
  saveAssistantLead,
} from '@/lib/assistant-store';
import { assistantScope } from '@/lib/assistant-scope';
import {
  inspectAssistantMessage,
  messagePolicyReply,
} from '@/lib/assistant-message-policy';
import { withAssistantSession as withSession } from '@/lib/assistant-public-session';
import {
  PublicAgencyNotFound,
  presentPublicProperty,
} from '@/lib/public-agency';
import {
  directAnswer,
  directedReply,
  turnSuggestions,
  wantsContact,
  propertyQuestion,
} from '@/lib/assistant-turn';
import { createServerSupabaseClient } from '@/lib/supabase';
import { presentImovel } from '@/lib/private-images';
import { isSameOriginRequest } from '@/lib/request-origin';
import { isUuid } from '@/lib/imoveis-input';
import { boundedJson, RequestBodyError } from '@/lib/bounded-json';
import { publicAttendanceLimit } from '@/lib/public-attendance-limit';
import { asksForCatalog } from '@/lib/assistant-entry-flow';
import { sharedAgencyLink } from '@/lib/assistant-shared-link';
import { getPublicAgency } from '@/lib/public-agency';
import { publicAgencyPath } from '@/lib/public-agency-path';
import { getDemoAgency } from '@/lib/assistant-demo';
import { demoAttendanceLimit } from '@/lib/assistant-demo-limit';
import type {
  AssistantProperty,
  CaptureStatus,
  ConversationMessage,
  Qualification,
} from '@/types/assistant';

function validMessages(value: unknown): value is ConversationMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 30 &&
    value.every(
      (m) =>
        m &&
        typeof m === 'object' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.text === 'string' &&
        m.text.trim().length > 0 &&
        m.text.length <= 2000,
    ) &&
    value.at(-1).role === 'user'
  );
}
async function catalogFor(companyId: string | null) {
  if (!companyId) return { data: [], error: null };
  // O vínculo vem da sessão validada. Nunca usar empresa ou proprietário recebidos no body.
  return createServerSupabaseClient()
    .from('imoveis')
    .select(
      'id,tipo,endereco,bairro,valor,metragem,quartos,vagas,descricao,imagem_url,status',
    )
    .eq('imobiliaria_id', companyId)
    .eq('status', 'disponivel')
    .order('valor', { ascending: true })
    .limit(500);
}
function needsExtraction(q: Qualification, text: string) {
  const value = normalize(text);
  return (
    (!q.bairro && /prefiro|regiao|localizacao/.test(value)) ||
    (!q.nome && /me chame|aqui e|meu nome/.test(value)) ||
    (!q.prazo && /\b(?:meses?|semanas?|urgente|semestre)\b/.test(value)) ||
    (!q.formaPagamento &&
      /(?:vou|quero|pretendo).{0,15}(?:financiar|pagar)|\bfgts\b|a vista/.test(
        value,
      )) ||
    (q.visitaSolicitada &&
      !q.visitaPreferencia &&
      /amanha|hoje|sabado|domingo|segunda|terca|quarta|quinta|sexta|\d+h|\d+:\d+/.test(
        value,
      )) ||
    /(?:quero|preciso|prefiro).{0,30}(?:varanda|elevador|aceita pet)/.test(
      value,
    )
  );
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ASSISTANT_COOKIE)?.value;
    const scope = await assistantScope(request, assistantSession(token).hash);
    const { context, owner, hash } = scope;
    const lead =
      token && /^[A-Za-z0-9_-]{43}$/.test(token) && hash && owner
        ? await getAssistantLead(hash, owner)
        : null;
    const catalog =
      lead?.qualificacao && context.catalogState === 'available'
        ? await catalogFor(scope.companyId)
        : { data: [], error: null };
    if (catalog.error) context.catalogState = 'unavailable';
    return NextResponse.json(
      {
        atendimento: lead?.qualificacao ?? null,
        contexto: context,
        imoveis: lead?.qualificacao
          ? selectPortfolio(
              (catalog.data ?? []) as AssistantProperty[],
              lead.qualificacao,
            )
              .slice(0, 3)
              .map((row) =>
                scope.publicSlug
                  ? presentPublicProperty(row, scope.publicSlug)
                  : presentImovel(row),
              )
          : [],
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    if (error instanceof PublicAgencyNotFound)
      return NextResponse.json(
        { error: 'Página da imobiliária não encontrada.' },
        { status: 404 },
      );
    return NextResponse.json(
      { error: 'Não foi possível recuperar a conversa.' },
      { status: 503 },
    );
  }
}
export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const response = NextResponse.json(
    { ok: true },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
  if (getDemoAgency(request.nextUrl.searchParams.get('demo'))) return response;
  response.cookies.set(ASSISTANT_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 262144);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'JSON inválido.' },
      { status: error instanceof RequestBodyError ? error.status : 400 },
    );
  }
  if (!body || typeof body !== 'object' || !validMessages(body.messages))
    return NextResponse.json(
      { error: 'Histórico da conversa inválido.' },
      { status: 400 },
    );
  if (
    body.imovelId !== undefined &&
    (typeof body.imovelId !== 'string' || !isUuid(body.imovelId))
  )
    return NextResponse.json({ error: 'Imóvel inválido.' }, { status: 400 });
  const last = body.messages.at(-1)!.text;
  const policy = inspectAssistantMessage(last);
  const messages = body.messages.filter(
      (message) => !inspectAssistantMessage(message.text),
    ),
    session = assistantSession(request.cookies.get(ASSISTANT_COOKIE)?.value);
  try {
    const scope = await assistantScope(request, session.hash, last);
    const { auth, context, owner, hash } = scope;
    if (scope.demoSlug) {
      const limited = demoAttendanceLimit(request);
      if (limited) return limited;
    }
    if (scope.publicSlug && scope.companyId) {
      const limited = await publicAttendanceLimit(
        request,
        scope.companyId,
        'chat',
      );
      if (limited) return limited;
    }
    const [existing, catalog] = await Promise.all([
      hash && owner ? getAssistantLead(hash, owner) : Promise.resolve(null),
      context.catalogState === 'available'
        ? scope.demoSlug
          ? Promise.resolve({
              data: getDemoAgency(scope.demoSlug)!.imoveis,
              error: null,
            })
          : catalogFor(scope.companyId)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (catalog.error) context.catalogState = 'unavailable';
    const properties = (catalog.data ?? []) as AssistantProperty[];
    if (context.catalogState === 'available') {
      context.catalogCount = properties.length;
      context.catalogTypes = [...new Set(properties.map((p) => p.tipo))];
    }
    let q = qualificationFrom(messages, {}, existing?.qualificacao);
    if (scope.demoSlug) {
      q.nome = null;
      q.email = null;
      q.telefone = null;
    }
    if (policy)
      return withSession(
        NextResponse.json({
          reply: messagePolicyReply(policy),
          leadRegistrado: false,
          captura: 'sem_alteracao',
          qualificacao: q,
          imoveis: [],
          contexto: context,
          sugestoes:
            context.catalogState === 'available'
              ? ['Quero comprar', 'Quero alugar', 'Quero anunciar']
              : ['Como escolher um imóvel?'],
        }),
        session.token,
      );
    const sharedLink = !scope.publicSlug && !scope.demoSlug
      ? sharedAgencyLink(last, request.nextUrl.origin)
      : null;
    if (sharedLink) {
      const agency = sharedLink.valid
        ? await getPublicAgency(sharedLink.slug)
        : null;
      return withSession(
        NextResponse.json({
          reply: agency
            ? `Esse é o atendimento público de ${agency.nome}. Abra o botão abaixo para ver as ofertas dessa imobiliária e conversar com ela, sem login de corretor.`
            : 'Não consegui verificar uma página pública ativa nesse endereço. Você pode confirmar o link de atendimento com a imobiliária?',
          ...(agency
            ? {
                continuarEm: {
                  href: publicAgencyPath(agency.public_slug),
                  label: `Abrir atendimento de ${agency.nome}`,
                },
              }
            : {}),
          leadRegistrado: false,
          captura: 'sem_alteracao',
          qualificacao: q,
          imoveis: [],
          contexto: context,
          sugestoes: agency ? [] : ['Não tenho esse link'],
        }),
        session.token,
      );
    }
    if (
      !scope.demoSlug &&
      process.env.OPENROUTER_API_KEY &&
      needsExtraction(q, last)
    ) {
      const raw = await openRouterChat(extractionMessages(messages), 350);
      let extracted: unknown = {};
      try {
        extracted = JSON.parse(
          raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''),
        );
      } catch {
        /* Fatos locais continuam válidos. */
      }
      q = qualificationFrom(messages, extracted, existing?.qualificacao);
    }
    if (
      auth?.role === 'lead' &&
      (wantsContact(last) || q.visitaSolicitada) &&
      q.permiteContato
    ) {
      q.nome = q.nome || auth.nome_completo;
      q.email = q.email || auth.email;
    }
    if (body.imovelId) {
      if (!properties.some((p) => p.id === body.imovelId))
        return withSession(
          NextResponse.json(
            {
              error:
                'Esse imóvel não está disponível neste atendimento. Escolha outro imóvel do catálogo.',
            },
            { status: 409 },
          ),
          session.token,
        );
      q.imovelInteresseId = body.imovelId as string;
    }
    if (
      q.imovelInteresseId &&
      !properties.some((p) => p.id === q.imovelInteresseId)
    )
      q.imovelInteresseId = null;
    const selectedProperty = properties.find(
      (p) => p.id === q.imovelInteresseId,
    );
    const selectedMatch =
      selectedProperty &&
      q.objetivo !== 'alugar' &&
      q.objetivo !== 'vender' &&
      (selectPortfolio([selectedProperty], q).length ||
        (!q.tipoImovel && !q.bairro && q.orcamentoMax === null) ||
        propertyQuestion(last))
        ? selectedProperty
        : null;
    const matches = selectedMatch
      ? [
          selectedMatch,
          ...selectPortfolio(properties, q).filter(
            (p) => p.id !== selectedMatch.id,
          ),
        ].slice(0, 3)
      : asksForCatalog(last) &&
          !q.tipoImovel &&
          !q.bairro &&
          q.orcamentoMax === null &&
          q.objetivo !== 'alugar' &&
          q.objetivo !== 'vender'
        ? properties.slice(0, 3)
        : selectPortfolio(properties, q).slice(0, 3);
    if (
      q.imovelInteresseId &&
      !matches.some((p) => p.id === q.imovelInteresseId)
    )
      q.imovelInteresseId = null;
    let reply = directAnswer(messages, q, matches, context),
      aviso: string | undefined;
    if (!reply) {
      if (!process.env.OPENROUTER_API_KEY)
        return NextResponse.json(
          {
            error:
              'Assistente indisponível no momento. Tente novamente em instantes.',
          },
          { status: 503 },
        );
      try {
        reply = await openRouterChat(
          [
            {
              role: 'system',
              content:
                (scope.demoSlug
                  ? 'Esta é uma demonstração comercial do sistema CorreAI. As empresas, imóveis e valores são fictícios. Não solicite dados pessoais nem afirme cadastro, contato ou visita real.\n'
                  : '') +
                conversationPrompt(
                  q,
                  matches,
                  context.catalogState === 'available',
                  last,
                ),
            },
            ...messages.map((m) => ({ role: m.role, content: m.text })),
          ],
          350,
        );
        if (/^\s*[\[{]/.test(reply)) reply = fallbackReply(q, matches.length);
      } catch (error) {
        if (error instanceof OpenRouterError && error.status === 429)
          throw error;
        reply = fallbackReply(q, matches.length);
        aviso =
          'O atendimento está mais lento agora. Você pode tentar novamente.';
      }
    }
    reply = directedReply(reply, messages, q, matches, context);
    let captura: CaptureStatus = scope.demoSlug
      ? 'demonstracao'
      : 'indisponivel';
    try {
      if (hash && owner)
        captura = await saveAssistantLead(
          hash,
          q,
          [...messages, { role: 'assistant', text: reply }],
          owner,
        );
    } catch {
      aviso =
        'Não consegui salvar o atendimento no funil agora. O envio ao corretor não foi confirmado; tente novamente.';
    }
    if (!scope.demoSlug && !owner && wantsContact(last))
      aviso = scope.publicSlug
        ? 'A imobiliária ainda está preparando a equipe de atendimento. Use o telefone comercial para falar com ela.'
        : 'Para encaminhar o atendimento, entre em uma conta vinculada à imobiliária.';
    return withSession(
      NextResponse.json({
        reply,
        leadRegistrado: captura === 'criado',
        captura,
        qualificacao: q,
        imoveis: matches.map((row) =>
          scope.demoSlug
            ? row
            : scope.publicSlug
              ? presentPublicProperty(row, scope.publicSlug)
              : presentImovel(row),
        ),
        contexto: context,
        sugestoes: turnSuggestions(messages, q, matches, context),
        ...(aviso ? { aviso } : {}),
      }),
      session.token,
    );
  } catch (error) {
    if (error instanceof PublicAgencyNotFound)
      return NextResponse.json(
        { error: 'Página da imobiliária não encontrada.' },
        { status: 404 },
      );
    const limited = error instanceof OpenRouterError && error.status === 429;
    const timeout =
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError');
    return withSession(
      NextResponse.json(
        {
          error: limited
            ? 'O assistente está ocupado. Aguarde um pouco e tente novamente.'
            : timeout
              ? 'A resposta demorou. Sua mensagem foi preservada; tente novamente.'
              : 'Não foi possível atender agora. Tente novamente.',
        },
        {
          status: limited ? 429 : timeout ? 504 : 503,
          ...(limited ? { headers: { 'Retry-After': '30' } } : {}),
        },
      ),
      session.token,
    );
  }
}
