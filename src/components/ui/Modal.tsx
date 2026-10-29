'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

type ModalMaxWidth = 'sm' | 'md' | 'lg';

const maxWidthClasses: Record<ModalMaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: ModalMaxWidth;
}

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'sm' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white border border-slate-200 rounded-2xl p-6 shadow-xl`}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 mb-2">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
        {footer && <div className="flex gap-3 mt-6">{footer}</div>}
      </div>
    </div>
  );
}
