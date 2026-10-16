'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { List, SignOut } from '@phosphor-icons/react';
import { useAuth } from '@/context/AuthContext';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PredictMarketLogo } from '@/components/ui/PredictMarketLogo';

export interface AppHeaderProps {
  onToggleSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleSidebar }) => {
  const { isAuthenticated, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-canvas border-b border-hairline safe-top">
        <div className="w-full px-4 sm:px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Abrir menu lateral"
              className="w-11 h-11 rounded-lg border border-hairline flex items-center justify-center text-ink hover:bg-surface-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden shrink-0"
            >
              <List size={22} weight="bold" />
            </button>

            <Link href="/dashboard" className="flex items-center">
              <PredictMarketLogo size={28} showText={true} />
            </Link>
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                title="Encerrar Sessão"
                aria-label="Encerrar Sessão"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-full text-[13px] font-medium text-muted hover:text-ink hover:bg-surface-soft transition-colors"
              >
                <SignOut size={16} weight="bold" />
                <span>Sair</span>
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center min-h-[44px] px-3 text-[13px] font-medium text-muted hover:text-ink transition-colors"
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
