'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import KanbanBoard from '@/components/leads/KanbanBoard';
import { useAuth } from '@/hooks/useAuth';
import { useLeads } from '@/hooks/useLeads';

export default function FunilPage() {
  const { isLead } = useAuth();
  const router = useRouter();
  const { leads, loading, erro, recarregar } = useLeads();

  useEffect(() => {
    if (isLead) {
      router.replace('/dashboard');
    }
  }, [isLead, router]);

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Funil de vendas
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Novo → Em atendimento → Visita agendada → Proposta → Fechado
              </p>
            </div>
            <Link
              href="/leads"
              className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Listagem de leads
            </Link>
          </div>

          {erro && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {erro}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
            </div>
          ) : (
            <KanbanBoard leads={leads} onLeadUpdated={recarregar} />
          )}
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
