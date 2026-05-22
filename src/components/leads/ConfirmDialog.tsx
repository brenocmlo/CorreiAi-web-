'use client';

import React from 'react';

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  confirmarLabel?: string;
  cancelarLabel?: string;
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  confirmarLabel = 'Excluir',
  cancelarLabel = 'Cancelar',
  carregando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancelar}
      />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white">{titulo}</h3>
        <p className="text-sm text-slate-400 mt-2">{mensagem}</p>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancelar}
            disabled={carregando}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
          >
            {cancelarLabel}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={carregando}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {carregando ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              confirmarLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
