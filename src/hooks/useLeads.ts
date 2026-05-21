'use client';

import { useEffect, useState, useCallback } from 'react';
import { subscribeLeads } from '@/lib/leads';
import type { Lead } from '@/types/lead';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErro(null);
    try {
      const unsubscribe = subscribeLeads((data) => {
        setLeads(data);
        setLoading(false);
      });
      return unsubscribe;
    } catch {
      setErro('Não foi possível conectar ao Firebase Realtime Database.');
      setLoading(false);
      return undefined;
    }
  }, []);

  const recarregar = useCallback(() => {
    setLoading(true);
  }, []);

  return { leads, loading, erro, recarregar };
}
