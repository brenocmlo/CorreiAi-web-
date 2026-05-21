import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { inputToRow, rowToLead } from '@/lib/leads-mapper';
import { createServerSupabaseClient } from '@/lib/supabase';
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();

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

  const { id } = await context.params;
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const updatePayload: Record<string, string> = {
    atualizado_em: new Date().toISOString(),
  };

  if (body.nome) updatePayload.nome = body.nome;
  if (body.telefone) updatePayload.telefone = body.telefone;
  if (body.email) updatePayload.email = body.email;
  if (body.faixaOrcamento) updatePayload.faixa_orcamento = body.faixaOrcamento;
  if (body.tipoImovel) updatePayload.tipo_imovel = body.tipoImovel;
  if (body.etapa) updatePayload.etapa = body.etapa;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', id)
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

  const { id } = await context.params;
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('leads').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
