'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { profile, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

 
  const nomeExibicao = profile?.nome_completo || 'Corretor';
  const emailExibicao = profile?.email || '';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">

       
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          <div className="relative overflow-hidden bg-slate-900/40 border border-slate-800 rounded-2xl p-8 mb-8 shadow-xl">
            
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Olá, <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">{nomeExibicao}</span>!
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xl">
              Bem-vindo ao CorreIA. Autenticação JWT + Supabase PostgreSQL operando perfeitamente.
            </p>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2 text-xs text-indigo-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                Auth: JWT
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                DB: Supabase
              </div>
            </div>
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Seu Status */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-lg">👤</div>
                <h3 className="font-bold text-slate-200">Seu Perfil</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span>Cargo:</span>
                  <span className="text-indigo-400 font-bold uppercase tracking-wider">{profile?.role || '...'}</span>
                </li>
                <li className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span>Nome:</span>
                  <span className="text-slate-300 font-medium">{profile?.nome_completo || 'Carregando...'}</span>
                </li>
                <li className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span>E-mail:</span>
                  <span className="text-slate-300 font-medium">{emailExibicao}</span>
                </li>
                <li className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span>CPF:</span>
                  <span className="text-slate-300 font-medium">{profile?.cpf || 'N/A'}</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span>CRECI:</span>
                  <span className="text-slate-300 font-medium">{profile?.creci || 'N/A'}</span>
                </li>
              </ul>
            </div>

            
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-lg">🎯</div>
                <h3 className="font-bold text-slate-200">Seus Requisitos (P1)</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>RF01 — Login JWT</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>RF02 — Cadastro + Persistência DB</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>RF03 — Rotas Protegidas no Next.js</span>
                </div>
              </div>
            </div>

          
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-500/10 text-pink-400 rounded-xl text-lg">🚀</div>
                <h3 className="font-bold text-slate-200">Próximos Passos (Grupo)</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                A fundação está pronta. Agora os outros membros da sua equipe podem começar:
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>P2 — CRUD de Imóveis:</span>
                  <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20">Aguardando</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>P3 — CRUD de Leads & Kanban:</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">Pronto</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
