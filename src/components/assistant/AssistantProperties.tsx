import Link from 'next/link';
import Image from 'next/image';
import { BedDouble, CarFront, Home, MapPin } from 'lucide-react';
import type { AssistantProperty } from '@/types/assistant';
import { publicAgencyPath } from '@/lib/public-agency-path';

export function AssistantProperties({
  properties,
  disabled,
  onSelect,
  onDetails,
  publicSlug,
  activeIds,
  demo,
  onInspect,
}: {
  properties: AssistantProperty[];
  disabled: boolean;
  onSelect: (property: AssistantProperty) => void;
  onDetails?: () => void;
  publicSlug?: string | null;
  activeIds?: readonly string[];
  demo?: boolean;
  onInspect?: (property: AssistantProperty) => void;
}) {
  if (!properties.length) return null;
  return (
    <section
      aria-label="Imóveis compatíveis com sua busca"
      className="grid w-full min-w-0 gap-3"
    >
      {properties.map((property) => (
        <article
          key={property.id}
          className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
        >
          {activeIds && !activeIds.includes(property.id) && (
            <p className="border-b border-white/5 px-3 py-2 text-[10px] text-slate-500">
              Resultado de uma busca anterior
            </p>
          )}
          <div className="flex gap-3 p-3">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800 text-slate-500">
              {property.imagem_url ? (
                <Image
                  unoptimized
                  src={property.imagem_url}
                  width={96}
                  height={96}
                  alt={`${property.tipo} em ${property.bairro}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Home aria-hidden="true" className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium capitalize text-indigo-200">
                {property.tipo}
              </p>
              <h3 className="mt-1 text-base font-semibold tracking-tight text-white">
                {property.valor.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </h3>
              <p className="mt-1 flex items-start gap-1 text-xs text-slate-400">
                <MapPin
                  aria-hidden="true"
                  className="mt-0.5 h-3 w-3 shrink-0"
                />
                <span className="break-words">
                  {property.bairro} · {property.endereco}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 px-3 pb-3 text-[11px] text-slate-400">
            {property.quartos != null && (
              <span className="flex items-center gap-1">
                <BedDouble aria-hidden="true" className="h-3 w-3" />
                {property.quartos}{' '}
                {property.quartos === 1 ? 'quarto' : 'quartos'}
              </span>
            )}
            {property.vagas != null && (
              <span className="flex items-center gap-1">
                <CarFront aria-hidden="true" className="h-3 w-3" />
                {property.vagas} {property.vagas === 1 ? 'vaga' : 'vagas'}
              </span>
            )}
            {property.metragem != null && <span>{property.metragem} m²</span>}
          </div>
          <div className="grid grid-cols-2 border-t border-white/10 text-xs">
            {demo ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onInspect?.(property)}
                className="min-h-11 px-3 py-3 text-slate-200 hover:bg-white/5"
              >
                Ver detalhes
              </button>
            ) : (
              <Link
                href={
                  publicSlug
                    ? `${publicAgencyPath(publicSlug)}/imoveis/${property.id}`
                    : `/imoveis/${property.id}`
                }
                onClick={onDetails}
                className="flex min-h-11 items-center justify-center px-3 py-3 text-slate-200 hover:bg-white/5"
              >
                Ver detalhes
              </Link>
            )}
            <button
              type="button"
              disabled={
                disabled || (!!activeIds && !activeIds.includes(property.id))
              }
              onClick={() => onSelect(property)}
              className="min-h-11 border-l border-white/10 px-3 py-3 font-medium text-indigo-200 hover:bg-indigo-500/10 disabled:opacity-40"
            >
              {demo ? 'Simular visita' : 'Solicitar visita'}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
