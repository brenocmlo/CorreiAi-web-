import type { CaptureStatus, Qualification } from '@/types/assistant';

export function AssistantSummary({
  value,
  status,
}: {
  value: Qualification;
  status: CaptureStatus;
}) {
  return (
    <details
      aria-label="Resumo da sua busca"
      className="rounded-xl border border-white/10 px-3 py-2.5 text-xs"
    >
      <summary className="cursor-pointer font-medium text-slate-400">
        Ver resumo da busca
      </summary>
      <p className="mt-3 leading-relaxed text-slate-300">
        {value.resumo || 'Suas preferências aparecerão aqui.'}
      </p>
      {(status === 'criado' || status === 'atualizado') && (
        <p role="status" className="mt-3 text-emerald-300">
          {status === 'criado'
            ? 'Contato e preferências enviados ao corretor.'
            : 'Suas preferências foram atualizadas para o corretor.'}
        </p>
      )}
      {status === 'nao_autorizado' && (
        <p role="status" className="mt-3 text-amber-200">
          Sua preferência de não receber contato foi respeitada.
        </p>
      )}
      {status === 'demonstracao' && (
        <p className="mt-3 text-indigo-200">
          Simulação: nenhum cadastro, contato ou visita real.
        </p>
      )}
      {value.visitaSolicitada && status !== 'demonstracao' && (
        <p className="mt-2 text-amber-200">
          Visita solicitada
          {value.visitaPreferencia ? `: ${value.visitaPreferencia}` : ''}. O
          corretor ainda precisa confirmar dia e horário.
        </p>
      )}
    </details>
  );
}
