'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { List, SignOut } from '@phosphor-icons/react';
import { useAuth } from '@/context/AuthContext';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export interface AppHeaderProps {
  onToggleSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleSidebar }) => {
  const { isAuthenticated, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-canvas border-b border-hairline h-[56px]">
        <div className="w-full px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Abrir menu lateral"
              className="w-9 h-9 rounded-md border border-hairline flex items-center justify-center text-ink hover:bg-surface-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
            >
              <List size={20} weight="bold" />
            </button>

            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center text-white font-bold text-sm tracking-tight shrink-0">
                P
              </div>
              <span className="text-[17px] font-semibold tracking-tight text-ink">
                predictmarket
              </span>
            </Link>
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                title="Encerrar Sessão"
                aria-label="Encerrar Sessão"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-muted hover:text-ink hover:bg-surface-soft transition-colors"
              >
                <SignOut size={16} weight="bold" />
                <span>Sair</span>
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="text-[13px] font-medium text-muted hover:text-ink transition-colors"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          logout();
        }}
        title="Encerrar Sessão"
        description="Sua sessão será finalizada no navegador. Você precisará fazer login novamente para acessar seus dados, notas e previsões."
        confirmLabel="Sair da Conta"
        cancelLabel="Permanecer Conectado"
        variant="primary"
      />
    </>
  );
};
