'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Users, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface Metricas {
  total: number;
  emAtendimento: number;
  taxaConversao: number;
  faturamentoEstimado: number;
  novosTrintaDias: number;
}

function DashboardCorretor() {
  const { profile } = useAuth();
  const nomeExibicao = profile?.nome_completo || 'Corretor';
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setMetricas(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: 'Total de Leads',
      valor: metricas?.total ?? '-',
      icon: Users,
      cor: 'indigo',
    },
    {
      label: 'Em Atendimento',
      valor: metricas?.emAtendimento ?? '-',
      icon: TrendingUp,
      cor: 'amber',
    },
    {
      label: 'Taxa de Conversão',
      valor: metricas ? `${metricas.taxaConversao}%` : '-',
      icon: TrendingUp,
      cor: 'emerald',
    },
    {
      label: 'Faturamento Estimado',
      valor: metricas
        ? `R$ ${metricas.faturamentoEstimado.toLocaleString('pt-BR')}`
        : '-',
      icon: DollarSign,
      cor: 'purple',
    },
    {
      label: 'Novos (30 dias)',
      valor: metricas?.novosTrintaDias ?? '-',
      icon: Calendar,
      cor: 'cyan',
    },
  ];

  const coresBorda: Record<string, string> = {
    indigo: 'border-indigo-500/30',
    amber: 'border-amber-500/30',
    emerald: 'border-emerald-500/30',
    purple: 'border-purple-500/30',
    cyan: 'border-cyan-500/30',
  };

  const coresIcone: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    amber: 'bg-amber-500/10 text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative overflow-hidden bg-slate-900/40 border border-slate-800 rounded-2xl p-8 mb-8 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Olá,{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            {nomeExibicao}
          </span>
          !
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-xl">
          Área do corretor — gerencie leads, funil e imóveis.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/leads"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition"
          >
            Ver leads
          </Link>
          <Link
            href="/funil"
            className="px-4 py-2 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            Funil (Kanban)
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-slate-900/30 border ${coresBorda[card.cor]} rounded-2xl p-5`}
          >
            <div
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${coresIcone[card.cor]} mb-3`}
            >
              <card.icon className="h-4 w-4" />
            </div>
            <p className="text-xs text-slate-500 font-medium mb-1">{card.label}</p>
            {loading ? (
              <div className="h-6 w-16 bg-slate-800 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl font-bold text-white tracking-tight">{card.valor}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

function DashboardLead() {
  const { profile } = useAuth();
  const nomeExibicao = profile?.nome_completo || 'Cliente';

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Olá,{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {nomeExibicao}
          </span>
          !
        </h2>
        <p className="text-sm text-slate-400 mt-3 leading-relaxed">
          Você está na área do cliente (Lead). Aqui você poderá acompanhar imóveis de interesse e o
          atendimento do corretor. Esta visualização é simplificada — personalize quando quiser.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-slate-400">
          <li>
            <span className="text-slate-500">E-mail:</span>{' '}
            <span className="text-slate-300">{profile?.email}</span>
          </li>
          {profile?.cpf && (
            <li>
              <span className="text-slate-500">CPF:</span>{' '}
              <span className="text-slate-300">{profile.cpf}</span>
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const isLead = profile?.role === 'lead';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
        {isLead ? <DashboardLead /> : <DashboardCorretor />}
      </div>
    </ProtectedRoute>
  );
}
