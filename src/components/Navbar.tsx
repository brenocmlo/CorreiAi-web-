'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  // Não exibir a Navbar nas telas de Login e Cadastro
  if (pathname === '/login' || pathname === '/cadastro') {
    return null;
  }

  // Se não tem usuário logado, também não precisa exibir a navbar da área logada
  // (O ProtectedRoute já lidaria com isso, mas é uma segurança a mais)
  if (!user) {
    return null;
  }

  const nomeExibicao = profile?.nome_completo || user?.displayName || 'Corretor';
  
  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/imoveis', label: 'Imóveis' },
    { href: '/leads', label: 'Leads' },
    { href: '/funil', label: 'Funil (Kanban)' },
    { href: '/chat', label: 'Chat IA' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Links Principais */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                CorreIA
              </span>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 font-medium">
                CRM
              </span>
            </Link>

            {/* Links de navegação (Desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isAtivo = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isAtivo
                        ? 'bg-slate-800 text-indigo-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Perfil e Botão Sair (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-200">{nomeExibicao}</p>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <button
              onClick={() => logout()}
              className="text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
            >
              Sair
            </button>
          </div>

          {/* Botão Menu Mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="text-slate-400 hover:text-white focus:outline-none p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuAberto ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {menuAberto && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => {
              const isAtivo = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuAberto(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isAtivo
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMenuAberto(false);
                logout();
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 mt-4"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
