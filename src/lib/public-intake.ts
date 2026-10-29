import { NextRequest, NextResponse } from 'next/server';
import { getPublicAgency, publicAgencyOwner } from './public-agency';
import {
  assistantSession,
  ASSISTANT_COOKIE,
  getAssistantLead,
  saveAssistantLead,
} from './assistant-store';
import {
  publicSessionHash,
  withAssistantSession,
} from './assistant-public-session';
import { qualificationFrom } from './assistant-qualification';
import { phoneDigits } from './phone';
import { isSameOriginRequest } from './request-origin';
import { boundedJson, RequestBodyError } from './bounded-json';
import { publicAttendanceLimit } from './public-attendance-limit';
import { inspectAssistantMessage } from './assistant-message-policy';

export async function publicLeadIntake(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 8192);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'JSON inválido.' }, { status: error instanceof RequestBodyError ? error.status : 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return NextResponse.json(
      { error: 'Informe seus dados de contato.' },
      { status: 400 },
    );
  const nome = typeof body.nome === 'string' ? body.nome.trim() : '',
    email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
    telefone = phoneDigits(body.telefone);
  if (
    nome.length < 3 ||
    nome.length > 120 ||
    /[<>\u0000-\u001f]/.test(nome) ||
    inspectAssistantMessage(nome) ||
    email.length > 254 ||
    !/^[^\s@%]+@[^\s@%]+\.[^\s@%]+$/.test(email) ||
    !telefone ||
    body.consentimento !== true ||
    (typeof body.website === 'string' && body.website.trim())
  )
    return NextResponse.json(
      {
        error:
          'Informe nome, e-mail e telefone válidos e autorize o atendimento.',
      },
      { status: 400 },
    );
  try {
    const agency = await getPublicAgency(
      request.nextUrl.searchParams.get('imobiliaria'),
    );
    if (!agency)
      return NextResponse.json(
        { error: 'Página da imobiliária não encontrada.' },
        { status: 404 },
      );
    const limited = await publicAttendanceLimit(request, agency.id, 'intake');
    if (limited) return limited;
    const owner = await publicAgencyOwner(agency.id);
    if (!owner)
      return NextResponse.json(
        {
          error:
            'A imobiliária ainda está preparando a equipe de atendimento. Tente novamente mais tarde.',
        },
        { status: 503 },
      );
    let session = assistantSession(
        request.cookies.get(ASSISTANT_COOKIE)?.value,
      ),
      hash = publicSessionHash(session.hash, agency.id);
    let existing = await getAssistantLead(hash, owner);
    if (
      existing?.qualificacao?.email &&
      existing.qualificacao.email.toLowerCase() !== email
    ) {
      session = assistantSession();
      hash = publicSessionHash(session.hash, agency.id);
      existing = null;
    }
    const q = qualificationFrom([], {}, existing?.qualificacao);
    Object.assign(q, { nome, email, telefone, permiteContato: true });
    const capture = await saveAssistantLead(
      hash,
      q,
      existing?.qualificacao?.historico ?? [],
      owner,
    );
    return withAssistantSession(
      NextResponse.json(
        { ok: true, captura: capture },
        { status: capture === 'criado' ? 201 : 200 },
      ),
      session.token,
    );
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível iniciar o atendimento. Tente novamente.' },
      { status: 503 },
    );
  }
}
