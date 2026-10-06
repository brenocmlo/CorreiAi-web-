import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { isUuid, parseImovelInput } from '@/lib/imoveis-input';
import { createServerSupabaseClient } from '@/lib/supabase';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!getAuthFromRequest(request)) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  const { data, error } = await createServerSupabaseClient()
    .from('imoveis').select('*').eq('id', id).maybeSingle();

  if (error) return NextResponse.json({ error: 'Não foi possível consultar o imóvel.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  return NextResponse.json({ imovel: data });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role === 'lead') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  const parsed = parseImovelInput(body, { partial: true });
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data, error } = await createServerSupabaseClient()
    .from('imoveis').update(parsed.data).eq('id', id).select('*').maybeSingle();

  if (error) return NextResponse.json({ error: 'Não foi possível editar o imóvel.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  return NextResponse.json({ imovel: data });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role === 'lead') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  const { data, error } = await createServerSupabaseClient()
    .from('imoveis').delete().eq('id', id).select('id').maybeSingle();

  if (error) return NextResponse.json({ error: 'Não foi possível excluir o imóvel.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
