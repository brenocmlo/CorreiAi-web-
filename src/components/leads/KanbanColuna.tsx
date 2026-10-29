'use client';

import React from 'react';
import LeadCard from '@/components/leads/LeadCard';
import type { EtapaFunil, Lead } from '@/types/lead';

const CORES_PONTO: Record<string, string> = {
  indigo: 'bg-indigo-500',
  amber: 'bg-amber-500',
  cyan: 'bg-cyan-500',
  purple: 'bg-purple-500',
  emerald: 'bg-emerald-500',
};

interface KanbanColunaProps {
  id: EtapaFunil;
  titulo: string;
  cor: string;
  leads: Lead[];
  onDropLead: (leadId: string, etapa: EtapaFunil) => void;
}

export default function KanbanColuna({
  id,
  titulo,
  cor,
  leads,
  onDropLead,
}: KanbanColunaProps) {
  const [arrastandoSobre, setArrastandoSobre] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastandoSobre(true);
  };

  const handleDragLeave = () => setArrastandoSobre(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastandoSobre(false);
    const leadId = e.dataTransfer.getData('text/lead-id');
    if (leadId) onDropLead(leadId, id);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/lead-id', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col min-w-[270px] max-w-[310px] flex-1 rounded-xl border bg-slate-100/60 p-3 transition ${
        arrastandoSobre ? 'border-brand-primary ring-2 ring-brand-primary/30' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`h-2 w-2 shrink-0 rounded-full ${CORES_PONTO[cor] ?? 'bg-slate-400'}`} />
        <h3 className="text-sm font-semibold text-slate-800 flex-1">{titulo}</h3>
        <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 min-h-[120px] flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
        {leads.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8 px-2">
            Arraste leads para esta etapa
          </p>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              onDragStart={(e) => handleDragStart(e, lead.id)}
              draggable
            >
              <LeadCard lead={lead} compacto />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
