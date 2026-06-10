'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Shield, UserCheck, Plus } from 'lucide-react';
import Link from 'next/link';

interface Usuario {
  id: string;
  nome_completo: string;
  email: string;
  creci?: string | null;
  role: string;
  total_leads: number;
  criado_em: string;
}

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role !== 'admin_corretora' && profile.role !== 'super_admin') {
        router.replace('/dashboard');
        return;
      }
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    fetch('/api/admin')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsuarios(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function alterarRole(userId: string, novaRole: string) {
    const res = await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: novaRole }),
    });

    if (res.ok) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: novaRole } : u))
      );
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!profile || (profile.role !== 'admin_corretora' && profile.role !== 'super_admin')) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white">Painel Admin</h2>
                <p className="text-sm text-slate-400">Gestão de corretores e permissões</p>
              </div>
            </div>
            
            <Link
              href="/admin/novo-corretor"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-purple-500"
            >
              <Plus className="h-4 w-4" />
              Novo Corretor
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left">
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Nome</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">E-mail</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">CRECI</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Leads</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Permissão</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-200">{u.nome_completo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{u.email}</td>
                      <td className="px-6 py-4 text-slate-400 hidden md:table-cell">{u.creci || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400">
                          {u.total_leads}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === 'admin_corretora'
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-slate-700/50 text-slate-400'
                          }`}
                        >
                          {u.role === 'admin_corretora' ? 'Admin' : 'Corretor'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            alterarRole(
                              u.id,
                              u.role === 'admin_corretora' ? 'corretor' : 'admin_corretora'
                            )
                          }
                          className="text-xs px-3 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          {u.role === 'admin_corretora' ? 'Rebaixar' : 'Promover'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        Nenhum corretor cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
