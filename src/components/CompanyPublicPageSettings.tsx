'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Copy, ExternalLink, Globe } from 'lucide-react';
import { requestJson } from '@/lib/client-request';
import { isPublicAgencySlug, publicAgencyPath } from '@/lib/public-agency-path';

export function CompanyPublicPageSettings() {
  const [slug, setSlug] = useState(''),
    [enabled, setEnabled] = useState(false),
    [savedSlug, setSavedSlug] = useState<string | null>(null),
    [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  useEffect(() => {
    let active = true;
    requestJson<{
      imobiliaria: {
        id: string;
        nome: string;
        public_slug?: string | null;
        atendimento_publico?: boolean;
      };
    }>('/api/imobiliaria')
      .then(({ imobiliaria: agency }) => {
        if (!active) return;
        const suggestion = agency.nome
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 70)
          .replace(/-$/, '');
        setSlug(
          agency.public_slug ||
            (suggestion.length >= 3
              ? suggestion
              : `imobiliaria-${agency.id.slice(0, 8)}`),
        );
        setEnabled(agency.atendimento_publico === true);
        setPublished(agency.atendimento_publico === true);
        setSavedSlug(agency.public_slug ?? null);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!isPublicAgencySlug(slug)) {
      setError(
        'Use de 3 a 80 letras minúsculas, números e hífens no endereço.',
      );
      return;
    }
    setSaving(true);
    try {
      const data = await requestJson<{
        public_slug: string;
        atendimento_publico: boolean;
      }>('/api/imobiliaria', {
        method: 'PATCH',
        body: JSON.stringify({
          public_slug: slug,
          atendimento_publico: enabled,
        }),
      });
      setSavedSlug(data.public_slug);
      setPublished(data.atendimento_publico);
      setSuccess(
        data.atendimento_publico
          ? 'Página pública ativada. Você já pode compartilhar o link.'
          : 'Página pública desativada. O catálogo interno foi preservado.',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar a página.',
      );
    } finally {
      setSaving(false);
    }
  }
  async function copy() {
    if (!savedSlug) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${publicAgencyPath(savedSlug)}`,
      );
      setSuccess('Link copiado. Compartilhe com seus clientes.');
    } catch {
      setError(
        'Não foi possível copiar. Abra a página e copie o endereço do navegador.',
      );
    }
  }
  return (
    <section
      aria-label="Página pública da imobiliária"
      className="mb-8 rounded-2xl border border-indigo-400/15 bg-slate-900/50 p-5 sm:p-6"
    >
      <h2 className="flex items-center gap-2 font-semibold text-white">
        <Globe aria-hidden="true" className="h-4 w-4 text-indigo-300" />
        Página de atendimento para clientes
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
        Compartilhe uma página da sua imobiliária. Os visitantes veem os imóveis
        disponíveis e os preços, deixam o contato e conversam com a IA. Os leads
        chegam ao funil da sua equipe.
      </p>
      <form onSubmit={save} className="mt-5 space-y-4">
        <label
          htmlFor="agency-public-slug"
          className="block text-sm text-slate-300"
        >
          Endereço do link
          <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
            <span className="flex items-center border-r border-slate-700 px-3 text-xs text-slate-500">
              /imobiliaria/
            </span>
            <input
              id="agency-public-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              required
              maxLength={80}
              disabled={loading || saving}
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white outline-none focus:bg-slate-900"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </label>
        <p className="text-xs text-slate-500">
          Se alterar o endereço, compartilhe o novo link com seus clientes.
        </p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4 text-sm leading-relaxed text-slate-300">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={loading || saving}
            className="mt-1 h-4 w-4 shrink-0 accent-indigo-500"
          />
          Permitir que visitantes vejam os imóveis disponíveis e o contato
          comercial desta imobiliária, sem login.
        </label>
        <button
          disabled={loading || saving}
          className="min-h-11 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving
            ? 'Salvando...'
            : loading
              ? 'Carregando...'
              : 'Salvar página pública'}
        </button>
      </form>
      {published && savedSlug && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
          <Link
            href={publicAgencyPath(savedSlug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 text-sm text-emerald-200"
          >
            Abrir página da imobiliária
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-slate-200 hover:bg-white/5"
          >
            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
            Copiar link
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-3 text-sm text-emerald-300">
          {success}
        </p>
      )}
    </section>
  );
}
