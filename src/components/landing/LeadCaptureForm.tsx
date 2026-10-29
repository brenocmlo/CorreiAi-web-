'use client';

import { useState } from 'react';
import { useAssistant } from '@/contexts/AssistantContext';
import { ArrowRight } from 'lucide-react';
import { FAIXAS_ORCAMENTO, TIPOS_IMOVEL } from '@/types/lead';

const inputClass =
  'h-10 w-full rounded-[3px] border border-white/10 bg-[var(--shop-ink)] px-3 text-sm text-[var(--shop-ink-text)] placeholder:text-white/25 transition-colors duration-150 focus:border-[var(--shop-brass)]/70 focus:outline-none';

const selectClass =
  `${inputClass} appearance-none bg-[length:14px] bg-[right_0.65rem_center] bg-no-repeat pr-9`;

const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(243,239,230,0.45)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

function formatTelefone(value: string): string {
  const digitos = value.replace(/\D/g, '').slice(0, 11);
  if (!digitos) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function LeadCaptureForm() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [faixaOrcamento, setFaixaOrcamento] = useState('');
  const [tipoImovel, setTipoImovel] = useState('');
  const {openChat}=useAssistant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch('/api/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, telefone, email, faixaOrcamento, tipoImovel }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Não foi possível enviar. Tente novamente.');
        return;
      }

      setSuccess(true);
      setTimeout(openChat, 1000);
    } catch {
      setError('Não foi possível enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-[3px] border border-[var(--shop-brass)]/25 bg-[var(--shop-panel)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] sm:p-6">
      <div className="pin-tape absolute left-1/2 -translate-x-1/2" aria-hidden />

      <div className="mb-5 space-y-1">
        <h2 className="font-display text-lg font-semibold text-[var(--shop-ink-text)]">
          Comece sua busca
        </h2>
        <p className="text-sm text-[var(--shop-text-dim)]">
          Deixe seu contato — menos de 1 minuto. A IA já cruza com o catálogo e fala com você em
          seguida.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className={inputClass}
              required
            />
          </Field>
          <Field label="Telefone">
            <input
              value={telefone}
              onChange={(e) => setTelefone(formatTelefone(e.target.value))}
              placeholder="(11) 90000-0000"
              type="tel"
              inputMode="numeric"
              maxLength={15}
              className={inputClass}
              required
            />
          </Field>
        </div>

        <Field label="E-mail">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className={inputClass}
            required
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Faixa de orçamento">
            <select
              value={faixaOrcamento}
              onChange={(e) => setFaixaOrcamento(e.target.value)}
              className={selectClass}
              style={{ backgroundImage: chevron }}
              required
            >
              <option value="" className="bg-[var(--shop-panel)]">
                Selecione
              </option>
              {FAIXAS_ORCAMENTO.map((f) => (
                <option key={f} value={f} className="bg-[var(--shop-panel)]">
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo de imóvel">
            <select
              value={tipoImovel}
              onChange={(e) => setTipoImovel(e.target.value)}
              className={selectClass}
              style={{ backgroundImage: chevron }}
              required
            >
              <option value="" className="bg-[var(--shop-panel)]">
                Selecione
              </option>
              {TIPOS_IMOVEL.map((t) => (
                <option key={t} value={t} className="bg-[var(--shop-panel)]">
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <p role="alert" className="rounded-[3px] border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="rounded-[3px] border border-[var(--shop-brass)]/30 bg-[var(--shop-brass)]/10 px-3 py-2 text-xs text-[var(--shop-brass)]">
            Cartão recebido! Levando você até a IA…
          </p>
        )}

        <button
          type="submit"
          disabled={loading || success}
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-[3px] bg-[var(--shop-brass)] py-3 text-sm font-semibold text-[#171206] transition-transform duration-100 hover:bg-[#e8cc6c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#171206]/25 border-t-[#171206]" />
              Enviando…
            </>
          ) : (
            <>
              Entrar na vitrine
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-[var(--shop-text-dim)]">{label}</span>
      {children}
    </label>
  );
}
