'use client';

import React from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import KanbanBoard from '@/components/leads/KanbanBoard';
import { useLeads } from '@/hooks/useLeads';

export default function FunilPage() {
  const { leads, loading, erro } = useLeads();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Funil de vendas
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                RF08 — Kanban: Novo → Em atendimento → Visita agendada → Proposta → Fechado
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/leads"
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Listagem de leads
              </Link>
              <Link
                href="/leads/novo"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition"
              >
                + Novo lead
              </Link>
            </div>
          </div>

          {erro && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {erro}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <KanbanBoard leads={leads} />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
