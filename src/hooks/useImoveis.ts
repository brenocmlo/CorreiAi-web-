import { useState, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { IMOVEIS_STORAGE_BUCKET } from '@/lib/supabase-config';
import { parseImageMetadata } from '@/lib/imoveis-upload';
import { requestJson as apiRequest, withRequestTimeout } from '@/lib/client-request';

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
  descricao?: string | null;
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
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar imóvel.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateImovel = useCallback(async (id: string, updates: Partial<ImovelInput>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`/api/imoveis/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao editar imóvel.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteImovel = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`/api/imoveis/${id}`, { method: 'DELETE' });
      setImoveis(previous => previous.filter(imovel => imovel.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir imóvel.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadImagem = useCallback(async (file: File): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const parsed = parseImageMetadata(file);
      if (!parsed.extension) throw new Error(parsed.error);

      const { path, token } = await apiRequest<{ path: string; token: string }>(
        '/api/imoveis/upload-url',
        { method: 'POST', body: JSON.stringify({ name: file.name, type: file.type, size: file.size }) }
      );

      await withRequestTimeout(async signal => {
        const supabase = createBrowserSupabaseClient((input, options) => fetch(input, { ...options, signal }));
        const { error: uploadError } = await supabase.storage.from(IMOVEIS_STORAGE_BUCKET)
          .uploadToSignedUrl(path, token, file, { contentType: file.type });
        if (uploadError) throw uploadError;
      }, 45000, 'O envio da imagem demorou. O imóvel ainda não foi salvo. Tente uma imagem menor ou verifique a conexão.');

      return `/api/imoveis/imagem?path=${encodeURIComponent(path)}`;
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
