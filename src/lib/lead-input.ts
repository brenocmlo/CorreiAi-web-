import type { LeadInput } from '@/types/lead';

type Result = { data: Partial<LeadInput>; error?: never } | { error: string; data?: never };

const FIELDS = ['nome', 'telefone', 'email', 'faixaOrcamento', 'tipoImovel'] as const;

export function parseLeadDetails(value: unknown, options: { partial?: boolean; allowEmpty?: boolean } = {}): Result {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'Informe os campos do lead.' };
  }

  const input = value as Record<string, unknown>;
  const data: Record<string, string> = {};
  for (const field of FIELDS) {
    const raw = input[field];
    if (raw === undefined && options.partial) continue;
    if (typeof raw !== 'string' || !raw.trim()) {
      return { error: `Campo inválido ou ausente: ${field}.` };
    }
    data[field] = raw.trim();
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { error: 'E-mail inválido.' };
  }
  if (options.partial && !options.allowEmpty && Object.keys(data).length === 0) {
    return { error: 'Informe ao menos um campo para editar.' };
  }
  return { data: data as Partial<LeadInput> };
}

export function ownerFilter(uid: string): ['corretor_id', string] {
  return ['corretor_id', uid];
}

export function parseLeadStage(value: unknown, validStages: readonly string[]):
  { data: string; error?: never } | { error: string; data?: never } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'Etapa inválida.' };
  }
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => key !== 'etapa')) {
    return { error: 'Somente o campo etapa pode ser alterado nesta rota.' };
  }
  if (typeof input.etapa !== 'string' || !validStages.includes(input.etapa)) {
    return { error: 'Etapa inválida.' };
  }
  return { data: input.etapa };
}
