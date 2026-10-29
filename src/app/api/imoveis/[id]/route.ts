import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { COLUNAS_PUBLICAS_IMOVEL, isUuid, parseImovelInput } from '@/lib/imoveis-input';
import { createServerSupabaseClient } from '@/lib/supabase';
import { scopeCatalog } from '@/lib/catalog-access';
import { presentImovel, validateImovelImage } from '@/lib/private-images';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role === 'super_admin') return NextResponse.json({ error: 'Acesse a administração das imobiliárias.' }, { status: 403 });
  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  const { data, error } = await scopeCatalog(createServerSupabaseClient()
    .from('imoveis').select(COLUNAS_PUBLICAS_IMOVEL).eq('id', id), auth).maybeSingle();

  if (error) return NextResponse.json({ error: 'Não foi possível consultar o imóvel.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  return NextResponse.json({ imovel: presentImovel(data) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role === 'lead' || auth.role === 'super_admin') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

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
  if (!await validateImovelImage(parsed.data, auth, id)) {
    return NextResponse.json({ error: 'URL da imagem fora do bucket de imóveis.' }, { status: 400 });
  }

  const { data, error } = await scopeCatalog(createServerSupabaseClient()
    .from('imoveis').update(parsed.data).eq('id', id), auth).select('*').maybeSingle();

  if (error) return NextResponse.json({ error: 'Não foi possível editar o imóvel.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  return NextResponse.json({ imovel: presentImovel(data) });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role === 'lead' || auth.role === 'super_admin') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  const { data, error } = await scopeCatalog(createServerSupabaseClient()
    .from('imoveis').delete().eq('id', id), auth).select('id').maybeSingle();

  if (error) return NextResponse.json({ error: 'Não foi possível excluir o imóvel.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
