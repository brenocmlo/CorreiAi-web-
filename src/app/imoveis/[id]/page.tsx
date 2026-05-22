'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useImoveis, Imovel } from '@/hooks/useImoveis';
import ConfirmModal from '@/components/ConfirmModal';
import { useRouter } from 'next/navigation';

export default function DetalheImovelPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { fetchImovelById, deleteImovel } = useImoveis();
  
  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchImovelById(id);
      if (data) {
        setImovel(data);
      } else {
        router.push('/imoveis');
      }
      setLoading(false);
    };
    loadData();
  }, [id, fetchImovelById, router]);

  const handleDelete = async () => {
    await deleteImovel(id);
    setDeleteModalOpen(false);
    router.push('/imoveis');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!imovel) return null;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link 
          href="/imoveis"
          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          &larr; Voltar para listagem
        </Link>
        
        <div className="flex gap-3">
          <Link
            href={`/imoveis/${imovel.id}/editar`}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Editar Imóvel
          </Link>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        {/* Imagem Hero do Imóvel */}
        {imovel.imagem_url && (
          <div className="relative w-full h-64 md:h-96 border-b border-slate-700 bg-slate-900">
            <img 
              src={imovel.imagem_url} 
              alt={`Foto de ${imovel.tipo} em ${imovel.bairro}`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header do Imóvel */}
        <div className="p-6 md:p-8 border-b border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full uppercase tracking-wider">
              {imovel.tipo}
            </span>
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
              imovel.status === 'disponivel' ? 'bg-green-500/20 text-green-400' :
              imovel.status === 'vendido' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {imovel.status.toUpperCase()}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.valor)}
          </h1>
          <p className="text-lg text-slate-400">
            {imovel.endereco}, {imovel.bairro}
          </p>
        </div>

        {/* Detalhes */}
        <div className="p-6 md:p-8 bg-slate-800/50">
          <h3 className="text-xl font-semibold text-white mb-6">Características do Imóvel</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-center">
              <span className="block text-slate-400 text-sm mb-1">Quartos</span>
              <span className="block text-2xl font-bold text-white">{imovel.quartos || '-'}</span>
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-center">
              <span className="block text-slate-400 text-sm mb-1">Vagas</span>
              <span className="block text-2xl font-bold text-white">{imovel.vagas || '-'}</span>
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-center">
              <span className="block text-slate-400 text-sm mb-1">Metragem</span>
              <span className="block text-2xl font-bold text-white">
                {imovel.metragem ? `${imovel.metragem} m²` : '-'}
              </span>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-center">
              <span className="block text-slate-400 text-sm mb-1">Cadastrado em</span>
              <span className="block text-lg font-bold text-white mt-1">
                {new Date(imovel.criado_em).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Excluir Imóvel"
        message="Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
