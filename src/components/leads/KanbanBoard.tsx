'use client';

import React, { useState } from 'react';
import KanbanColuna from '@/components/leads/KanbanColuna';
import { ETAPAS_FUNIL, type EtapaFunil, type Lead } from '@/types/lead';
import { updateLead } from '@/lib/leads';

interface KanbanBoardProps {
  leads: Lead[];
  onLeadUpdated?: () => void;
}

export default function KanbanBoard({ leads, onLeadUpdated }: KanbanBoardProps) {
  const [movendo, setMovendo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleDropLead = async (leadId: string, etapa: EtapaFunil) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.etapa === etapa) return;

    setMovendo(leadId);
    setErro(null);
    try {
      await updateLead(leadId, { etapa });
      onLeadUpdated?.();
    } catch {
      setErro('Não foi possível mover o lead. Tente novamente.');
    } finally {
      setMovendo(null);
    }
  };

  return (
    <div>
      {erro && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {erro}
        </div>
      )}
      {movendo && (
        <p className="text-xs text-slate-500 mb-3 animate-pulse">Atualizando funil...</p>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ETAPAS_FUNIL.map((etapa) => (
          <KanbanColuna
            key={etapa.id}
            id={etapa.id}
            titulo={etapa.label}
            cor={etapa.cor}
            leads={leads.filter((l) => l.etapa === etapa.id)}
            onDropLead={handleDropLead}
          />
        ))}
      </div>
    </div>
  );
}
