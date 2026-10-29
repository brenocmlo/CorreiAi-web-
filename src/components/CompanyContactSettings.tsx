'use client';
import { FormEvent, useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { requestJson } from '@/lib/client-request';
import { formatPhone } from '@/lib/phone';

export function CompanyContactSettings() {
  const [telefone, setTelefone] = useState(''),
    [nome, setNome] = useState('Sua imobiliária');
  const [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  useEffect(() => {
    let active = true;
    requestJson<{ imobiliaria: { nome: string; telefone: string | null } }>(
      '/api/imobiliaria',
    )
      .then(({ imobiliaria }) => {
        if (active) {
          setNome(imobiliaria.nome);
          setTelefone(
            imobiliaria.telefone ? formatPhone(imobiliaria.telefone) : '',
          );
        }
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
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await requestJson('/api/imobiliaria', {
        method: 'PATCH',
        body: JSON.stringify({ telefone: telefone.trim() || null }),
      });
      setSuccess('Contato oficial atualizado no atendimento da IA.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <section
      aria-label="Contato da imobiliária"
      className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6"
    >
      <h2 className="flex items-center gap-2 font-semibold text-white">
        <Phone aria-hidden="true" className="h-4 w-4 text-indigo-300" />
        Contato de {nome}
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        A assistente usa este número nos atendimentos da sua imobiliária. Se
        ativar a página pública, visitantes também poderão vê-lo. Use somente
        o contato comercial oficial.
      </p>
      <form
        onSubmit={save}
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <label
          className="flex-1 text-sm text-slate-300"
          htmlFor="telefone-imobiliaria"
        >
          Telefone com DDD
          <input
            id="telefone-imobiliaria"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={24}
            value={telefone}
            onChange={(e) => {
              setTelefone(e.target.value);
              setSuccess('');
            }}
            disabled={loading || saving}
            placeholder="(85) 99999-0000"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus-visible:outline-2 focus-visible:outline-indigo-400"
          />
        </label>
        <button
          disabled={loading || saving}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving
            ? 'Salvando...'
            : loading
              ? 'Carregando...'
              : 'Salvar contato'}
        </button>
      </form>
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
