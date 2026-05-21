import type { EtapaFunil, Lead, LeadInput } from '@/types/lead';

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? 'Erro na requisição.');
  }

  return data as T;
}

export async function fetchLeads(): Promise<Lead[]> {
  const { leads } = await apiRequest<{ leads: Lead[] }>('/api/leads');
  return leads;
}

export async function createLead(data: LeadInput): Promise<string> {
  const { lead } = await apiRequest<{ lead: Lead }>('/api/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return lead.id;
}

export async function getLead(id: string): Promise<Lead | null> {
  try {
    const { lead } = await apiRequest<{ lead: Lead }>(`/api/leads/${id}`);
    return lead;
  } catch (e) {
    if (e instanceof Error && e.message.includes('não encontrado')) return null;
    throw e;
  }
}

export async function updateLead(
  id: string,
  data: Partial<LeadInput> & { etapa?: EtapaFunil }
): Promise<void> {
  await apiRequest(`/api/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteLead(id: string): Promise<void> {
  await apiRequest(`/api/leads/${id}`, { method: 'DELETE' });
}
