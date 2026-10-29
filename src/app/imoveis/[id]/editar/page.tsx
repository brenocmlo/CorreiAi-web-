'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useImoveis, Imovel, type ImovelInput } from '@/hooks/useImoveis';
import { useAuth } from '@/hooks/useAuth';
import ImovelForm from '@/components/ImovelForm';
import AppShell from '@/components/AppShell';

export default function EditarImovelPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { profile, loading: authLoading, isLead } = useAuth();
  const { fetchImovelById, updateImovel, uploadImagem, loading } = useImoveis();
  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!authLoading && profile && isLead) {
      router.replace('/dashboard');
    }
  }, [profile, authLoading, isLead, router]);

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

  const handleUpdate = async (data: ImovelInput) => {
    return await updateImovel(id, data);
  };

  if (authLoading || isFetching) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!profile || isLead) return null;

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/imoveis"
            className="text-sm font-medium text-brand-primary hover:text-brand-primary-hover transition-colors flex items-center gap-1 mb-4"
          >
            &larr; Voltar para listagem
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Editar Imóvel</h1>
          <p className="text-slate-500">Atualize os dados do imóvel selecionado.</p>
        </div>

        {imovel && (
          <ImovelForm 
            initialData={imovel}
            onSubmit={handleUpdate} 
            onUploadImage={uploadImagem}
            isLoading={loading} 
          />
        )}
      </div>
    </AppShell>
  );
}
