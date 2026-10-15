'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Tag,
  Receipt,
  QrCode,
  SquaresFour,
  ShoppingCart,
  User,
  CaretRight,
} from '@phosphor-icons/react';
import { useAuth } from '@/context/AuthContext';

export interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; weight?: 'bold' | 'regular' | 'fill'; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard Geral',
    href: '/dashboard',
    icon: SquaresFour,
  },
  {
    label: 'Previsão de Gastos',
    href: '/forecast',
    icon: ShoppingCart,
  },
  {
    label: 'Produtos Comprados',
    href: '/products',
    icon: Tag,
  },
  {
    label: 'Minhas Notas Fiscais',
    href: '/receipts',
    icon: Receipt,
  },
];

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && window.innerWidth < 768) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isSettingsActive = pathname === '/settings' || pathname.startsWith('/settings/');

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 top-[56px] bg-ink/30 backdrop-blur-xs z-30 md:hidden transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Menu Lateral de Navegação"
        className={`fixed top-[56px] bottom-0 left-0 w-64 bg-canvas border-r border-hairline flex flex-col z-30 transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : item.href === '/forecast'
                ? pathname === '/forecast' || pathname.startsWith('/baskets')
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => window.innerWidth < 768 && onClose()}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors ${
                  isActive
                    ? 'bg-surface-soft text-ink font-semibold'
                    : 'text-muted hover:text-ink hover:bg-surface-soft/60 font-medium'
                }`}
              >
                <Icon
                  size={18}
                  weight={isActive ? 'bold' : 'regular'}
                  className={isActive ? 'text-primary' : 'text-muted'}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-hairline space-y-3 shrink-0 bg-canvas">
          <Link
            href="/scanner"
            onClick={() => window.innerWidth < 768 && onClose()}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors"
          >
            <QrCode size={18} weight="bold" />
            <span>Escanear Nova Nota</span>
          </Link>

          <Link
            href="/settings"
            onClick={() => window.innerWidth < 768 && onClose()}
            className={`flex items-center justify-between gap-2.5 p-2 rounded-lg text-[12px] transition-colors ${
              isSettingsActive
                ? 'bg-surface-soft text-ink border border-hairline font-semibold'
                : 'text-muted hover:text-ink hover:bg-surface-soft/60 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-surface-soft text-ink flex items-center justify-center shrink-0 border border-hairline font-bold text-[11px]">
                {user?.full_name ? user.full_name[0]?.toUpperCase() : <User size={14} weight="bold" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink truncate leading-tight">
                  {user?.full_name || user?.email || 'Minha Conta'}
                </p>
                <p className="text-[11px] text-muted truncate mt-0.5">
                  {user?.city ? `${user.city}, ${user.state || 'SC'}` : 'Configurações do perfil'}
                </p>
              </div>
            </div>
            <CaretRight size={14} weight="bold" className="text-muted shrink-0" />
          </Link>
        </div>
      </aside>
    </>
  );
};
