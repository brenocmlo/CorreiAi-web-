'use client';
import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAssistant } from '@/contexts/AssistantContext';
import { requestJson } from '@/lib/client-request';
import { phoneDigits, formatPhone } from '@/lib/phone';

export function PublicLeadForm({
  slug,
  companyName,
}: {
  slug: string;
  companyName: string;
}) {
  const [nome, setNome] = useState(''),
    [email, setEmail] = useState(''),
    [telefone, setTelefone] = useState('');
  const [consentimento, setConsentimento] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(false);
  const { refreshChat } = useAssistant();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess(false);
    if (
      nome.trim().length < 3 ||
      !phoneDigits(telefone) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      !consentimento
    ) {
      setError('Informe seus dados e autorize o atendimento para continuar.');
      return;
    }
    setSaving(true);
    try {
      await requestJson(
        `/api/leads/public?imobiliaria=${encodeURIComponent(slug)}`,
        {
          method: 'POST',
          body: JSON.stringify({ nome, email, telefone, consentimento }),
        },
      );
      try {
        sessionStorage.removeItem(`correia-assistente:publico:${slug}`);
      } catch {
        /* Armazenamento opcional. */
      }
      setSuccess(true);
      refreshChat();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível iniciar o atendimento.',
      );
    } finally {
      setSaving(false);
    }
  }
  const field =
    'mt-2 w-full rounded-xl border border-white/15 bg-slate-950/70 px-4 py-3 text-base text-white outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 disabled:opacity-50';
  return (
    <section
      aria-label="Cadastro rápido para atendimento"
      className="rounded-3xl border border-white/10 bg-slate-900/85 p-5 shadow-2xl shadow-black/20 sm:p-7"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
        Seu atendimento começa aqui
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
        Vamos encontrar o seu imóvel?
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Deixe seu contato e converse com a CorreAI. Ela já recebe seus dados e
        busca opções de {companyName}.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm text-slate-300" htmlFor="public-nome">
          Seu nome
          <input
            id="public-nome"
            autoComplete="name"
            required
            maxLength={120}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={saving}
            className={field}
            placeholder="Como você prefere ser chamado?"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <label
            className="block text-sm text-slate-300"
            htmlFor="public-email"
          >
            E-mail
            <input
              id="public-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
              className={field}
              placeholder="voce@email.com"
            />
          </label>
          <label
            className="block text-sm text-slate-300"
            htmlFor="public-telefone"
          >
            Telefone com DDD
            <input
              id="public-telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={24}
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              onBlur={() => {
                if (phoneDigits(telefone)) setTelefone(formatPhone(telefone));
              }}
              disabled={saving}
              className={field}
              placeholder="(85) 99999-0000"
            />
          </label>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-slate-400">
          <input
            type="checkbox"
            required
            checked={consentimento}
            onChange={(e) => setConsentimento(e.target.checked)}
            disabled={saving}
            className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-500"
          />
          Autorizo {companyName} a usar estes dados no atendimento pela IA e no
          retorno de sua equipe.
        </label>
        <button
          disabled={saving}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300 disabled:opacity-50"
        >
          {saving ? 'Iniciando atendimento...' : 'Continuar no chat'}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-400/20 bg-red-500/5 p-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-emerald-300"
          >
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            Cadastro recebido. Seu atendimento está no chat.
          </p>
        )}
        <p className="text-center text-xs text-slate-500">
          Cadastro rápido, sem senha e sem conta de corretor.
        </p>
      </form>
    </section>
  );
}
