import { createServerSupabaseClient } from './supabase.ts';
import { scopeCatalog, type CatalogAccess } from './catalog-access';
import type { SupabaseClient } from '@supabase/supabase-js';

const FAIXAS_VALORES: Record<string, { min: number; max: number }> = {
  'Até R$ 300 mil': { min: 0, max: 300000 },
  'R$ 300 mil – R$ 500 mil': { min: 300000, max: 500000 },
  'R$ 500 mil – R$ 800 mil': { min: 500000, max: 800000 },
  'R$ 800 mil – R$ 1,2 mi': { min: 800000, max: 1200000 },
  'Acima de R$ 1,2 mi': { min: 1200000, max: Infinity },
};

export interface PreferenciasLead {
  tipoImovel?: string;
  faixaOrcamento?: string;
  bairro?: string;
}

interface ImovelRow {
  id: string;
  tipo: string;
  endereco: string;
  bairro: string;
  valor: number;
  metragem?: number | null;
  quartos?: number | null;
  vagas?: number | null;
  imagem_url?: string | null;
  status: string;
}

export interface ImovelRecomendado extends ImovelRow {
  pontuacao: number;
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

export async function recomendarImoveis(
  prefs: PreferenciasLead,
  client?: { from: (table: string) => unknown },
  access?: CatalogAccess
): Promise<ImovelRecomendado[]> {
  if (!access) return [];
  if (!prefs.tipoImovel?.trim() && !prefs.faixaOrcamento?.trim() && !prefs.bairro?.trim()) {
    return [];
  }

  const supabase = (client ?? createServerSupabaseClient()) as SupabaseClient;
  const query = scopeCatalog(supabase.from('imoveis')
    .select('id, tipo, endereco, bairro, valor, metragem, quartos, vagas, imagem_url, status'), access)
    .eq('status', 'disponivel').order('valor', { ascending: true });

  const { data, error } = await query;

  if (error || !Array.isArray(data)) return [];

  const imoveis = (data as ImovelRow[]).filter((imovel) =>
    imovel && typeof imovel.id === 'string' && imovel.id.trim() &&
    imovel.status === 'disponivel' && Number.isFinite(imovel.valor) &&
    imovel.valor >= 0
  );

  const faixa = prefs.faixaOrcamento ? FAIXAS_VALORES[prefs.faixaOrcamento] : null;

  const comPontuacao: ImovelRecomendado[] = imoveis.map((imovel) => {
    let pontuacao = 0;

    if (prefs.tipoImovel && normalize(imovel.tipo || '') === normalize(prefs.tipoImovel)) {
      pontuacao += 3;
    }

    if (faixa && imovel.valor >= faixa.min && imovel.valor <= faixa.max) {
      pontuacao += 3;
    } else if (faixa) {
      const margem = Number.isFinite(faixa.max) ? faixa.max * 0.2 : faixa.min * 0.2;
      if (imovel.valor >= faixa.min - margem && imovel.valor <= faixa.max + margem) {
        pontuacao += 1;
      }
    }

    if (prefs.bairro && normalize(imovel.bairro || '').includes(normalize(prefs.bairro))) {
      pontuacao += 2;
    }

    return { ...imovel, pontuacao };
  });

  return comPontuacao
    .filter((i) => i.pontuacao > 0)
    .sort((a, b) => b.pontuacao - a.pontuacao || a.valor - b.valor)
    .slice(0, 5);
}
