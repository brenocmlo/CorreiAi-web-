'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import LeadForm from '@/components/leads/LeadForm';
import { createLead } from '@/lib/leads';
import type { LeadInput } from '@/types/lead';

const VALORES_INICIAIS: LeadInput = {
  nome: '',
  telefone: '',
  email: '',
  faixaOrcamento: '',
  tipoImovel: '',
};

export default function NovoLeadPage() {
  const router = useRouter();
  const [valores, setValores] = useState<LeadInput>(VALORES_INICIAIS);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (campo: keyof LeadInput, valor: string) => {
    setValores((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await createLead(valores);
      router.push('/leads');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível cadastrar o lead.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/leads"
            className="text-sm text-slate-500 hover:text-brand-primary transition mb-6 inline-block"
          >
            ← Voltar para leads
          </Link>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Novo lead</h1>
            <p className="text-sm text-slate-500 mb-6">O lead será vinculado ao seu perfil de corretor.</p>

            <LeadForm
              valores={valores}
              onChange={handleChange}
              onSubmit={handleSubmit}
              carregando={salvando}
              submitLabel="Cadastrar lead"
              erro={erro}
            />
          </div>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
