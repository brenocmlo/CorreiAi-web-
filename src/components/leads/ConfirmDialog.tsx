'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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
  return (
    <Modal
      isOpen={aberto}
      onClose={onCancelar}
      title={titulo}
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" fullWidth disabled={carregando} onClick={onCancelar}>
            {cancelarLabel}
          </Button>
          <Button variant="danger" fullWidth isLoading={carregando} onClick={onConfirmar}>
            {confirmarLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-400">{mensagem}</p>
    </Modal>
  );
}
