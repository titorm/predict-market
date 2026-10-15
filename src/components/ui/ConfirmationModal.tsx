'use client';

import React, { useEffect } from 'react';
import { Warning, X } from '@phosphor-icons/react';
import { Button } from './Button';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-md bg-canvas rounded-xl border border-hairline shadow-2xl p-6 z-10 space-y-5 transform transition-all"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-danger/10 text-danger border border-danger/20'
                  : 'bg-surface-soft text-ink border border-hairline'
              }`}
            >
              <Warning size={22} weight="bold" />
            </div>
            <div>
              <h2
                id="confirm-modal-title"
                className="text-[17px] font-bold text-ink leading-snug"
              >
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Fechar modal de confirmação"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-[13px] text-muted leading-relaxed">
            {description}
          </p>
          {variant === 'danger' ? (
            <div className="p-3 rounded-lg bg-danger/[0.06] border border-danger/25 text-[12px] text-danger font-medium flex items-center gap-2">
              <Warning size={16} weight="bold" className="text-danger shrink-0" />
              <span>Esta ação não poderá ser desfeita. Deseja prosseguir?</span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-surface-soft border border-hairline text-[12px] text-muted font-medium flex items-center gap-2">
              <Warning size={16} weight="bold" className="text-muted shrink-0" />
              <span>Deseja confirmar esta ação?</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-hairline">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg text-[13px]"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg text-[13px] gap-1.5"
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            <span>{confirmLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
