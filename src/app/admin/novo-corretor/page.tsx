'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, EyeOff, UserPlus } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';

export default function NovoCorretorPage() {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [creci, setCreci] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);

    if (!nomeCompleto.trim() || !email.trim() || !cpf.trim() || !creci.trim() || !senha.trim()) {
      setErro('Preencha todos os campos.');
      return;
    }

    if (senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setCarregando(true);

    try {
      const res = await fetch('/api/admin/corretores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: nomeCompleto.trim(),
          email: email.trim(),
          cpf: cpf.trim(),
          creci: creci.trim(),
          senha,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? 'Ocorreu um erro ao cadastrar o corretor.');
        return;
      }

      setSucesso(true);
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch {
      setErro('Ocorreu um erro na requisição. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
      <div className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Painel Admin
          </Link>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Cadastrar Corretor</h1>
                <p className="text-sm text-slate-500">Adicione um novo corretor à equipe</p>
              </div>
            </div>

            {erro && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                Corretor cadastrado com sucesso! Redirecionando...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="corretor@imobiliaria.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">CPF</label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">CRECI</label>
                  <input
                    type="text"
                    required
                    value={creci}
                    onChange={(e) => setCreci(e.target.value)}
                    placeholder="Ex: 12345-F"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha Temporária</label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-11 text-slate-900 placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Pelo menos 8 caracteres. Compartilhe o acesso diretamente com o corretor.</p>
              </div>

              <button
                type="submit"
                disabled={carregando || sucesso}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
              >
                {carregando ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    Cadastrar Corretor
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      </AppShell>
    </ProtectedRoute>
  );
}
