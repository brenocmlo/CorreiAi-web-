'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useImoveis } from '@/hooks/useImoveis';
import { useAuth } from '@/hooks/useAuth';
import ImovelForm from '@/components/ImovelForm';
import AppShell from '@/components/AppShell';

export default function NovoImovelPage() {
  const { profile, loading: authLoading, isLead } = useAuth();
  const router = useRouter();
  const { createImovel, uploadImagem, loading } = useImoveis();

  useEffect(() => {
    if (!authLoading && profile && isLead) {
      router.replace('/dashboard');
    }
  }, [profile, authLoading, isLead, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-primary" />
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Cadastrar Imóvel</h1>
          <p className="text-slate-500">Preencha os dados abaixo para adicionar um novo imóvel ao catálogo.</p>
        </div>

        <ImovelForm 
          onSubmit={createImovel}
          onUploadImage={uploadImagem}
          isLoading={loading} 
        />
      </div>
    </AppShell>
  );
}
