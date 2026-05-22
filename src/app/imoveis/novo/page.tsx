'use client';

import React from 'react';
import Link from 'next/link';
import { useImoveis } from '@/hooks/useImoveis';
import ImovelForm from '@/components/ImovelForm';

export default function NovoImovelPage() {
  const { createImovel, uploadImagem, loading } = useImoveis();

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
