import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { parseImovelInput } from '@/lib/imoveis-input';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  if (!getAuthFromRequest(request)) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { data, error } = await createServerSupabaseClient()
    .from('imoveis')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) return NextResponse.json({ error: 'Não foi possível listar os imóveis.' }, { status: 500 });
  return NextResponse.json({ imoveis: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role === 'lead') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const parsed = parseImovelInput(body);
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data, error } = await createServerSupabaseClient()
    .from('imoveis')
    .insert(parsed.data)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: 'Não foi possível cadastrar o imóvel.' }, { status: 500 });
  return NextResponse.json({ imovel: data }, { status: 201 });
}
