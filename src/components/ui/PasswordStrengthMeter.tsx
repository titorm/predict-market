'use client';

import React from 'react';
import { Check, Circle, WarningCircle, ShieldCheck } from '@phosphor-icons/react';
import { calculatePasswordStrength, type PasswordStrengthLevel } from '@/lib/validation';

export interface PasswordStrengthMeterProps {
  password?: string;
  showCriteria?: boolean;
  className?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password = '',
  showCriteria = true,
  className = '',
}) => {
  if (!password) {
    return null;
  }

  const strength = calculatePasswordStrength(password);

  const getLevelColor = (level: PasswordStrengthLevel): { bar: string; text: string; bg: string } => {
    switch (level) {
      case 0:
        return { bar: 'bg-error', text: 'text-error', bg: 'bg-error/10 border-error/20' };
      case 1:
        return { bar: 'bg-amber-600', text: 'text-amber-600', bg: 'bg-amber-600/10 border-amber-600/20' };
      case 2:
        return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' };
      case 3:
        return { bar: 'bg-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-600/10 border-emerald-600/20' };
      case 4:
        return { bar: 'bg-primary', text: 'text-primary', bg: 'bg-primary/10 border-primary/20' };
    }
  };

  const levelColor = getLevelColor(strength.level);
  const activeBarsCount = Math.max(1, strength.level + 1);

  const criteria = [
    { label: 'Mínimo de 8 dígitos', met: strength.hasMinLength, required: true },
    { label: 'Letra maiúscula (A-Z)', met: strength.hasUppercase, required: true },
    { label: 'Letra minúscula (a-z)', met: strength.hasLowercase, required: true },
    { label: 'Número (0-9)', met: strength.hasNumber, required: true },
    { label: 'Caractere especial (!@#$...)', met: strength.hasSpecialChar, required: false },
  ];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`space-y-2.5 pt-1 animate-in fade-in duration-200 ${className}`}
    >
      <div className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-1.5 font-medium text-body">
          <ShieldCheck size={14} weight="bold" className={levelColor.text} />
          <span>Força da Senha:</span>
          <span className={`font-semibold ${levelColor.text}`}>{strength.label}</span>
        </div>
        <span className="text-[11px] text-muted">
          {strength.score}/100
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
        {[0, 1, 2, 3, 4].map((index) => {
          const isActive = index < activeBarsCount;
          return (
            <div
              key={index}
              className={`h-full rounded-full transition-all duration-300 ${
                isActive ? levelColor.bar : 'bg-hairline'
              }`}
            />
          );
        })}
      </div>

      {showCriteria && (
        <div className="bg-surface-soft border border-hairline/60 rounded-sm p-3 space-y-1.5">
          <span className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
            Requisitos de Segurança
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[12px]">
            {criteria.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-1.5 transition-colors ${
                  item.met ? 'text-primary font-medium' : 'text-muted'
                }`}
              >
                {item.met ? (
                  <Check size={14} weight="bold" className="text-primary shrink-0" />
                ) : (
                  <Circle size={14} weight="regular" className="text-muted-soft shrink-0" />
                )}
                <span className={item.met ? 'text-ink' : 'text-muted'}>
                  {item.label}
                  {item.required && <span className="text-error ml-0.5">*</span>}
                </span>
              </div>
            ))}
          </div>

          {strength.hasRepetitionOrSequence && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-sm px-2 py-1 mt-2">
              <WarningCircle size={14} weight="bold" className="shrink-0" />
              <span>Evite sequências previsíveis ou caracteres repetidos (ex: 123, abc, aaa).</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
