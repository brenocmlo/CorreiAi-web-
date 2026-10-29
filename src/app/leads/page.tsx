'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import LeadCard from '@/components/leads/LeadCard';
import ConfirmDialog from '@/components/leads/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { useLeads } from '@/hooks/useLeads';
import { deleteLead } from '@/lib/leads';
import type { Lead } from '@/types/lead';

export default function LeadsPage() {
  const { isLead } = useAuth();
  const router = useRouter();
  const { leads, loading, erro, recarregar } = useLeads();

  useEffect(() => {
    if (isLead) {
      router.replace('/dashboard');
    }
  }, [isLead, router]);
  const [leadExcluir, setLeadExcluir] = useState<Lead | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');

  const handleConfirmarExclusao = async () => {
    if (!leadExcluir) return;
    setExcluindo(true);
    setErroExclusao('');
    try {
      await deleteLead(leadExcluir.id);
      setLeadExcluir(null);
      await recarregar();
    } catch {
      setErroExclusao('Erro ao excluir o lead. Tente novamente.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Leads
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Gestão do funil de vendas — edite ou exclua cada registro
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/funil"
                className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Ver funil (Kanban)
              </Link>
              <Link
                href="/leads/novo"
                className="px-4 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-sm font-semibold text-white transition shadow-sm"
              >
                Novo lead
              </Link>
            </div>
          </div>

          {erro && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {erro}
            </div>
          )}

          {erroExclusao && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {erroExclusao}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <p className="text-slate-500">Nenhum lead cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onExcluir={(l) => setLeadExcluir(l)}
                />
              ))}
            </div>
          )}
        </main>

        <ConfirmDialog
          aberto={!!leadExcluir}
          titulo="Excluir lead"
          mensagem={
            leadExcluir
              ? `Tem certeza que deseja excluir "${leadExcluir.nome}"? Esta ação não pode ser desfeita.`
              : ''
          }
          carregando={excluindo}
          onConfirmar={handleConfirmarExclusao}
          onCancelar={() => setLeadExcluir(null)}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
