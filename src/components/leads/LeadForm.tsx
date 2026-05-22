'use client';

import React from 'react';
import { FAIXAS_ORCAMENTO, TIPOS_IMOVEL, type LeadInput } from '@/types/lead';

export const inputClassName =
  'w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-200';

export const labelClassName =
  'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2';

interface LeadFormProps {
  valores: LeadInput;
  onChange: (campo: keyof LeadInput, valor: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  carregando?: boolean;
  submitLabel?: string;
  erro?: string;
}

export default function LeadForm({
  valores,
  onChange,
  onSubmit,
  carregando = false,
  submitLabel = 'Salvar lead',
  erro,
}: LeadFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {erro && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {erro}
        </div>
      )}

      <div>
        <label className={labelClassName}>Nome completo</label>
        <input
          type="text"
          required
          value={valores.nome}
          onChange={(e) => onChange('nome', e.target.value)}
          placeholder="Ex.: Roberto Mendes"
          className={inputClassName}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClassName}>Telefone</label>
          <input
            type="tel"
            required
            value={valores.telefone}
            onChange={(e) => onChange('telefone', e.target.value)}
            placeholder="(85) 99999-9999"
            className={inputClassName}
          />
        </div>
        <div>
          <label className={labelClassName}>E-mail</label>
          <input
            type="email"
            required
            value={valores.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="cliente@email.com"
            className={inputClassName}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClassName}>Faixa de orçamento</label>
          <select
            required
            value={valores.faixaOrcamento}
            onChange={(e) => onChange('faixaOrcamento', e.target.value)}
            className={inputClassName}
          >
            <option value="" disabled>
              Selecione a faixa
            </option>
            {FAIXAS_ORCAMENTO.map((faixa) => (
              <option key={faixa} value={faixa}>
                {faixa}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClassName}>Tipo de imóvel desejado</label>
          <select
            required
            value={valores.tipoImovel}
            onChange={(e) => onChange('tipoImovel', e.target.value)}
            className={inputClassName}
          >
            <option value="" disabled>
              Selecione o tipo
            </option>
            {TIPOS_IMOVEL.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={carregando}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {carregando ? (
          <>
            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Salvando...
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
