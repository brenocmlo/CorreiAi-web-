'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchLeads } from '@/lib/leads';
import type { Lead } from '@/types/lead';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    return fetchLeads().then((data) => {
      setErro(null);
      setLeads(data);
    }).catch((e: unknown) => {
      setErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível carregar os leads. Verifique o Supabase e a tabela leads.'
      );
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    recarregar();
    const onFocus = () => { void recarregar(); };
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void recarregar(); }, 20000);
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [recarregar]);

  return { leads, loading, erro, recarregar };
}
