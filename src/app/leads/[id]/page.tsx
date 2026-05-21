'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import LeadForm from '@/components/leads/LeadForm';
import ConfirmDialog from '@/components/leads/ConfirmDialog';
import { getLead, updateLead, deleteLead } from '@/lib/leads';
import { ETAPAS_FUNIL, type LeadInput } from '@/types/lead';

export default function LeadDetalhePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();

  const [valores, setValores] = useState<LeadInput | null>(null);
  const [etapaAtual, setEtapaAtual] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [dialogExcluir, setDialogExcluir] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    if (!id) return;
    setCarregando(true);
    getLead(id)
      .then((lead) => {
        if (!lead) {
          setNaoEncontrado(true);
          return;
        }
        setValores({
          nome: lead.nome,
          telefone: lead.telefone,
          email: lead.email,
          faixaOrcamento: lead.faixaOrcamento,
          tipoImovel: lead.tipoImovel,
        });
        setEtapaAtual(ETAPAS_FUNIL.find((e) => e.id === lead.etapa)?.label ?? lead.etapa);
      })
      .catch(() => setErro('Erro ao carregar o lead.'))
      .finally(() => setCarregando(false));
  }, [id]);

  const handleChange = (campo: keyof LeadInput, valor: string) => {
    setValores((prev) => (prev ? { ...prev, [campo]: valor } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valores || !id) return;
    setSalvando(true);
    setErro('');
    try {
      await updateLead(id, valores);
      router.push('/leads');
    } catch {
      setErro('Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!id) return;
    setExcluindo(true);
    try {
      await deleteLead(id);
      router.push('/leads');
    } catch {
      setErro('Erro ao excluir o lead.');
      setDialogExcluir(false);
    } finally {
      setExcluindo(false);
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

          {carregando ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : naoEncontrado ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <p className="text-slate-400">Lead não encontrado.</p>
              <Link href="/leads" className="text-indigo-400 mt-4 inline-block hover:underline">
                Voltar à listagem
              </Link>
            </div>
          ) : valores ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-white">Editar lead</h1>
                  <p className="text-sm text-slate-400 mt-1">
                    RF06.2 — Edição · RF06.3 — Exclusão com confirmação
                  </p>
                  {etapaAtual && (
                    <p className="text-xs text-indigo-400 mt-2">
                      Etapa no funil: <span className="font-semibold">{etapaAtual}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDialogExcluir(true)}
                  className="shrink-0 px-4 py-2 text-sm font-medium text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/10 transition"
                >
                  Excluir lead
                </button>
              </div>

              <LeadForm
                valores={valores}
                onChange={handleChange}
                onSubmit={handleSubmit}
                carregando={salvando}
                submitLabel="Salvar alterações"
                erro={erro}
              />

              <Link
                href="/funil"
                className="block text-center text-sm text-slate-500 hover:text-indigo-400 mt-6 transition"
              >
                Mover no funil (Kanban) →
              </Link>
            </div>
          ) : null}
        </main>

        <ConfirmDialog
          aberto={dialogExcluir}
          titulo="Excluir lead"
          mensagem={`Tem certeza que deseja excluir "${valores?.nome}"? Esta ação não pode ser desfeita.`}
          carregando={excluindo}
          onConfirmar={handleExcluir}
          onCancelar={() => setDialogExcluir(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
