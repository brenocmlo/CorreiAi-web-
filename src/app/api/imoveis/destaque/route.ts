import { NextResponse } from 'next/server';
import { COLUNAS_PUBLICAS_IMOVEL } from '@/lib/imoveis-input';
import { createServerSupabaseClient } from '@/lib/supabase';
import { presentImovel } from '@/lib/private-images';

// Pública, sem autenticação: só devolve os imóveis que o próprio corretor
// marcou explicitamente para aparecer na vitrine da landing. O catálogo
// privado de cada imobiliária continua inacessível por aqui.
export async function GET() {
  const { data, error } = await createServerSupabaseClient()
    .from('imoveis')
    .select(COLUNAS_PUBLICAS_IMOVEL)
    .eq('destaque_landing', true)
    .eq('status', 'disponivel')
    .order('criado_em', { ascending: false })
    .limit(8);

  if (error) return NextResponse.json({ error: 'Não foi possível listar os destaques.' }, { status: 500 });
  return NextResponse.json(
    { imoveis: (data ?? []).map(presentImovel) },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  );
}
