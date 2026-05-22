'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import LeadCard from '@/components/leads/LeadCard';
import ConfirmDialog from '@/components/leads/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { useLeads } from '@/hooks/useLeads';
import { deleteLead } from '@/lib/leads';
import type { Lead } from '@/types/lead';

export default function LeadsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const { leads, loading, erro, recarregar } = useLeads();

  useEffect(() => {
    if (profile?.role === 'lead') {
      router.replace('/dashboard');
    }
  }, [profile?.role, router]);
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
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Leads
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                RF06.1 — Listagem com opções de editar e excluir cada registro
              </p>
            </div>
            <Link
              href="/funil"
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Ver funil (Kanban)
            </Link>
          </div>

          {erro && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {erro}
            </div>
          )}

          {erroExclusao && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {erroExclusao}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <p className="text-slate-400">Nenhum lead cadastrado ainda.</p>
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
      </div>
    </ProtectedRoute>
  );
}
