import { NextRequest, NextResponse } from 'next/server';
import { recomendarImoveis, type PreferenciasLead } from '@/lib/recomendacao';
import { FAIXAS_ORCAMENTO, TIPOS_IMOVEL } from '@/types/lead';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tipoImovel = params.get('tipoImovel')?.trim();
  const faixaOrcamento = params.get('faixaOrcamento')?.trim();
  const bairro = params.get('bairro')?.trim();

  if (
    [...params.keys()].some((key) => !['tipoImovel', 'faixaOrcamento', 'bairro'].includes(key)) ||
    (tipoImovel && !TIPOS_IMOVEL.includes(tipoImovel as typeof TIPOS_IMOVEL[number])) ||
    (faixaOrcamento && !FAIXAS_ORCAMENTO.includes(faixaOrcamento as typeof FAIXAS_ORCAMENTO[number])) ||
    (bairro && bairro.length > 80)
  ) {
    return NextResponse.json({ error: 'Filtros de recomendação inválidos.' }, { status: 400 });
  }

  const prefs: PreferenciasLead = {
    tipoImovel: tipoImovel || undefined,
    faixaOrcamento: faixaOrcamento || undefined,
    bairro: bairro || undefined,
  };
  const imoveis = await recomendarImoveis(prefs);
  return NextResponse.json({ imoveis });
}
