import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('etapa, faixa_orcamento, tipo_imovel')
    .eq('corretor_id', auth.uid);

  if (leadsError) {
    return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 });
  }

  const total = leads.length;
  const porEtapa: Record<string, number> = {};
  let fechados = 0;
  let emAtendimento = 0;

  for (const l of leads) {
    porEtapa[l.etapa] = (porEtapa[l.etapa] || 0) + 1;
    if (l.etapa === 'fechado') fechados++;
    if (l.etapa !== 'novo' && l.etapa !== 'fechado') emAtendimento++;
  }

  const taxaConversao = total > 0 ? Math.round((fechados / total) * 100) : 0;

  const { data: imoveis, error: imoveisError } = await supabase
    .from('imoveis')
    .select('tipo, valor')
    .eq('status', 'disponivel');

  let faturamentoEstimado = 0;
  if (!imoveisError && imoveis) {
    const tiposFechados = leads
      .filter((l) => l.etapa === 'fechado')
      .map((l) => l.tipo_imovel?.toLowerCase());

    for (const imovel of imoveis) {
      if (tiposFechados.some((t) => imovel.tipo?.toLowerCase().includes(t))) {
        faturamentoEstimado += Number(imovel.valor) || 0;
      }
    }
  }

  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

  const { count: novosTrintaDias } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('corretor_id', auth.uid)
    .gte('criado_em', trintaDiasAtras.toISOString());

  return NextResponse.json({
    total,
    porEtapa,
    emAtendimento,
    taxaConversao,
    faturamentoEstimado,
    novosTrintaDias: novosTrintaDias || 0,
  });
}
