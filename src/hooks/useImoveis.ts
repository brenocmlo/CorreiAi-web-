import { useState, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { IMOVEIS_STORAGE_BUCKET } from '@/lib/supabase-config';

const supabase = createBrowserSupabaseClient();

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? 'Erro ao consultar imóveis.');
  return body as T;
}

export interface Imovel {
  id: string;
  tipo: string;
  endereco: string;
  bairro: string;
  valor: number;
  metragem?: number | null;
  quartos?: number | null;
  vagas?: number | null;
  status: string;
  criado_em: string;
  imagem_url?: string | null;
}

export type ImovelInput = Omit<Imovel, 'id' | 'criado_em'>;

export function useImoveis() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImoveis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { imoveis } = await apiRequest<{ imoveis: Imovel[] }>('/api/imoveis');
      setImoveis(imoveis);
      return imoveis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar imóveis.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchImovelById = useCallback(async (id: string): Promise<Imovel | null> => {
    setLoading(true);
    setError(null);
    try {
      const { imovel } = await apiRequest<{ imovel: Imovel }>(`/api/imoveis/${id}`);
      return imovel;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar imóvel.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createImovel = useCallback(async (imovel: ImovelInput): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest('/api/imoveis', { method: 'POST', body: JSON.stringify(imovel) });
      await fetchImoveis(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar imóvel.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchImoveis]);

  const updateImovel = useCallback(async (id: string, updates: Partial<ImovelInput>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`/api/imoveis/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
      await fetchImoveis(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao editar imóvel.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchImoveis]);

  const deleteImovel = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`/api/imoveis/${id}`, { method: 'DELETE' });
      await fetchImoveis(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir imóvel.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchImoveis]);

  const uploadImagem = useCallback(async (file: File): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(IMOVEIS_STORAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(IMOVEIS_STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    imoveis,
    loading,
    error,
    fetchImoveis,
    fetchImovelById,
    createImovel,
    updateImovel,
    deleteImovel,
    uploadImagem,
  };
}
