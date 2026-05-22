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
