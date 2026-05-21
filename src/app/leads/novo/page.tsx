'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import LeadForm from '@/components/leads/LeadForm';
import { createLead } from '@/lib/leads';
import type { LeadInput } from '@/types/lead';

const valoresIniciais: LeadInput = {
  nome: '',
  telefone: '',
  email: '',
  faixaOrcamento: '',
  tipoImovel: '',
};

export default function NovoLeadPage() {
  const router = useRouter();
  const [valores, setValores] = useState<LeadInput>(valoresIniciais);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (campo: keyof LeadInput, valor: string) => {
    setValores((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const id = await createLead(valores);
      router.push(`/leads/${id}`);
    } catch {
      setErro('Não foi possível cadastrar o lead. Verifique o Firebase Realtime Database.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/leads"
            className="text-sm text-slate-500 hover:text-indigo-400 transition mb-6 inline-block"
          >
            ← Voltar para leads
          </Link>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <h1 className="text-2xl font-extrabold text-white mb-1">Novo lead</h1>
            <p className="text-sm text-slate-400 mb-6">
              RF06 — Cadastro com nome, telefone, e-mail, orçamento e tipo de imóvel
            </p>
            <LeadForm
              valores={valores}
              onChange={handleChange}
              onSubmit={handleSubmit}
              carregando={carregando}
              submitLabel="Cadastrar lead"
              erro={erro}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
