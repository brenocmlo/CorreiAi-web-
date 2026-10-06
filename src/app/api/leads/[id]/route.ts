import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { rowToLead } from '@/lib/leads-mapper';
import { ownerFilter, parseLeadDetails } from '@/lib/lead-input';
import { isUuid } from '@/lib/imoveis-input';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ETAPAS_FUNIL, type EtapaFunil } from '@/types/lead';
type RouteContext = { params: Promise<{ id: string }> };
const ETAPAS_VALIDAS = new Set<EtapaFunil>(ETAPAS_FUNIL.map((etapa) => etapa.id));

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  if (auth.role === 'lead') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('leads').select('*').eq('id', id)
    .eq(...ownerFilter(auth.uid)).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ lead: rowToLead(data) });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  if (auth.role === 'lead') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const parsed = parseLeadDetails(body, { partial: true, allowEmpty: true });
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const input = body as Record<string, unknown>;
  const hasEtapa = Object.hasOwn(input, 'etapa');
  if (hasEtapa && (typeof input.etapa !== 'string' || !ETAPAS_VALIDAS.has(input.etapa as EtapaFunil))) {
    return NextResponse.json({ error: 'Etapa inválida.' }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0 && !hasEtapa) {
    return NextResponse.json({ error: 'Informe ao menos um campo para editar.' }, { status: 400 });
  }

  const updatePayload: Record<string, string> = {
    atualizado_em: new Date().toISOString(),
  };

  if (parsed.data.nome) updatePayload.nome = parsed.data.nome;
  if (parsed.data.telefone) updatePayload.telefone = parsed.data.telefone;
  if (parsed.data.email) updatePayload.email = parsed.data.email;
  if (parsed.data.faixaOrcamento) updatePayload.faixa_orcamento = parsed.data.faixaOrcamento;
  if (parsed.data.tipoImovel) updatePayload.tipo_imovel = parsed.data.tipoImovel;
  if (hasEtapa) updatePayload.etapa = input.etapa as string;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('leads').update(updatePayload).eq('id', id)
    .eq(...ownerFilter(auth.uid))
    .select('*')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ lead: rowToLead(data) });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  if (auth.role === 'lead') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('leads').delete().eq('id', id)
    .eq(...ownerFilter(auth.uid))
    .select('id').maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
