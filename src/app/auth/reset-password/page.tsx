'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKey, CheckCircle } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { useToast } from '@/components/ui/Toast';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { isValidPassword } from '@/lib/validation';
import { parseApiResponse } from '@/lib/api-client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<{
    newPassword?: boolean;
    confirmPassword?: boolean;
  }>({});

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<{
    message: string;
    detail?: string;
    diagnosis?: string;
  } | null>(null);

  const handleBlur = (field: 'newPassword' | 'confirmPassword') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getNewPasswordError = (): string | undefined => {
    if (!touched.newPassword) return undefined;
    if (!newPassword) return 'A nova senha é obrigatória.';
    if (newPassword.length < 8) return 'A nova senha deve ter no mínimo 8 caracteres.';
    if (!/[A-Z]/.test(newPassword)) return 'A nova senha deve conter pelo menos uma letra maiúscula (A-Z).';
    if (!/[a-z]/.test(newPassword)) return 'A nova senha deve conter pelo menos uma letra minúscula (a-z).';
    if (!/[0-9]/.test(newPassword)) return 'A nova senha deve conter pelo menos um número (0-9).';
    return undefined;
  };

  const getConfirmPasswordError = (): string | undefined => {
    if (!touched.confirmPassword) return undefined;
    if (!confirmPassword) return 'A confirmação de senha é obrigatória.';
    if (confirmPassword !== newPassword) return 'As senhas digitadas não coincidem.';
    return undefined;
  };

  const isFormFilled = isValidPassword(newPassword) && confirmPassword.length > 0;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ newPassword: true, confirmPassword: true });

    if (!isValidPassword(newPassword)) {
      toast.error('A senha deve conter no mínimo 8 dígitos, maiúscula, minúscula e número.', 'Senha Fraca');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas digitadas não coincidem.', 'Confirmação Inválida');
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');

    if (!token) {
      const msg = 'Token de recuperação ausente ou inválido.';
      setServerError({ message: msg });
      toast.error(msg, 'Token Ausente');
      return;
    }

    setStatus('loading');
    setServerError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const result = await parseApiResponse(res);
      const data = result.data;

      if (!result.ok) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[RESET PASSWORD CLIENT WARNING]', {
            status: result.status,
            statusText: result.statusText,
            data,
          });
        }
        setStatus('error');
        const errorMessage = data.error || `Falha ao redefinir senha (${result.status}: ${result.statusText || 'Erro'}).`;
        setServerError({
          message: errorMessage,
          detail: process.env.NODE_ENV !== 'production' ? data.detail : undefined,
          diagnosis: process.env.NODE_ENV !== 'production' ? data.diagnosis : undefined,
        });
        toast.error(errorMessage, 'Erro ao Redefinir Senha');
      } else {
        setStatus('success');
        toast.success('Senha atualizada com sucesso! Redirecionando...', 'Sucesso');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[RESET PASSWORD CLIENT EXCEPTION]', err);
      }
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Falha ao redefinir senha.';
      setServerError({ message });
      toast.error(message, 'Erro de Conexão');
    }
  };

  return (
    <div className="max-w-[440px] mx-auto px-6 py-16 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-sm bg-primary text-white font-bold text-xl flex items-center justify-center mx-auto">
          P
        </div>
        <h1 className="text-[24px] font-bold text-ink tracking-tight">
          Criar Nova Senha
        </h1>
        <p className="text-[14px] text-muted">
          Digite sua nova senha de acesso para atualizar sua conta.
        </p>
      </div>

      <Card variant="bordered" className="p-6">
        {status === 'success' ? (
          <div className="text-center space-y-4">
            <CheckCircle size={48} weight="fill" className="text-primary mx-auto" />
            <h2 className="text-[18px] font-bold text-ink">Senha Atualizada!</h2>
            <p className="text-[14px] text-muted">
              Sua senha foi redefinida com sucesso. Redirecionando para o painel...
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Input
                label="Nova Senha"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => handleBlur('newPassword')}
                placeholder="Mínimo 8 dígitos (letras, maiúscula e número)"
                minLength={8}
                error={getNewPasswordError()}
              />
              <PasswordStrengthMeter password={newPassword} />
            </div>

            <Input
              label="Confirmar Nova Senha"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="Repita a nova senha"
              error={getConfirmPasswordError()}
            />

            {serverError && (
              <FeedbackAlert
                variant="error"
                title="Erro na Redefinição"
                message={serverError.message}
                detail={serverError.detail}
                diagnosis={serverError.diagnosis}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full gap-2 whitespace-nowrap flex items-center justify-center"
              disabled={!isFormFilled || status === 'loading'}
              isLoading={status === 'loading'}
            >
              {status === 'loading' ? (
                <span>Salvando nova senha...</span>
              ) : (
                <>
                  <LockKey size={18} weight="bold" className="shrink-0" />
                  <span>Salvar Nova Senha</span>
                </>
              )}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
