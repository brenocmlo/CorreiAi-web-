import { createHash, randomBytes } from 'node:crypto';
import { createServerSupabaseClient } from './supabase';
import { completeContact } from './assistant-qualification';
import type { CaptureStatus, ConversationMessage, Qualification } from '../types/assistant';

export const ASSISTANT_COOKIE = 'correia_atendimento';
export function assistantSession(value?: string) {
  const token = value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : randomBytes(32).toString('base64url');
  return { token, hash: createHash('sha256').update(token).digest('hex') };
}

export async function getAssistantLead(hash: string) {
  const result = await createServerSupabaseClient().from('leads').select('id,qualificacao,etapa').eq('assistente_sessao_hash', hash).maybeSingle();
  if (result.error) throw new Error('Não foi possível carregar o atendimento.');
  return result.data as { id: string; qualificacao: Qualification | null; etapa: string } | null;
}

export async function saveAssistantLead(hash: string, q: Qualification, history: ConversationMessage[]): Promise<CaptureStatus> {
  const db = createServerSupabaseClient();
  const qualification = { ...q, historico: history.slice(-30) };
  const contact = completeContact(q);
  const existing = await getAssistantLead(hash);
  const payload = { qualificacao: qualification, ...(contact ? { nome: contact.nome, email: contact.email, telefone: contact.telefone, faixa_orcamento: contact.faixaOrcamento, tipo_imovel: contact.tipoImovel } : {}) };
  if (existing) {
    // Não escrever etapa nem corretor_id: o andamento pertence ao corretor.
    const updated = await db.from('leads').update(payload).eq('id', existing.id).eq('assistente_sessao_hash', hash).select('id').maybeSingle();
    if (updated.error || !updated.data) throw new Error('Não foi possível atualizar o atendimento.');
    return q.permiteContato ? 'atualizado' : 'nao_autorizado';
  }
  if (!q.permiteContato) return 'nao_autorizado';
  if (!contact) return 'incompleto';
  const owner = await db.from('perfis').select('id').eq('role', 'corretor').eq('ativo', true).order('criado_em', { ascending: true }).limit(1);
  if (owner.error || !owner.data?.[0]) throw new Error('Nenhum corretor disponível para receber o atendimento.');
  const inserted = await db.from('leads').insert([{ ...payload, etapa: 'novo', corretor_id: owner.data[0].id, assistente_sessao_hash: hash }]).select('id').single();
  if (inserted.error?.code === '23505') {
    // Duplo envio da mesma conversa: o índice único impede dois cards no Kanban.
    if (await getAssistantLead(hash)) return saveAssistantLead(hash, q, history);
  }
  if (inserted.error || !inserted.data) throw new Error('Não foi possível registrar o atendimento.');
  return 'criado';
}
