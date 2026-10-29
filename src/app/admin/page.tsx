'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { homeForRole } from '@/lib/auth-policy';
import { useAuth } from '@/hooks/useAuth';
import { Shield, UserCheck, Plus } from 'lucide-react';
import Link from 'next/link';
import { CompanyContactSettings } from '@/components/CompanyContactSettings';
import { CompanyPublicPageSettings } from '@/components/CompanyPublicPageSettings';

interface Usuario {
  id: string;
  nome_completo: string;
  email: string;
  creci?: string | null;
  role: string;
  total_leads: number;
  criado_em: string;
  ativo: boolean;
}

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role !== 'admin_corretora') {
        router.replace(homeForRole(profile.role));
        return;
      }
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (profile?.role !== 'admin_corretora') return;
    fetch('/api/admin')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok)
          throw new Error(data.error ?? 'Não foi possível carregar a equipe.');
        return data;
      })
      .then((data) => {
        if (Array.isArray(data)) setUsuarios(data);
      })
      .catch((error) => setErro(error.message))
      .finally(() => setLoading(false));
  }, [profile?.role]);

  async function alterarAcesso(userId: string, ativo: boolean) {
    setUpdating(userId);
    setErro('');
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ativo }),
      });

      if (res.ok) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ativo } : u)),
        );
      } else {
        const data = await res.json().catch(() => ({}));
        setErro(data.error ?? 'Não foi possível alterar o acesso.');
      }
    } catch {
      setErro('Não foi possível alterar o acesso. Tente novamente.');
    } finally {
      setUpdating(null);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-primary" />
      </div>
    );
  }

  if (!profile || profile.role !== 'admin_corretora') {
    return null;
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8 space-y-6">
            <CompanyContactSettings />
            <CompanyPublicPageSettings />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Equipe da imobiliária</h2>
                <p className="text-sm text-slate-500">Cadastre corretores e controle o acesso da sua equipe</p>
              </div>
            </div>

            <Link
              href="/admin/novo-corretor"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Novo Corretor
            </Link>
          </div>

          {erro && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{erro}</p>}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white border border-slate-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Nome</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">E-mail</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">CRECI</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Leads</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Acesso</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-800">{u.nome_completo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{u.email}</td>
                      <td className="px-6 py-4 text-slate-500 hidden md:table-cell">{u.creci || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                          {u.total_leads}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.ativo
                              ? 'bg-purple-50 text-purple-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {u.ativo ? 'Ativo' : 'Suspenso'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          disabled={updating === u.id}
                          onClick={() => alterarAcesso(u.id, !u.ativo)}
                          className="text-xs px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          {updating === u.id
                            ? 'Salvando...'
                            : u.ativo
                              ? 'Suspender acesso'
                              : 'Reativar acesso'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        Nenhum corretor cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
