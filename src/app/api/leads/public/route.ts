import { NextRequest, NextResponse } from 'next/server';
import { inputToRow, rowToLead } from '@/lib/leads-mapper';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { EtapaFunil } from '@/types/lead';
import { ETAPAS_FUNIL } from '@/types/lead';

const ETAPAS_VALIDAS = new Set(ETAPAS_FUNIL.map((e) => e.id));

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const { nome, telefone, email, faixaOrcamento, tipoImovel, etapa } = body as Record<
    string,
    string
  >;

  if (!nome?.trim() || !telefone?.trim() || !email?.trim() || !faixaOrcamento || !tipoImovel) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
  }

  const etapaFinal: EtapaFunil =
    etapa && ETAPAS_VALIDAS.has(etapa as EtapaFunil) ? (etapa as EtapaFunil) : 'novo';

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('leads')
    .insert([
      {
        ...inputToRow({
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
          faixaOrcamento,
          tipoImovel,
          etapa: etapaFinal,
        }),
        corretor_id: null,
      },
    ])
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lead: rowToLead(data) }, { status: 201 });
}
