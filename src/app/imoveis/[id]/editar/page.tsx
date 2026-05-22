'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useImoveis, Imovel } from '@/hooks/useImoveis';
import ImovelForm from '@/components/ImovelForm';
import { useRouter } from 'next/navigation';

export default function EditarImovelPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { fetchImovelById, updateImovel, loading } = useImoveis();
  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsFetching(true);
      const data = await fetchImovelById(id);
      if (data) {
        setImovel(data);
      } else {
        router.push('/imoveis');
      }
      setIsFetching(false);
    };
    loadData();
  }, [id, fetchImovelById, router]);

  const handleUpdate = async (data: any) => {
    return await updateImovel(id, data);
  };

  if (isFetching) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/imoveis"
          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 mb-4"
        >
          &larr; Voltar para listagem
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Editar Imóvel</h1>
        <p className="text-slate-400">Atualize os dados do imóvel selecionado.</p>
      </div>

      {imovel && (
        <ImovelForm 
          initialData={imovel}
          onSubmit={handleUpdate} 
          isLoading={loading} 
        />
      )}
    </div>
  );
}
