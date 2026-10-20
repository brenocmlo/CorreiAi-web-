import { parseLeadDetails } from './lead-input.ts';
import { inputToRow, type LeadRow } from './leads-mapper.ts';
import { createServerSupabaseClient } from './supabase.ts';
import type { LeadInput } from '../types/lead.ts';

type PublicLeadResult =
  | { ok: true; lead: LeadRow }
  | { ok: false; error: string; status: 400 | 500 | 503 };

export async function createPublicLead(input: unknown): Promise<PublicLeadResult> {
  const parsed = parseLeadDetails(input);
  if (parsed.error) return { ok: false, error: parsed.error, status: 400 };

  const details = parsed.data as LeadInput;
  if (
    details.nome.length > 120 ||
    details.email.length > 254 ||
    details.telefone.length > 30 ||
    !/^\+?[\d\s()-]{10,30}$/.test(details.telefone)
  ) {
    return { ok: false, error: 'Dados de contato inválidos.', status: 400 };
  }

  const supabase = createServerSupabaseClient();
  const { data: corretores, error: corretorError } = await supabase
    .from('perfis')
    .select('id')
    .eq('role', 'corretor')
    .eq('ativo', true)
    .order('criado_em', { ascending: true })
    .limit(1);

  if (corretorError) {
    console.error('Erro ao buscar corretor ativo:', corretorError);
    return { ok: false, error: 'Serviço de captura indisponível.', status: 503 };
  }

  const corretorId = corretores?.[0]?.id;
  if (!corretorId) {
    return { ok: false, error: 'Nenhum corretor disponível no momento.', status: 503 };
  }

  const { data, error } = await supabase
    .from('leads')
    .insert([{ ...inputToRow(details), etapa: 'novo', corretor_id: corretorId }])
    .select('*')
    .single();

  if (error || !data) {
    console.error('Erro ao salvar lead público:', error);
    return { ok: false, error: 'Não foi possível registrar o contato.', status: 500 };
  }

  return { ok: true, lead: data as LeadRow };
}
