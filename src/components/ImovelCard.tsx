import React from 'react';
import Link from 'next/link';
import { Imovel } from '@/hooks/useImoveis';

interface ImovelCardProps {
  imovel: Imovel;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ImovelCard({ imovel, onEdit, onDelete }: ImovelCardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
      {/* Imagem do Imóvel */}
      <div className="relative h-48 w-full bg-slate-900 border-b border-slate-700">
        {imovel.imagem_url ? (
          <img 
            src={imovel.imagem_url} 
            alt={`Imagem de ${imovel.tipo} em ${imovel.bairro}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
            <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wider">Sem Foto</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full uppercase tracking-wider">
            {imovel.tipo}
          </span>
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-md ${
            imovel.status === 'disponivel' ? 'bg-green-500/20 text-green-400' :
            imovel.status === 'vendido' ? 'bg-red-500/20 text-red-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {imovel.status.toUpperCase()}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.valor)}
        </h3>
        
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {imovel.endereco}, {imovel.bairro}
        </p>
        
        <div className="flex flex-wrap gap-4 text-xs text-slate-300">
          {imovel.quartos && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-100">{imovel.quartos}</span> Quartos
            </div>
          )}
          {imovel.vagas && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-100">{imovel.vagas}</span> Vagas
            </div>
          )}
          {imovel.metragem && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-100">{imovel.metragem}</span> m²
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-slate-900/50 p-4 border-t border-slate-700 flex justify-between items-center">
        <Link 
          href={`/imoveis/${imovel.id}`}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          Ver detalhes
        </Link>
        
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(imovel.id)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(imovel.id)}
              className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-white bg-red-950/30 hover:bg-red-600 rounded transition-colors"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
