'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useImoveis } from '@/hooks/useImoveis';
import ImovelCard from '@/components/ImovelCard';
import { AssistantChat } from '@/components/assistant/AssistantChat';
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
  const nomeExibicao = profile?.nome_completo || 'Cliente';
  const { imoveis, loading: loadingImoveis, fetchImoveis } = useImoveis();
  const [activeTab, setActiveTab] = useState<'imoveis' | 'chat'>('imoveis');

  useEffect(() => { void fetchImoveis(); }, [fetchImoveis]);

  const imoveisDisponiveis = imoveis.filter((i) => i.status === 'disponivel');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header do Lead */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Olá, {nomeExibicao}!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Seja bem-vindo ao CorreAI. Explore imóveis disponíveis ou converse com nosso assistente inteligente.
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 self-stretch sm:self-auto flex flex-col gap-1">
          <div><span className="font-semibold text-slate-600">E-mail:</span> {profile?.email}</div>
          {profile?.cpf && <div><span className="font-semibold text-slate-600">CPF:</span> {profile.cpf}</div>}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('imoveis')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'imoveis'
              ? 'border-brand-primary text-brand-primary font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="h-4 w-4" />
          Imóveis Disponíveis
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'chat'
              ? 'border-brand-primary text-brand-primary font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Chat com a IA
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1">
        {activeTab === 'imoveis' ? (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">Catálogo de Imóveis</h3>
              <p className="text-xs text-slate-500">Imóveis prontos para visitação e compra</p>
            </div>

            {loadingImoveis && imoveisDisponiveis.length === 0 ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
              </div>
            ) : imoveisDisponiveis.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 text-xl">
                  🏠
                </div>
                <h4 className="text-slate-900 font-medium mb-1">Nenhum imóvel disponível</h4>
                <p className="text-xs text-slate-500">Não há imóveis disponíveis no catálogo no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {imoveisDisponiveis.map((imovel) => (
                  <ImovelCard key={imovel.id} imovel={imovel} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <AssistantChat embedded />
        )}
      </div>
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
