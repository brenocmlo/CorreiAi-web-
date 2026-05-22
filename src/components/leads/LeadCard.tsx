'use client';

import React from 'react';
import Link from 'next/link';
import { ETAPAS_FUNIL, type Lead } from '@/types/lead';

interface LeadCardProps {
  lead: Lead;
  onExcluir?: (lead: Lead) => void;
  compacto?: boolean;
  arrastavel?: boolean;
}

function etapaLabel(etapa: Lead['etapa']) {
  return ETAPAS_FUNIL.find((e) => e.id === etapa)?.label ?? etapa;
}

export default function LeadCard({
  lead,
  onExcluir,
  compacto = false,
  arrastavel = false,
}: LeadCardProps) {
  return (
    <div
      draggable={arrastavel}
      className={`bg-slate-900/80 border border-slate-800 rounded-xl p-4 transition hover:border-slate-700 ${
        arrastavel ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-slate-100 truncate">{lead.nome}</h4>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{lead.email}</p>
        </div>
        {!compacto && (
          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {etapaLabel(lead.etapa)}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1 text-xs text-slate-400">
        <p>
          <span className="text-slate-500">Tel:</span> {lead.telefone}
        </p>
        <p>
          <span className="text-slate-500">Orçamento:</span> {lead.faixaOrcamento}
        </p>
        <p>
          <span className="text-slate-500">Imóvel:</span> {lead.tipoImovel}
        </p>
      </div>

      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800/80">
        <Link
          href={`/leads/${lead.id}`}
          className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-slate-800 text-indigo-400 hover:bg-slate-700 transition"
        >
          Ver / Editar
        </Link>
        {onExcluir && (
          <button
            type="button"
            onClick={() => onExcluir(lead)}
            className="px-3 py-2 text-xs font-medium rounded-lg text-red-400 hover:bg-red-500/10 transition"
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}
