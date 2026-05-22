export const ETAPAS_FUNIL = [
  { id: 'novo', label: 'Novo', cor: 'indigo' },
  { id: 'em_atendimento', label: 'Em atendimento', cor: 'amber' },
  { id: 'visita_agendada', label: 'Visita agendada', cor: 'cyan' },
  { id: 'proposta', label: 'Proposta', cor: 'purple' },
  { id: 'fechado', label: 'Fechado', cor: 'emerald' },
] as const;

export type EtapaFunil = (typeof ETAPAS_FUNIL)[number]['id'];

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  faixaOrcamento: string;
  tipoImovel: string;
  etapa: EtapaFunil;
  criadoEm: number;
  atualizadoEm: number;
}

export interface LeadInput {
  nome: string;
  telefone: string;
  email: string;
  faixaOrcamento: string;
  tipoImovel: string;
  etapa?: EtapaFunil;
}

export const TIPOS_IMOVEL = [
  'Apartamento',
  'Casa',
  'Cobertura',
  'Studio',
  'Terreno',
  'Comercial',
] as const;

export const FAIXAS_ORCAMENTO = [
  'Até R$ 300 mil',
  'R$ 300 mil – R$ 500 mil',
  'R$ 500 mil – R$ 800 mil',
  'R$ 800 mil – R$ 1,2 mi',
  'Acima de R$ 1,2 mi',
] as const;
