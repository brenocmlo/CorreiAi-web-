import { NextRequest, NextResponse } from 'next/server';
import { openRouterChat, OpenRouterError } from '@/lib/openrouter';
import { qualificationFrom, selectPortfolio } from '@/lib/assistant-qualification';
import { conciseReply, conversationPrompt, extractionMessages, fallbackReply, groundedReply } from '@/lib/assistant-prompt';
import { ASSISTANT_COOKIE, assistantSession, assistantOwner, getAssistantLead, saveAssistantLead } from '@/lib/assistant-store';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isUuid } from '@/lib/imoveis-input';
import type { AssistantProperty, CaptureStatus, ConversationMessage } from '@/types/assistant';
import { getAuthFromRequest } from '@/lib/api-auth';
import { scopeCatalog } from '@/lib/catalog-access';
import { presentImovel } from '@/lib/private-images';
import { createHash } from 'node:crypto';
import { isSameOriginRequest } from '@/lib/request-origin';

function accountSessionHash(hash: string, uid: string) {
  return createHash('sha256').update(`${uid}:${hash}`).digest('hex');
}

function validMessages(value: unknown): value is ConversationMessage[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 30 && value.every((m) => m && typeof m === 'object' &&
    (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim().length > 0 && m.text.length <= 2000) && value.at(-1).role === 'user';
}

function withSession(response: NextResponse, token: string) {
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set(ASSISTANT_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ASSISTANT_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return NextResponse.json({ atendimento: null }, { headers: { 'Cache-Control': 'no-store' } });
  try {
    const auth = await getAuthFromRequest(request);
    const owner = auth ? await assistantOwner(auth) : null;
    if (!auth || !owner) return NextResponse.json({ atendimento: null }, { headers: { 'Cache-Control': 'no-store' } });
    const lead = await getAssistantLead(accountSessionHash(assistantSession(token).hash, auth.uid), owner);
    return NextResponse.json({ atendimento: lead?.qualificacao ?? null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Não foi possível recuperar a conversa.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ASSISTANT_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || !validMessages(body.messages)) return NextResponse.json({ error: 'Histórico da conversa inválido.' }, { status: 400 });
  if (body.imovelId !== undefined && (typeof body.imovelId !== 'string' || !isUuid(body.imovelId))) return NextResponse.json({ error: 'Imóvel inválido.' }, { status: 400 });
  if (!process.env.OPENROUTER_API_KEY) return NextResponse.json({ error: 'Assistente indisponível no momento.' }, { status: 503 });

  const session = assistantSession(request.cookies.get(ASSISTANT_COOKIE)?.value);
  try {
    const auth = await getAuthFromRequest(request);
    const owner = auth ? await assistantOwner(auth) : null;
    const hash = auth ? accountSessionHash(session.hash, auth.uid) : null;
    const existing = hash && owner ? await getAssistantLead(hash, owner) : null;
    const raw = await openRouterChat(extractionMessages(body.messages), 512);
    let extracted: unknown = {};
    try { extracted = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); } catch { /* Não aproveitar fatos não comprovados. */ }
    const q = qualificationFrom(body.messages, extracted, existing?.qualificacao);
    // Visitante pode conversar, mas o portfólio e o funil exigem contexto autenticado.
    const catalog = auth && auth.role !== 'super_admin' ? await scopeCatalog(createServerSupabaseClient().from('imoveis').select('id,tipo,endereco,bairro,valor,metragem,quartos,vagas,descricao,imagem_url,status'), auth).eq('status', 'disponivel').order('valor', { ascending: true }).limit(500) : { data: [], error: null };
    const properties = (catalog.data ?? []) as AssistantProperty[];
    if (body.imovelId) {
      if (!properties.some((p) => p.id === body.imovelId && p.status === 'disponivel')) return withSession(NextResponse.json({ error: 'Esse imóvel não está disponível. Escolha outro imóvel do catálogo.' }, { status: 409 }), session.token);
      q.imovelInteresseId = body.imovelId as string;
    }
    if (q.imovelInteresseId && !properties.some((p) => p.id === q.imovelInteresseId)) q.imovelInteresseId = null;
    const matches = selectPortfolio(properties, q);
    if (q.imovelInteresseId && !matches.some((p) => p.id === q.imovelInteresseId)) q.imovelInteresseId = null;
    let reply: string;
    let aviso: string | undefined = catalog.error ? 'Não consegui consultar os imóveis agora. Sua busca pode continuar e um corretor verificará as opções.' : undefined;
    try {
      reply = await openRouterChat([{ role: 'system', content: conversationPrompt(q, matches, !catalog.error, body.messages.at(-1)!.text) }, ...body.messages.map((m) => ({ role: m.role, content: m.text }))], 512);
    } catch {
      reply = fallbackReply(q, matches.length);
      aviso = 'O atendimento está mais lento agora. Mantive sua busca; você pode tentar novamente.';
    }
    reply = conciseReply(groundedReply(reply, q, matches, !catalog.error, body.messages.at(-1)!.text));
    let captura: CaptureStatus = 'indisponivel';
    try { if (hash && owner) captura = await saveAssistantLead(hash, q, [...body.messages, { role: 'assistant', text: reply }], owner); }
    catch { aviso = 'Não consegui salvar o atendimento no funil agora. Seus dados não foram confirmados; tente enviar novamente.'; }
    if (!owner && q.permiteContato) aviso = 'Entre em uma conta vinculada à imobiliária para registrar o atendimento no funil.';
    return withSession(NextResponse.json({ reply, leadRegistrado: captura === 'criado', captura, qualificacao: q, imoveis: matches.map(presentImovel), ...(aviso ? { aviso } : {}) }), session.token);
  } catch (error) {
    const limited = error instanceof OpenRouterError && error.status === 429;
    const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    const status = limited ? 429 : timeout ? 504 : 503;
    return withSession(NextResponse.json({ error: limited ? 'O assistente está ocupado. Aguarde um pouco e tente novamente.' : timeout ? 'A resposta demorou mais que o esperado. Tente novamente; sua mensagem foi preservada.' : 'Não foi possível atender agora. Tente novamente.' }, { status, ...(limited ? { headers: { 'Retry-After': '30' } } : {}) }), session.token);
  }
}
