'use client';

import React from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

function DashboardCorretor() {
  const { profile } = useAuth();
  const nomeExibicao = profile?.nome_completo || 'Corretor';
  const emailExibicao = profile?.email || '';

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6">
          <h3 className="font-bold text-slate-200 mb-4">Seu perfil</h3>
          <ul className="space-y-3 text-xs text-slate-400">
            <li className="flex justify-between border-b border-slate-800/50 pb-2">
              <span>Cargo:</span>
              <span className="text-indigo-400 font-bold uppercase">{profile?.role}</span>
            </li>
            <li className="flex justify-between border-b border-slate-800/50 pb-2">
              <span>Nome:</span>
              <span className="text-slate-300 font-medium">{profile?.nome_completo}</span>
            </li>
            <li className="flex justify-between border-b border-slate-800/50 pb-2">
              <span>E-mail:</span>
              <span className="text-slate-300 font-medium">{emailExibicao}</span>
            </li>
            <li className="flex justify-between pb-1">
              <span>CRECI:</span>
              <span className="text-slate-300 font-medium">{profile?.creci || 'N/A'}</span>
            </li>
          </ul>
        </div>
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
