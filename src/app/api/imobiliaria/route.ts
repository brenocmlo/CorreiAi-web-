import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { phoneDigits } from '@/lib/phone';
import { isSameOriginRequest } from '@/lib/request-origin';

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
    .select('id,nome,telefone')
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
    Object.keys(body).some((k) => k !== 'telefone')
  )
    return NextResponse.json(
      { error: 'Informe somente o telefone oficial.' },
      { status: 400 },
    );
  const telefone =
    body.telefone === null || body.telefone === ''
      ? null
      : phoneDigits(body.telefone);
  if (telefone === null && body.telefone !== null && body.telefone !== '')
    return NextResponse.json(
      { error: 'Informe telefone com DDD, de 10 a 15 dígitos.' },
      { status: 400 },
    );
  const { data, error } = await createServerSupabaseClient()
    .from('imobiliarias')
    .update({ telefone })
    .eq('id', auth.imobiliariaId)
    .select('id,telefone')
    .maybeSingle();
  if (error || !data)
    return NextResponse.json(
      { error: 'Não foi possível salvar o telefone.' },
      { status: 503 },
    );
  return NextResponse.json({ ok: true, telefone: data.telefone });
}
