import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { isUuid } from '@/lib/imoveis-input';
import { ownerFilter, parseLeadStage } from '@/lib/lead-input';
import { rowToLead } from '@/lib/leads-mapper';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ETAPAS_FUNIL } from '@/types/lead';

type RouteContext = { params: Promise<{ id: string }> };
const VALID_STAGES = ETAPAS_FUNIL.map((stage) => stage.id);

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
  const parsed = parseLeadStage(body, VALID_STAGES);
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('leads')
    .update({ etapa: parsed.data, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq(...ownerFilter(auth.uid))
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
  return NextResponse.json({ lead: rowToLead(data) });
}
