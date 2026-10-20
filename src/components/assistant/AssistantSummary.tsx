import type { CaptureStatus, Qualification } from '@/types/assistant';

export function AssistantSummary({ value, status }: { value: Qualification; status: CaptureStatus }) {
  return (
    <section aria-label="Resumo da sua busca" className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm">
      <h2 className="font-medium text-slate-100">Sua busca até aqui</h2>
      <p className="mt-2 leading-relaxed text-slate-300">{value.resumo || 'Conte o que você procura para começarmos.'}</p>
      {(status === 'criado' || status === 'atualizado') && <p role="status" className="mt-3 text-emerald-300">{status === 'criado' ? 'Contato e preferências enviados ao corretor.' : 'Suas preferências foram atualizadas para o corretor.'}</p>}
      {status === 'nao_autorizado' && <p role="status" className="mt-3 text-amber-200">Sua preferência de não receber contato foi respeitada.</p>}
      {value.visitaSolicitada && <p className="mt-2 text-amber-200">Visita solicitada{value.visitaPreferencia ? `: ${value.visitaPreferencia}` : ''}. O corretor ainda precisa confirmar dia e horário.</p>}
    </section>
  );
}
