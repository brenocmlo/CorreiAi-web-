import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { phoneDigits } from '@/lib/phone';
import { isSameOriginRequest } from '@/lib/request-origin';
import { isPublicAgencySlug } from '@/lib/public-agency-path';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth)
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role !== 'admin_corretora' || !auth.imobiliariaId)
    return NextResponse.json(
      { error: 'Acesso restrito ao administrador da imobiliária.' },
      { status: 403 },
    );
  const { data, error } = await createServerSupabaseClient()
    .from('imobiliarias')
    .select('id,nome,telefone,public_slug,atendimento_publico')
    .eq('id', auth.imobiliariaId)
    .maybeSingle();
  if (error || !data)
    return NextResponse.json(
      { error: 'Não foi possível consultar o contato da empresa.' },
      { status: 503 },
    );
  return NextResponse.json(
    { imobiliaria: data },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const auth = await getAuthFromRequest(request);
  if (!auth)
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role !== 'admin_corretora' || !auth.imobiliariaId)
    return NextResponse.json(
      { error: 'Acesso restrito ao administrador da imobiliária.' },
      { status: 403 },
    );
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    !Object.keys(body).length ||
    Object.keys(body).some(
      (k) => !['telefone', 'public_slug', 'atendimento_publico'].includes(k),
    )
  )
    return NextResponse.json(
      {
        error:
          'Informe apenas telefone e configurações da página da imobiliária.',
      },
      { status: 400 },
    );
  const updates: {
    telefone?: string | null;
    public_slug?: string | null;
    atendimento_publico?: boolean;
  } = {};
  if ('telefone' in body) {
    const telefone =
      body.telefone === null || body.telefone === ''
        ? null
        : phoneDigits(body.telefone);
    if (telefone === null && body.telefone !== null && body.telefone !== '')
      return NextResponse.json(
        { error: 'Informe telefone com DDD, de 10 a 15 dígitos.' },
        { status: 400 },
      );
    updates.telefone = telefone;
  }
  if ('public_slug' in body) {
    if (body.public_slug !== null && !isPublicAgencySlug(body.public_slug))
      return NextResponse.json(
        {
          error:
            'Use de 3 a 80 letras minúsculas, números e hífens no endereço do link.',
        },
        { status: 400 },
      );
    updates.public_slug = body.public_slug as string | null;
  }
  if ('atendimento_publico' in body) {
    if (typeof body.atendimento_publico !== 'boolean')
      return NextResponse.json(
        { error: 'Informe se a página pública está ativa.' },
        { status: 400 },
      );
    updates.atendimento_publico = body.atendimento_publico;
  }
  const db = createServerSupabaseClient();
  if ('public_slug' in updates || 'atendimento_publico' in updates) {
    const current = await db
      .from('imobiliarias')
      .select('public_slug,atendimento_publico')
      .eq('id', auth.imobiliariaId)
      .maybeSingle();
    if (current.error || !current.data)
      return NextResponse.json(
        { error: 'Não foi possível consultar a configuração.' },
        { status: 503 },
      );
    const enabled =
      updates.atendimento_publico ?? current.data.atendimento_publico ?? false;
    const slug =
      'public_slug' in updates ? updates.public_slug : current.data.public_slug;
    if (enabled && !slug)
      return NextResponse.json(
        { error: 'Defina o endereço do link antes de publicar a página.' },
        { status: 400 },
      );
  }
  const { data, error } = await db
    .from('imobiliarias')
    .update(updates)
    .eq('id', auth.imobiliariaId)
    .select('id,telefone,public_slug,atendimento_publico')
    .maybeSingle();
  if (error?.code === '23505')
    return NextResponse.json(
      { error: 'Esse endereço já está em uso. Escolha outro.' },
      { status: 409 },
    );
  if (error || !data)
    return NextResponse.json(
      { error: 'Não foi possível salvar as configurações da imobiliária.' },
      { status: 503 },
    );
  return NextResponse.json({
    ok: true,
    telefone: data.telefone,
    public_slug: data.public_slug,
    atendimento_publico: data.atendimento_publico,
  });
}
