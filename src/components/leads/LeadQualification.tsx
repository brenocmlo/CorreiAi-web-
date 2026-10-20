import Link from 'next/link';
import type { Qualification } from '@/types/assistant';

export function LeadQualification({ value }: { value: Qualification }) {
  return (
    <section aria-labelledby="triagem-title" className="mb-6 rounded-xl border border-slate-700 bg-slate-950/50 p-4 sm:p-5">
      <p className="text-xs font-medium text-indigo-300">Atendimento pelo assistente</p>
      <h2 id="triagem-title" className="mt-1 text-lg font-semibold text-white">Triagem e próximo passo</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{value.resumo || 'Preferências ainda não informadas.'}</p>
      <p className="mt-3 text-sm text-slate-300">{value.proximoPasso}</p>
      {value.visitaSolicitada && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-200">
          <p className="font-medium">Visita solicitada — confirmação pendente</p>
          <p className="mt-1">Preferência: {value.visitaPreferencia || 'Combinar dia e horário com o cliente.'}</p>
          <p className="mt-1 text-xs">Confira o imóvel e a disponibilidade antes de mover para Visita agendada.</p>
        </div>
      )}
      {value.imovelInteresseId && <Link href={`/imoveis/${value.imovelInteresseId}`} className="mt-3 inline-block text-sm text-indigo-300 underline underline-offset-4">Ver imóvel de interesse</Link>}
      {value.historico?.length ? (
        <details className="mt-4 border-t border-slate-800 pt-3">
          <summary className="cursor-pointer text-sm text-slate-300 focus-visible:outline-2 focus-visible:outline-indigo-400">Ver conversa com o cliente</summary>
          <ol className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-2">
            {value.historico.map((message, index) => (
              <li key={index} className="rounded-lg bg-slate-900 p-3 text-sm">
                <span className="font-medium text-slate-200">{message.role === 'user' ? 'Cliente' : 'Assistente'}</span>
                <p className="mt-1 whitespace-pre-wrap break-words text-slate-400">{message.text}</p>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </section>
  );
}
