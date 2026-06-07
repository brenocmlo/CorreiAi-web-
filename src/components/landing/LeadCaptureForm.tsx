'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import {
  ETAPAS_FUNIL,
  FAIXAS_ORCAMENTO,
  TIPOS_IMOVEL,
  type EtapaFunil,
} from '@/types/lead';

const inputClass =
  'h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-[#3054ff]/50 focus:outline-none focus:ring-1 focus:ring-[#3054ff]/40';

const selectClass =
  `${inputClass} appearance-none bg-[length:14px] bg-[right_0.65rem_center] bg-no-repeat pr-9`;

const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.5)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

export function LeadCaptureForm() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [faixaOrcamento, setFaixaOrcamento] = useState('');
  const [tipoImovel, setTipoImovel] = useState('');
  const [etapa, setEtapa] = useState<EtapaFunil>('novo');
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
        body: JSON.stringify({
          nome,
          telefone,
          email,
          faixaOrcamento,
          tipoImovel,
          etapa,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Não foi possível enviar. Tente novamente.');
        return;
      }

      setSuccess(true);
      setNome('');
      setTelefone('');
      setEmail('');
      setFaixaOrcamento('');
      setTipoImovel('');
      setEtapa('novo');
    } catch {
      setError('Não foi possível enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="w-full rounded-2xl border border-white/10 bg-black/50 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-6"
    >
      <div className="mb-5 space-y-1">
        <h2 className="font-[family-name:var(--font-instrument-sans)] text-lg font-semibold text-white">
          Comece sua busca
        </h2>
        <p className="text-sm text-white/50">
          Preencha em menos de 1 minuto — sem criar senha.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 font-[family-name:var(--font-instrument-sans)]"
      >
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
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 90000-0000"
              type="tel"
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
              <option value="" className="bg-[#1a1a1a]">
                Selecione
              </option>
              {FAIXAS_ORCAMENTO.map((f) => (
                <option key={f} value={f} className="bg-[#1a1a1a]">
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
              <option value="" className="bg-[#1a1a1a]">
                Selecione
              </option>
              {TIPOS_IMOVEL.map((t) => (
                <option key={t} value={t} className="bg-[#1a1a1a]">
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Etapa">
          <select
            value={etapa}
            onChange={(e) => setEtapa(e.target.value as EtapaFunil)}
            className={selectClass}
            style={{ backgroundImage: chevron }}
          >
            {ETAPAS_FUNIL.map((item) => (
              <option key={item.id} value={item.id} className="bg-[#1a1a1a]">
                {item.label}
              </option>
            ))}
          </select>
        </Field>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            Cadastro recebido! Em breve entraremos em contato.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-[#0a0400] transition hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-[#3054ff]" />
              Enviando…
            </>
          ) : (
            <>
              Encontrar meu imóvel
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3054ff] text-white transition-colors group-hover:bg-[#2040e0]">
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </span>
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-white/70">{label}</span>
      {children}
    </label>
  );
}
