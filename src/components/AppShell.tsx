import React from 'react';

/**
 * Reserva o espaço da Sidebar fixa (lg+) e aplica o fundo claro do
 * conteúdo logado. A Sidebar em si é montada globalmente no layout raiz.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 lg:pl-64">{children}</div>;
}
