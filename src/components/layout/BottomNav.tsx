'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SquaresFour, ShoppingCart, QrCode, Receipt, Tag } from '@phosphor-icons/react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  if (pathname.startsWith('/auth') || pathname === '/') {
    return null;
  }

  const navItems = [
    {
      label: 'Início',
      href: '/dashboard',
      icon: SquaresFour,
      active: pathname === '/dashboard',
    },
    {
      label: 'Previsão',
      href: '/forecast',
      icon: ShoppingCart,
      active: pathname === '/forecast' || pathname.startsWith('/baskets'),
    },
    {
      label: 'Escanear',
      href: '/scanner',
      icon: QrCode,
      active: pathname === '/scanner',
      highlight: true,
    },
    {
      label: 'Notas',
      href: '/receipts',
      icon: Receipt,
      active: pathname.startsWith('/receipts'),
    },
    {
      label: 'Produtos',
      href: '/products',
      icon: Tag,
      active: pathname.startsWith('/products'),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-canvas/95 backdrop-blur-md border-t border-hairline px-2 py-1 safe-bottom shadow-lg select-none">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 min-w-[54px] min-h-[54px] touch-target"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-airbnb active:bg-primary-active transition-all active:scale-95">
                  <Icon size={24} weight="bold" />
                </div>
                <span className="text-[11px] font-semibold text-primary mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-2 min-h-[48px] min-w-[48px] touch-target rounded-lg transition-colors active:bg-surface-soft ${
                item.active ? 'text-ink font-semibold' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon size={22} weight={item.active ? 'bold' : 'regular'} className={item.active ? 'text-primary' : 'text-muted'} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
