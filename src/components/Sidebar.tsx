'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Building2,
  ShieldCheck,
  Building,
  LogOut,
  Menu,
  X,
  FileText,
} from 'lucide-react';
import { homeForRole } from '@/lib/auth-policy';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Sidebar() {
  const { user, profile, isLead, isAdmin } = useAuth();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/cadastro' ||
    pathname === '/cadastro/lead' ||
    pathname === '/assistente'
  ) {
    return null;
  }
  if (!user) return null;

  const nomeExibicao = profile?.nome_completo || 'Usuário';
  const isSuperAdmin = profile?.role === 'super_admin';

  const navLinksCorretor: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/imoveis', label: 'Imóveis', icon: Building2 },
    { href: '/leads', label: 'Leads', icon: Users },
    { href: '/funil', label: 'Funil', icon: KanbanSquare },
    ...(isAdmin ? [{ href: '/admin', label: 'Equipe', icon: ShieldCheck }] : []),
  ];

  const navLinksLead: NavItem[] = [
    { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { href: '/cliente', label: 'Meu atendimento', icon: FileText },
  ];
  const navLinksSuperAdmin: NavItem[] = [
    { href: '/admin/imobiliarias', label: 'Imobiliárias', icon: Building },
  ];

  const navLinks = isSuperAdmin ? navLinksSuperAdmin : isLead ? navLinksLead : navLinksCorretor;

  const prepareLogout = () => {
    try {
      sessionStorage.removeItem('correia-assistente');
    } catch {
      /* Armazenamento opcional. */
    }
  };

  const papel = isSuperAdmin
    ? 'Administrador geral'
    : isAdmin
      ? 'Administrador'
      : isLead
        ? 'Cliente'
        : 'Corretor';

  const iniciais = nomeExibicao
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  const logo = (
    <Link
      href={profile ? homeForRole(profile.role) : '/login'}
      className="flex items-center gap-2.5"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-sm font-bold text-white">
        C
      </span>
      <span>
        <span className="block text-sm font-bold leading-none text-white">CorreAI</span>
        <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-500">
          CRM Imobiliário
        </span>
      </span>
    </Link>
  );

  const userFooter = (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200">
        {iniciais}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-200">{nomeExibicao}</span>
        <span className="block text-xs text-slate-500">{papel}</span>
      </span>
      <form action="/api/auth/logout" method="post" onSubmit={prepareLogout}>
        <button
          type="submit"
          aria-label="Sair"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Desktop: coluna fixa. */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-slate-800 bg-[#0d1117] lg:flex">
        <div className="border-b border-slate-800 px-5 py-5">{logo}</div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navLinks.map((link) => {
            const isAtivo = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isAtivo
                    ? 'bg-brand-primary/15 text-brand-accent'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <link.icon className="h-[18px] w-[18px] shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">{userFooter}</div>
      </aside>

      {/* Mobile: barra superior com menu suspenso. */}
      <div className="sticky top-0 z-50 border-b border-slate-800 bg-[#0d1117] lg:hidden">
        <div className="flex items-center justify-between px-4 py-3.5">
          {logo}
          <button
            onClick={() => setMenuAberto((v) => !v)}
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuAberto && (
          <div className="border-t border-slate-800 px-3 py-3">
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const isAtivo = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuAberto(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isAtivo
                        ? 'bg-brand-primary/15 text-brand-accent'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                    }`}
                  >
                    <link.icon className="h-[18px] w-[18px] shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 border-t border-slate-800 pt-3">{userFooter}</div>
          </div>
        )}
      </div>
    </>
  );
}
