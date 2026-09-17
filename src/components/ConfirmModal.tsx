import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} className="ml-auto">
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirmar Exclusão
          </Button>
        </>
      }
    >
      <p className="text-slate-300 text-sm">{message}</p>
    </Modal>
  );
}
