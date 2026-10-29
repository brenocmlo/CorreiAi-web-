'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
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
  const { imoveis, loading, error, fetchImoveis } = useImoveis();
  useEffect(() => { void fetchImoveis(); }, [fetchImoveis]);
  const available = imoveis.filter(imovel => imovel.status === 'disponivel');
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
        <div><p className="text-sm text-indigo-300">Sua busca, do seu jeito</p><h1 className="mt-2 text-2xl font-semibold text-white">Olá, {profile?.nome_completo || 'Cliente'}!</h1><p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">Consulte os imóveis disponíveis para sua conta. A CorreAI ajuda a escolher e preparar seu atendimento com o corretor.</p></div>
        <OpenChatButton className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500"><Sparkles aria-hidden="true" className="h-4 w-4"/>Conversar com a CorreAI</OpenChatButton>
      </header>
      <Link href="/cliente" className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 text-indigo-200 hover:bg-indigo-500/20"><span className="block font-semibold">Meu atendimento →</span><span className="mt-1 block text-sm text-slate-400">Acesse seu convite, documentos e mensagens com o corretor.</span></Link>
      <section aria-label="Imóveis disponíveis"><h2 className="mb-4 text-lg font-semibold text-white">Imóveis para você</h2>
        {error ? <div role="alert" className="rounded-xl border border-red-500/30 p-5 text-sm text-red-200">{error}<button type="button" onClick={()=>void fetchImoveis()} className="ml-3 underline">Tentar novamente</button></div> : loading ? <p role="status" className="py-10 text-slate-400">Consultando seu catálogo...</p> : available.length ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{available.map(imovel=><ImovelCard key={imovel.id} imovel={imovel}/>)}</div> : <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 text-center"><Home aria-hidden="true" className="mx-auto mb-3 h-7 w-7 text-slate-500"/><h3 className="font-medium text-white">Seu catálogo está vazio</h3><p className="mt-2 text-sm text-slate-400">Os imóveis aparecem conforme o vínculo da sua conta com a imobiliária. A assistente continua disponível para tirar dúvidas.</p></div>}
      </section>
    </main>
  );
}

export default function DashboardPage() {
  const { isLead } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
        {isLead ? <DashboardLead /> : <DashboardCorretor />}
      </div>
    </ProtectedRoute>
  );
}
