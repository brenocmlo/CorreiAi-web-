'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useImoveis } from '@/hooks/useImoveis';
import { useAuth } from '@/hooks/useAuth';
import ImovelCard from '@/components/ImovelCard';
import ConfirmModal from '@/components/ConfirmModal';

function PropertySaveNotice() {
  const result = useSearchParams().get('resultado');
  if (result !== 'cadastrado' && result !== 'atualizado') return null;
  return <p role="status" className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">Imóvel {result} com sucesso!</p>;
}

export default function ImoveisPage() {
  const { isCorretor } = useAuth();
  const { imoveis, loading, error, fetchImoveis, deleteImovel } = useImoveis();
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imovelToDelete, setImovelToDelete] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchImoveis();
  }, [fetchImoveis]);

  const handleDeleteClick = (id: string) => {
    setImovelToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (imovelToDelete) {
      const deleted = await deleteImovel(imovelToDelete);
      if (deleted) setSuccess('Imóvel excluído com sucesso.');
      setDeleteModalOpen(false);
      setImovelToDelete(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Imóveis</h1>
          <p className="text-slate-400">
            {isCorretor ? 'Gerencie o seu catálogo de imóveis' : 'Catálogo de imóveis disponíveis'}
          </p>
        </div>
        {isCorretor && (
          <Link 
            href="/imoveis/novo"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <span>+</span> Novo Imóvel
          </Link>
        )}
      </div>

      <Suspense fallback={null}><PropertySaveNotice /></Suspense>
      {success && <p role="status" className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">{success}</p>}
      {error ? (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
          {error}
          <button onClick={() => fetchImoveis()} className="ml-4 underline">Tentar novamente</button>
        </div>
      ) : loading && imoveis.length === 0 ? (
        <div role="status" className="flex flex-col items-center gap-4 py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-slate-300">Carregando imóveis...</p>
        </div>
      ) : imoveis.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 text-2xl">
            🏠
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Nenhum imóvel cadastrado</h3>
          <p className="text-slate-400 mb-6">
            {isCorretor ? 'Comece adicionando seu primeiro imóvel ao sistema.' : 'Não há imóveis disponíveis no momento.'}
          </p>
          {isCorretor && (
            <Link 
              href="/imoveis/novo"
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors inline-block"
            >
              Cadastrar Imóvel
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {imoveis.map((imovel) => (
            <ImovelCard 
              key={imovel.id} 
              imovel={imovel} 
              onEdit={isCorretor ? (id) => window.location.href = `/imoveis/${id}/editar` : undefined}
              onDelete={isCorretor ? handleDeleteClick : undefined}
            />
          ))}
        </div>
      )}

      {isCorretor && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Excluir Imóvel"
          message="Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita e todos os dados associados serão perdidos."
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setImovelToDelete(null);
          }}
        />
      )}
    </div>
  );
}
