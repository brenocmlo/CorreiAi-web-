'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            CorreIA
          </span>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <section className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            CRM Imobiliário Inteligente
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Plataforma para corretores e clientes conectarem oportunidades imobiliárias com mais
            agilidade. Personalize este texto com a história e os diferenciais da sua empresa.
          </p>
        </section>

        <section className="grid sm:grid-cols-3 gap-6 mb-16">
          {[
            {
              titulo: 'Para corretores',
              descricao: 'Organize leads, funil de vendas e atendimento em um só lugar.',
            },
            {
              titulo: 'Para clientes',
              descricao: 'Acompanhe imóveis de interesse e converse com quem te atende.',
            },
            {
              titulo: 'Inteligência',
              descricao: 'Espaço reservado para destacar IA, automações ou integrações.',
            },
          ].map((item) => (
            <div
              key={item.titulo}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-left"
            >
              <h2 className="font-bold text-slate-200 mb-2">{item.titulo}</h2>
              <p className="text-sm text-slate-400">{item.descricao}</p>
            </div>
          ))}
        </section>

        <section className="text-center">
          <p className="text-slate-500 text-sm mb-4">Ainda não tem conta?</p>
          <Link
            href="/cadastro"
            className="inline-block px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
          >
            Criar conta
          </Link>
        </section>
      </main>
    </div>
  );
}
