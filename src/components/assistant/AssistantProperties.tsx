import Link from 'next/link';
import type { AssistantProperty } from '@/types/assistant';

export function AssistantProperties({ properties, disabled, onSelect }: { properties: AssistantProperty[]; disabled: boolean; onSelect: (property: AssistantProperty) => void }) {
  if (!properties.length) return null;
  return (
    <section aria-label="Imóveis compatíveis com sua busca" className="grid gap-3 sm:grid-cols-2">
      {properties.map((property) => (
        <article key={property.id} className="min-w-0 rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">{property.tipo} · {property.bairro}</p>
          <h3 className="mt-1 break-words text-sm font-medium text-slate-100">{property.endereco}</h3>
          <p className="mt-2 font-semibold text-white">{property.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className="mt-1 text-xs text-slate-400">{property.quartos != null ? `${property.quartos} quartos` : 'Quartos a confirmar'} · {property.vagas != null ? `${property.vagas} vagas` : 'Vagas a confirmar'}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Link href={`/imoveis/${property.id}`} className="text-indigo-300 underline underline-offset-4">Ver imóvel</Link>
            <button disabled={disabled} onClick={() => onSelect(property)} className="rounded-lg border border-slate-600 px-3 py-2 text-slate-200 hover:bg-slate-800 disabled:opacity-50">Solicitar visita</button>
          </div>
        </article>
      ))}
    </section>
  );
}
