'use client';

import React from 'react';
import LeadCard from '@/components/leads/LeadCard';
import type { EtapaFunil, Lead } from '@/types/lead';

const CORES_COLUNA: Record<string, string> = {
  indigo: 'border-indigo-500/30 bg-indigo-500/5',
  amber: 'border-amber-500/30 bg-amber-500/5',
  cyan: 'border-cyan-500/30 bg-cyan-500/5',
  purple: 'border-purple-500/30 bg-purple-500/5',
  emerald: 'border-emerald-500/30 bg-emerald-500/5',
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
      className={`flex flex-col min-w-[260px] max-w-[300px] flex-1 rounded-2xl border p-3 transition ${
        CORES_COLUNA[cor] ?? 'border-slate-700 bg-slate-900/30'
      } ${arrastandoSobre ? 'ring-2 ring-indigo-500/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold text-slate-200">{titulo}</h3>
        <span className="text-xs font-semibold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 min-h-[120px] flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
        {leads.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-8 px-2">
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
