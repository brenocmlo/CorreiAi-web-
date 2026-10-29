import Link from 'next/link';
import type { Qualification } from '@/types/assistant';

export function LeadQualification({ value }: { value: Qualification }) {
  return (
    <section aria-labelledby="triagem-title" className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <p className="text-xs font-medium text-indigo-600">Atendimento pelo assistente</p>
      <h2 id="triagem-title" className="mt-1 text-lg font-semibold text-slate-900">Triagem e próximo passo</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{value.resumo || 'Preferências ainda não informadas.'}</p>
      <p className="mt-3 text-sm text-slate-600">{value.proximoPasso}</p>
      {value.visitaSolicitada && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <p className="font-medium">Visita solicitada — confirmação pendente</p>
          <p className="mt-1">Preferência: {value.visitaPreferencia || 'Combinar dia e horário com o cliente.'}</p>
          <p className="mt-1 text-xs">Confira o imóvel e a disponibilidade antes de mover para Visita agendada.</p>
        </div>
      )}
      {value.imovelInteresseId && <Link href={`/imoveis/${value.imovelInteresseId}`} className="mt-3 inline-block text-sm text-indigo-600 underline underline-offset-4">Ver imóvel de interesse</Link>}
      {value.historico?.length ? (
        <details className="mt-4 border-t border-slate-200 pt-3">
          <summary className="cursor-pointer text-sm text-slate-600 focus-visible:outline-2 focus-visible:outline-indigo-400">Ver conversa com o cliente</summary>
          <ol className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-2">
            {value.historico.map((message, index) => (
              <li key={index} className="rounded-lg bg-white border border-slate-200 p-3 text-sm">
                <span className="font-medium text-slate-800">{message.role === 'user' ? 'Cliente' : 'Assistente'}</span>
                <p className="mt-1 whitespace-pre-wrap break-words text-slate-500">{message.text}</p>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </section>
  );
}
