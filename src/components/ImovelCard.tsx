import React from 'react';
import Link from 'next/link';
import { Imovel } from '@/hooks/useImoveis';
import { Card, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ImovelCardProps {
  imovel: Imovel;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ImovelCard({ imovel, onEdit, onDelete }: ImovelCardProps) {
  return (
    <Card padding="none" className="overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
      {/* Imagem do Imóvel */}
      <div className="relative h-48 w-full bg-slate-100 border-b border-slate-200">
        {imovel.imagem_url ? (
          <img 
            src={imovel.imagem_url} 
            alt={`Imagem de ${imovel.tipo} em ${imovel.bairro}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wider">Sem Foto</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full uppercase tracking-wider">
              {imovel.tipo}
            </span>
            {imovel.destaque_landing && (
              <span className="inline-block px-2 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded-full">
                Na landing
              </span>
            )}
          </div>
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-md shrink-0 ${
            imovel.status === 'disponivel' ? 'bg-green-50 text-green-600' :
            imovel.status === 'vendido' ? 'bg-red-50 text-red-600' :
            'bg-yellow-50 text-yellow-600'
          }`}>
            {imovel.status.toUpperCase()}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.valor)}
        </h3>
        
        <p className="text-slate-500 text-sm mb-4 line-clamp-2">
          {imovel.endereco}, {imovel.bairro}
        </p>
        
        <div className="flex flex-wrap gap-4 text-xs text-slate-600">
          {imovel.quartos && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-900">{imovel.quartos}</span> Quartos
            </div>
          )}
          {imovel.vagas && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-900">{imovel.vagas}</span> Vagas
            </div>
          )}
          {imovel.metragem && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-900">{imovel.metragem}</span> m²
            </div>
          )}
        </div>
      </div>
      
      <CardFooter className="flex justify-between items-center">
        <Link
          href={`/imoveis/${imovel.id}`}
          className="text-sm font-medium text-brand-primary hover:text-brand-primary-hover transition-colors"
        >
          Ver detalhes
        </Link>

        <div className="flex gap-2">
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(imovel.id)}>
              Editar
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(imovel.id)}>
              Excluir
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
