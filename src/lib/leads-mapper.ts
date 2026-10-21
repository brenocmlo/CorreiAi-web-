import type { EtapaFunil, Lead, LeadInput } from '@/types/lead';
import type { Qualification } from '@/types/assistant';

export interface LeadRow {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  faixa_orcamento: string;
  tipo_imovel: string;
  etapa: EtapaFunil;
  criado_em: string;
  atualizado_em: string;
  qualificacao?: Qualification | null;
}

export function rowToLead(row: LeadRow, includeHistory = false): Lead {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    email: row.email,
    faixaOrcamento: row.faixa_orcamento,
    tipoImovel: row.tipo_imovel,
    etapa: row.etapa,
    criadoEm: new Date(row.criado_em).getTime(),
    atualizadoEm: new Date(row.atualizado_em).getTime(),
    ...(row.qualificacao ? { qualificacao: { ...row.qualificacao, historico: includeHistory ? row.qualificacao.historico : undefined } } : {}),
  };
}

export function inputToRow(data: LeadInput & { etapa?: EtapaFunil }) {
  return {
    nome: data.nome,
    telefone: data.telefone,
    email: data.email,
    faixa_orcamento: data.faixaOrcamento,
    tipo_imovel: data.tipoImovel,
    etapa: data.etapa ?? 'novo',
  };
}
