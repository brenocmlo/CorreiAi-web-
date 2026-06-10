'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useImoveis } from '@/hooks/useImoveis';
import ImovelCard from '@/components/ImovelCard';
import { Users, TrendingUp, DollarSign, Calendar, Send, Home, Sparkles } from 'lucide-react';

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

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

function DashboardLead() {
  const { profile } = useAuth();
  const nomeExibicao = profile?.nome_completo || 'Cliente';
  const { imoveis, loading: loadingImoveis, fetchImoveis } = useImoveis();
  const [activeTab, setActiveTab] = useState<'imoveis' | 'chat'>('imoveis');

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Olá, ${nomeExibicao}! Sou o CorretorIA, assistente inteligente do CorreIA. 🏠\n\nEstou aqui para te ajudar a encontrar o seu imóvel ideal. Que tipo de imóvel você está procurando e qual o seu orçamento?`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchImoveis();
  }, [fetchImoveis]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const enviarMensagemChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const novas: Message[] = [...messages, { role: 'user', text }];
    setMessages(novas);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: novas }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'Desculpe, ocorreu um erro ao obter a resposta. Tente de novo.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Erro de conexão. Verifique sua rede e envie novamente.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagemChat();
    }
  };

  const imoveisDisponiveis = imoveis.filter((i) => i.status === 'disponivel');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header do Lead */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Olá,{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {nomeExibicao}
            </span>
            !
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Seja bem-vindo ao CorreIA. Explore imóveis disponíveis ou converse com nosso assistente inteligente.
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 self-stretch sm:self-auto flex flex-col gap-1">
          <div><span className="font-semibold text-slate-400">E-mail:</span> {profile?.email}</div>
          {profile?.cpf && <div><span className="font-semibold text-slate-400">CPF:</span> {profile.cpf}</div>}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('imoveis')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'imoveis'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="h-4 w-4" />
          Imóveis Disponíveis
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'chat'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
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
              <h3 className="text-lg font-bold text-white">Catálogo de Imóveis</h3>
              <p className="text-xs text-slate-400">Imóveis prontos para visitação e compra</p>
            </div>

            {loadingImoveis && imoveisDisponiveis.length === 0 ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
              </div>
            ) : imoveisDisponiveis.length === 0 ? (
              <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-12 text-center">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500 text-xl">
                  🏠
                </div>
                <h4 className="text-white font-medium mb-1">Nenhum imóvel disponível</h4>
                <p className="text-xs text-slate-400">Não há imóveis disponíveis no catálogo no momento.</p>
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
          <div className="flex flex-col h-[550px] bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Chat Header */}
            <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-800 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-sm font-semibold text-white">CorretorIA - Assistente Virtual</h4>
            </div>

            {/* Chat Message History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-800/80 text-slate-200 rounded-bl-none border border-slate-700/50 shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Footer */}
            <div className="bg-slate-900/80 p-4 border-t border-slate-800">
              <div className="flex gap-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Pergunte sobre imóveis, orçamentos, localizações..."
                  disabled={chatLoading}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <button
                  onClick={enviarMensagemChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl px-4 py-3 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
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
