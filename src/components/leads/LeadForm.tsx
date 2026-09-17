'use client';

import React from 'react';
import { FAIXAS_ORCAMENTO, TIPOS_IMOVEL, type LeadInput } from '@/types/lead';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
          {erro}
        </div>
      )}

      <Field label="Nome completo">
        <Input
          type="text"
          required
          value={valores.nome}
          onChange={(e) => onChange('nome', e.target.value)}
          placeholder="Ex.: Roberto Mendes"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Telefone">
          <Input
            type="tel"
            required
            value={valores.telefone}
            onChange={(e) => onChange('telefone', e.target.value)}
            placeholder="(85) 99999-9999"
          />
        </Field>
        <Field label="E-mail">
          <Input
            type="email"
            required
            value={valores.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="cliente@email.com"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Faixa de orçamento">
          <Select
            required
            value={valores.faixaOrcamento}
            onChange={(e) => onChange('faixaOrcamento', e.target.value)}
          >
            <option value="" disabled>
              Selecione a faixa
            </option>
            {FAIXAS_ORCAMENTO.map((faixa) => (
              <option key={faixa} value={faixa}>
                {faixa}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tipo de imóvel desejado">
          <Select
            required
            value={valores.tipoImovel}
            onChange={(e) => onChange('tipoImovel', e.target.value)}
          >
            <option value="" disabled>
              Selecione o tipo
            </option>
            {TIPOS_IMOVEL.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Button type="submit" fullWidth size="lg" isLoading={carregando}>
        {carregando ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  );
}
