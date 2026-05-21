import {
  ref,
  push,
  set,
  update,
  remove,
  onValue,
  off,
  get,
  type DataSnapshot,
} from 'firebase/database';
import { database } from '@/lib/firebase';
import type { EtapaFunil, Lead, LeadInput } from '@/types/lead';

const LEADS_PATH = 'leads';

type LeadRecord = Omit<Lead, 'id'>;

function parseLeadsSnapshot(val: Record<string, LeadRecord> | null): Lead[] {
  if (!val) return [];
  return Object.entries(val)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.criadoEm - a.criadoEm);
}

export async function createLead(data: LeadInput): Promise<string> {
  const leadsRef = ref(database, LEADS_PATH);
  const newRef = push(leadsRef);
  const now = Date.now();
  await set(newRef, {
    nome: data.nome,
    telefone: data.telefone,
    email: data.email,
    faixaOrcamento: data.faixaOrcamento,
    tipoImovel: data.tipoImovel,
    etapa: data.etapa ?? 'novo',
    criadoEm: now,
    atualizadoEm: now,
  });
  if (!newRef.key) throw new Error('Falha ao gerar ID do lead.');
  return newRef.key;
}

export async function getLead(id: string): Promise<Lead | null> {
  const snapshot = await get(ref(database, `${LEADS_PATH}/${id}`));
  if (!snapshot.exists()) return null;
  return { id, ...(snapshot.val() as LeadRecord) };
}

export async function updateLead(
  id: string,
  data: Partial<LeadInput> & { etapa?: EtapaFunil }
): Promise<void> {
  const leadRef = ref(database, `${LEADS_PATH}/${id}`);
  await update(leadRef, { ...data, atualizadoEm: Date.now() });
}

export async function deleteLead(id: string): Promise<void> {
  await remove(ref(database, `${LEADS_PATH}/${id}`));
}

export function subscribeLeads(callback: (leads: Lead[]) => void): () => void {
  const leadsRef = ref(database, LEADS_PATH);
  const handler = (snapshot: DataSnapshot) => {
    callback(parseLeadsSnapshot(snapshot.val() as Record<string, LeadRecord> | null));
  };
  onValue(leadsRef, handler);
  return () => off(leadsRef, 'value', handler);
}
