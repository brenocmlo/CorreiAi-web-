import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
      const { data, error: sbError } = await supabase
        .from('imoveis')
        .select('*')
        .order('criado_em', { ascending: false });

      if (sbError) throw sbError;
      setImoveis(data as Imovel[]);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchImovelById = async (id: string): Promise<Imovel | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', id)
        .single();

      if (sbError) throw sbError;
      return data as Imovel;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createImovel = async (imovel: ImovelInput): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error: sbError } = await supabase
        .from('imoveis')
        .insert([imovel]);

      if (sbError) throw sbError;
      await fetchImoveis(); // Refresh list
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateImovel = async (id: string, updates: Partial<ImovelInput>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error: sbError } = await supabase
        .from('imoveis')
        .update(updates)
        .eq('id', id);

      if (sbError) throw sbError;
      await fetchImoveis(); // Refresh list
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteImovel = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error: sbError } = await supabase
        .from('imoveis')
        .delete()
        .eq('id', id);

      if (sbError) throw sbError;
      await fetchImoveis(); // Refresh list
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    imoveis,
    loading,
    error,
    fetchImoveis,
    fetchImovelById,
    createImovel,
    updateImovel,
    deleteImovel,
  };
}
