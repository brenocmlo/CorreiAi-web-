'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, Pencil, Trash2 } from 'lucide-react';
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

function tempoRelativo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos}min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `há ${dias}d`;
}

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
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
      className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md ${
        arrastavel ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
          {iniciais(lead.nome)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-slate-900 truncate">{lead.nome}</h4>
            {!compacto && (
              <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                {etapaLabel(lead.etapa)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{tempoRelativo(lead.criadoEm)}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 truncate">
          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          {lead.telefone}
        </div>
      </div>

      {lead.qualificacao && (
        <div className="mt-3 space-y-1 rounded-lg bg-indigo-50/60 p-2.5 text-xs">
          <p className="font-medium text-indigo-700">Atendimento pelo assistente</p>
          {lead.qualificacao.bairro && <p className="text-slate-600">Bairro: {lead.qualificacao.bairro}</p>}
          {lead.qualificacao.visitaSolicitada && (
            <p className="text-amber-600">Visita solicitada · confirmar com o cliente</p>
          )}
          {!lead.qualificacao.permiteContato && (
            <p className="text-amber-600">Cliente pediu para não ser contatado</p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
          {lead.faixaOrcamento}
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
          {lead.tipoImovel}
        </span>
      </div>

      <div className="flex gap-2 mt-3.5 pt-3 border-t border-slate-100">
        <Link
          href={`/leads/${lead.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 text-center text-xs font-medium py-2 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
        >
          <Pencil className="h-3.5 w-3.5" />
          Ver / Editar
        </Link>
        {onExcluir && (
          <button
            type="button"
            onClick={() => onExcluir(lead)}
            aria-label="Excluir lead"
            className="px-3 py-2 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
