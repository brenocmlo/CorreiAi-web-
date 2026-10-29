import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from './supabase';

export async function publicAttendanceLimit(request: Request, companyId: string, action: 'chat' | 'intake') {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Configuração de atendimento indisponível.');
  // A cota total da empresa limita também clientes que alternem IP/cookie.
  // O banco recebe somente um hash; nunca persiste o endereço IP.
  const address = (request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim().slice(0, 128);
  const subject = createHmac('sha256', secret).update(`${companyId}:${action}:${address}`).digest('hex');
  const { data, error } = await createServerSupabaseClient().rpc('consume_public_attendance', {
    p_company: companyId, p_action: action, p_subject: subject,
  });
  if (error || typeof data !== 'boolean') throw new Error('Limitador de atendimento indisponível.');
  return data ? null : NextResponse.json(
    { error: 'Recebemos muitas solicitações agora. Aguarde um minuto e tente novamente. Se continuar, use o telefone da imobiliária.' },
    { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } },
  );
}
