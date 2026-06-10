import { createServerSupabaseClient } from '@/lib/supabase';

const FAIXAS_VALORES: Record<string, { min: number; max: number }> = {
  'Até R$ 300 mil': { min: 0, max: 300000 },
  'R$ 300 mil – R$ 500 mil': { min: 300000, max: 500000 },
  'R$ 500 mil – R$ 800 mil': { min: 500000, max: 800000 },
  'R$ 800 mil – R$ 1,2 mi': { min: 800000, max: 1200000 },
  'Acima de R$ 1,2 mi': { min: 1200000, max: 999999999 },
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

export async function recomendarImoveis(prefs: PreferenciasLead): Promise<ImovelRecomendado[]> {
  const supabase = createServerSupabaseClient();

  const query = supabase
    .from('imoveis')
    .select('id, tipo, endereco, bairro, valor, metragem, quartos, vagas, imagem_url, status')
    .eq('status', 'disponivel')
    .order('valor', { ascending: true });

  if (prefs.tipoImovel) {
    query.ilike('tipo', `%${prefs.tipoImovel}%`);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  const imoveis = data as ImovelRow[];

  const faixa = prefs.faixaOrcamento ? FAIXAS_VALORES[prefs.faixaOrcamento] : null;

  const comPontuacao: ImovelRecomendado[] = imoveis.map((imovel) => {
    let pontuacao = 0;

    if (prefs.tipoImovel && imovel.tipo?.toLowerCase().includes(prefs.tipoImovel.toLowerCase())) {
      pontuacao += 3;
    }

    if (faixa && imovel.valor >= faixa.min && imovel.valor <= faixa.max) {
      pontuacao += 3;
    } else if (faixa) {
      const margem = faixa.max * 0.2;
      if (imovel.valor >= faixa.min - margem && imovel.valor <= faixa.max + margem) {
        pontuacao += 1;
      }
    }

    if (prefs.bairro && imovel.bairro?.toLowerCase().includes(prefs.bairro.toLowerCase())) {
      pontuacao += 2;
    }

    return { ...imovel, pontuacao };
  });

  return comPontuacao
    .filter((i) => i.pontuacao > 0)
    .sort((a, b) => b.pontuacao - a.pontuacao)
    .slice(0, 5);
}
