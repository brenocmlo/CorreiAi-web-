'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useImoveis } from '@/hooks/useImoveis';
import { useAuth } from '@/hooks/useAuth';
import ImovelForm from '@/components/ImovelForm';

export default function NovoImovelPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { createImovel, uploadImagem, loading } = useImoveis();

  useEffect(() => {
    if (!authLoading && profile && profile.role === 'lead') {
      router.replace('/dashboard');
    }
  }, [profile, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!profile || profile.role === 'lead') return null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/imoveis"
          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 mb-4"
        >
          &larr; Voltar para listagem
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Cadastrar Imóvel</h1>
        <p className="text-slate-400">Preencha os dados abaixo para adicionar um novo imóvel ao catálogo.</p>
      </div>

      <ImovelForm 
        onSubmit={createImovel}
        onUploadImage={uploadImagem}
        isLoading={loading} 
      />
    </div>
  );
}
