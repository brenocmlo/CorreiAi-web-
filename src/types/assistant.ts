export type ConversationMessage = { role: 'user' | 'assistant'; text: string };

export interface AssistantContext {
  mode?: 'demo';
  demoSlug?: string;
  catalogState: 'available' | 'restricted' | 'unavailable';
  company: { nome: string; telefone: string | null } | null;
  restrictionReason?: 'login_required' | 'company_required' | 'admin_only';
  publicSlug?: string;
  catalogCount?: number;
  catalogTypes?: string[];
}

export interface Qualification {
  origem: 'assistente';
  nome: string | null;
  email: string | null;
  telefone: string | null;
  objetivo: 'comprar' | 'alugar' | 'investir' | 'vender' | null;
  tipoImovel: string | null;
  bairro: string | null;
  orcamentoMax: number | null;
  orcamentoNaoDefinido?: boolean;
  semPreferenciaBairro?: boolean;
  quartosMin: number | null;
  vagasMin: number | null;
  prazo: string | null;
  formaPagamento: string | null;
  preferencias: string[];
  permiteContato: boolean;
  contatoSolicitado?: boolean;
  visitaSolicitada: boolean;
  visitaPreferencia: string | null;
  imovelInteresseId: string | null;
  resumo: string;
  proximoPasso: string;
  historico?: ConversationMessage[];
  atualizadoEm: string;
}

export interface AssistantProperty {
  id: string;
  tipo: string;
  endereco: string;
  bairro: string;
  valor: number;
  quartos?: number | null;
  vagas?: number | null;
  metragem?: number | null;
  descricao?: string | null;
  imagem_url?: string | null;
  status: string;
}

export type CaptureStatus =
  | 'demonstracao'
  | 'incompleto'
  | 'criado'
  | 'atualizado'
  | 'nao_autorizado'
  | 'sem_alteracao'
  | 'indisponivel';
export interface AssistantResponse {
  reply: string;
  continuarEm?: { href: string; label: string };
  leadRegistrado: boolean;
  captura: CaptureStatus;
  qualificacao: Qualification;
  imoveis: AssistantProperty[];
  contexto?: AssistantContext;
  sugestoes?: string[];
  aviso?: string;
  error?: string;
}
