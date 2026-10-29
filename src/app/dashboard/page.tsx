'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useImoveis } from '@/hooks/useImoveis';
import ImovelCard from '@/components/ImovelCard';
import { OpenChatButton } from '@/components/assistant/OpenChatButton';
import { Users, TrendingUp, DollarSign, Calendar, Home, Sparkles } from 'lucide-react';

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

  const coresIcone: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Olá, {nomeExibicao}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Área do corretor — gerencie leads, funil e imóveis.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/leads"
            className="px-4 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-sm font-semibold text-white transition shadow-sm"
          >
            Ver leads
          </Link>
          <Link
            href="/funil"
            className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Funil (Kanban)
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
          >
            <div
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${coresIcone[card.cor]} mb-3`}
            >
              <card.icon className="h-4 w-4" />
            </div>
            <p className="text-xs text-slate-500 font-medium mb-1">{card.label}</p>
            {loading ? (
              <div className="h-6 w-16 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl font-bold text-slate-900 tracking-tight">{card.valor}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

function DashboardLead() {
  const { profile } = useAuth();
  const { imoveis, loading, error, fetchImoveis } = useImoveis();
  useEffect(() => { void fetchImoveis(); }, [fetchImoveis]);
  const available = imoveis.filter(imovel => imovel.status === 'disponivel');
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm text-brand-primary">Sua busca, do seu jeito</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Olá, {profile?.nome_completo || 'Cliente'}!</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">Consulte os imóveis disponíveis para sua conta. A CorreAI ajuda a escolher e preparar seu atendimento com o corretor.</p>
        </div>
        <OpenChatButton className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary-hover">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          Conversar com a CorreAI
        </OpenChatButton>
      </header>
      <section aria-label="Imóveis disponíveis">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Imóveis para você</h2>
        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
            <button type="button" onClick={() => void fetchImoveis()} className="ml-3 underline">Tentar novamente</button>
          </div>
        ) : loading ? (
          <p role="status" className="py-10 text-slate-500">Consultando seu catálogo...</p>
        ) : available.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {available.map((imovel) => (
              <ImovelCard key={imovel.id} imovel={imovel} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Home aria-hidden="true" className="mx-auto mb-3 h-7 w-7 text-slate-400" />
            <h3 className="font-medium text-slate-900">Seu catálogo está vazio</h3>
            <p className="mt-2 text-sm text-slate-500">Os imóveis aparecem conforme o vínculo da sua conta com a imobiliária. A assistente continua disponível para tirar dúvidas.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default function DashboardPage() {
  const { isLead } = useAuth();

  return (
    <ProtectedRoute>
      <AppShell>
        {isLead ? <DashboardLead /> : <DashboardCorretor />}
      </AppShell>
    </ProtectedRoute>
  );
}
