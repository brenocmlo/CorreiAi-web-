import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { COLUNAS_PUBLICAS_IMOVEL, parseImovelInput } from '@/lib/imoveis-input';
import { createServerSupabaseClient } from '@/lib/supabase';
import { scopeCatalog } from '@/lib/catalog-access';
import { presentImovel, validateImovelImage } from '@/lib/private-images';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role === 'super_admin') return NextResponse.json({ error: 'Acesse a administração das imobiliárias.' }, { status: 403 });
  const { data, error } = await scopeCatalog(createServerSupabaseClient()
    .from('imoveis')
    .select(COLUNAS_PUBLICAS_IMOVEL), auth)
    .order('criado_em', { ascending: false });

  if (error) return NextResponse.json({ error: 'Não foi possível listar os imóveis.' }, { status: 500 });
  return NextResponse.json({ imoveis: (data ?? []).map(presentImovel) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role === 'lead' || auth.role === 'super_admin') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const parsed = parseImovelInput(body);
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!await validateImovelImage(parsed.data, auth)) {
    return NextResponse.json({ error: 'URL da imagem fora do bucket de imóveis.' }, { status: 400 });
  }

  const { data, error } = await createServerSupabaseClient()
    .from('imoveis')
    .insert({ ...parsed.data, proprietario_id: auth.uid, imobiliaria_id: auth.imobiliariaId })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: 'Não foi possível cadastrar o imóvel.' }, { status: 500 });
  return NextResponse.json({ imovel: presentImovel(data) }, { status: 201 });
}
