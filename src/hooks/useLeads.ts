'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchLeads } from '@/lib/leads';
import type { Lead } from '@/types/lead';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setErro(null);
    try {
      const data = await fetchLeads();
      setLeads(data);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível carregar os leads. Verifique o Supabase e a tabela leads.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    recarregar();
  }, [recarregar]);

  return { leads, loading, erro, recarregar };
}
