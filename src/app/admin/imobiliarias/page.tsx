'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Company = { id: string; nome: string; cnpj: string | null; ativo: boolean; total_corretores: number; administradores: { id: string; nome: string; email: string; ativo: boolean }[] };

export default function ImobiliariasPage() {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState<Company | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/imobiliarias', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível carregar as imobiliárias.');
      setCompanies(data.imobiliarias);
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao carregar.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { async function start() { await load(); } void start(); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess(''); setSaving(true);
    const form = event.currentTarget;
    const fields = new FormData(form);
    try {
      const res = await fetch('/api/admin/imobiliarias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        nome: fields.get('nome'), cnpj: fields.get('cnpj'), administrador: {
          nome_completo: fields.get('adminNome'), email: fields.get('email'), senha: fields.get('senha'),
        },
      }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível liberar a imobiliária.');
      form.reset(); setShowForm(false); setSuccess('Imobiliária liberada. O administrador já pode entrar com o e-mail e a senha definidos e cadastrar os corretores.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao cadastrar.'); }
    finally { setSaving(false); }
  }

  async function changeAccess() {
    if (!pending) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/imobiliarias', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: pending.id, ativo: !pending.ativo }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível alterar o acesso.');
      setSuccess(pending.ativo ? 'Acesso da imobiliária suspenso. Seus dados foram preservados.' : 'Acesso da imobiliária reativado.');
      setPending(null); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao atualizar.'); }
    finally { setSaving(false); }
  }

  if (profile?.role !== 'super_admin') return null;
  const fieldClass = 'mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500';
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div><p className="mb-2 text-sm text-blue-400">Administração geral</p><h1 className="text-3xl font-bold">Imobiliárias</h1><p className="mt-2 max-w-2xl text-slate-400">Libere o acesso das empresas. Cada administrador de imobiliária cadastra e gerencia sua própria equipe.</p></div>
        <button onClick={() => setShowForm(v => !v)} className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium hover:bg-blue-500">{showForm ? 'Fechar formulário' : 'Nova imobiliária'}</button>
      </div>
      {error && <div role="alert" className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</div>}
      {success && <p role="status" className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">{success}</p>}
      {showForm && (
        <form onSubmit={create} className="mb-8 rounded-xl border border-slate-700 bg-slate-900/50 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Liberar uma imobiliária</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm text-slate-300" htmlFor="empresa-nome">Nome da imobiliária<input id="empresa-nome" name="nome" required minLength={2} maxLength={160} className={fieldClass} /></label>
            <label className="text-sm text-slate-300" htmlFor="empresa-cnpj">CNPJ (opcional)<input id="empresa-cnpj" name="cnpj" inputMode="numeric" maxLength={18} className={fieldClass} /></label>
            <label className="text-sm text-slate-300" htmlFor="empresa-admin">Nome do administrador<input id="empresa-admin" name="adminNome" required minLength={2} maxLength={120} autoComplete="name" className={fieldClass} /></label>
            <label className="text-sm text-slate-300" htmlFor="empresa-email">E-mail do administrador<input id="empresa-email" name="email" required type="email" maxLength={254} autoComplete="off" className={fieldClass} /></label>
            <label className="text-sm text-slate-300" htmlFor="empresa-senha">Senha inicial<input id="empresa-senha" name="senha" required type="password" minLength={8} maxLength={128} autoComplete="new-password" className={fieldClass} /><span className="mt-2 block text-xs text-slate-400">Pelo menos 8 caracteres. Compartilhe o acesso diretamente com o responsável.</span></label>
          </div>
          <p className="mt-5 text-sm text-slate-400">Esta conta administrará somente a empresa criada. O e-mail precisa estar disponível.</p>
          <button disabled={saving} className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 font-medium hover:bg-blue-500 disabled:opacity-50">{saving ? 'Liberando...' : 'Liberar imobiliária e criar administrador'}</button>
        </form>
      )}
      {pending && (
        <section aria-label="Confirmar alteração de acesso" className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5">
          <h2 className="font-semibold">{pending.ativo ? 'Suspender' : 'Reativar'} {pending.nome}?</h2>
          <p className="mt-2 text-sm text-slate-300">{pending.ativo ? 'O administrador e os corretores perderão o acesso enquanto a empresa estiver suspensa. Os dados serão preservados.' : 'O administrador e os corretores ativos poderão entrar novamente.'}</p>
          <div className="mt-4 flex gap-3"><button disabled={saving} onClick={changeAccess} className="rounded-lg bg-amber-600 px-4 py-2 disabled:opacity-50">Confirmar</button><button disabled={saving} onClick={() => setPending(null)} className="rounded-lg border border-slate-600 px-4 py-2">Cancelar</button></div>
        </section>
      )}
      {loading ? <p role="status">Carregando imobiliárias...</p> : companies.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-8 text-center"><h2 className="text-lg font-semibold">Nenhuma imobiliária liberada</h2><p className="mt-2 text-slate-400">Cadastre a primeira empresa e defina o administrador responsável.</p></div>
      ) : <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-900 text-slate-400"><tr><th className="p-4">Imobiliária</th><th className="p-4">Administrador</th><th className="p-4">Corretores</th><th className="p-4">Acesso</th><th className="p-4">Ação</th></tr></thead><tbody className="divide-y divide-slate-800">{companies.map(company => <tr key={company.id}><td className="p-4 font-medium">{company.nome}{company.cnpj && <span className="mt-1 block text-xs font-normal text-slate-400">{company.cnpj}</span>}</td><td className="p-4">{company.administradores.map(a => <div key={a.id}>{a.nome}<span className="block text-slate-400">{a.email}</span></div>)}</td><td className="p-4">{company.total_corretores}</td><td className="p-4">{company.ativo ? 'Ativo' : 'Suspenso'}</td><td className="p-4"><button disabled={saving} onClick={() => setPending(company)} className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800">{company.ativo ? 'Suspender acesso' : 'Reativar acesso'}</button></td></tr>)}</tbody></table></div>}
    </main>
  );
}
