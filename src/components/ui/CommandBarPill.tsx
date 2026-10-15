import React from 'react';
import { QrCode } from '@phosphor-icons/react';

export interface CommandBarPillProps {
  baseBasketLabel: string;
  targetMonthLabel: string;
  transitPenaltyLabel: string;
  onOpenScanner: () => void;
  onSelectBasket?: () => void;
  onSelectMonth?: () => void;
  onSelectTransit?: () => void;
}

export const CommandBarPill: React.FC<CommandBarPillProps> = ({
  baseBasketLabel,
  targetMonthLabel,
  transitPenaltyLabel,
  onOpenScanner,
  onSelectBasket,
  onSelectMonth,
  onSelectTransit,
}) => {
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    action?: () => void
  ) => {
    if ((e.key === 'Enter' || e.key === ' ') && action) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="w-full max-w-[850px] h-[64px] bg-canvas rounded-full border border-hairline shadow-airbnb flex items-center pl-6 pr-2">
      <div
        role="button"
        tabIndex={0}
        onClick={onSelectBasket}
        onKeyDown={(e) => handleKeyDown(e, onSelectBasket)}
        aria-label={`Selecionar cesta base: ${baseBasketLabel}`}
        className="flex-1 pr-4 cursor-pointer select-none rounded-full py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink transition-colors"
      >
        <span className="block text-[12px] font-bold text-ink tracking-tight">
          Cesta base
        </span>
        <span className="block text-[14px] text-muted truncate">
          {baseBasketLabel}
        </span>
      </div>

      <div className="h-8 w-[1px] bg-hairline" />

      <div
        role="button"
        tabIndex={0}
        onClick={onSelectMonth}
        onKeyDown={(e) => handleKeyDown(e, onSelectMonth)}
        aria-label={`Selecionar mês projetado: ${targetMonthLabel}`}
        className="flex-1 px-6 cursor-pointer select-none rounded-full py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink transition-colors"
      >
        <span className="block text-[12px] font-bold text-ink tracking-tight">
          Mês projetado
        </span>
        <span className="block text-[14px] text-muted truncate">
          {targetMonthLabel}
        </span>
      </div>

      <div className="hidden sm:block h-8 w-[1px] bg-hairline" />

      <div
        role="button"
        tabIndex={0}
        onClick={onSelectTransit}
        onKeyDown={(e) => handleKeyDown(e, onSelectTransit)}
        aria-label={`Configurar arbitragem de locais: ${transitPenaltyLabel}`}
        className="hidden sm:block flex-1 px-6 cursor-pointer select-none rounded-full py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink transition-colors"
      >
        <span className="block text-[12px] font-bold text-ink tracking-tight">
          Arbitragem de locais
        </span>
        <span className="block text-[14px] text-muted truncate">
          {transitPenaltyLabel}
        </span>
      </div>

      <button
        type="button"
        onClick={onOpenScanner}
        aria-label="Escanear QR Code da Nota Fiscal"
        className="w-[48px] h-[48px] rounded-full bg-primary active:bg-primary-active text-white flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        <QrCode size={22} weight="bold" />
      </button>
    </div>
  );
};
