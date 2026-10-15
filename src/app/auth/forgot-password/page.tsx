'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Key, CheckCircle } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { isValidEmail } from '@/lib/validation';
import { parseApiResponse } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<{
    message: string;
    detail?: string;
    diagnosis?: string;
  } | null>(null);

  const getEmailError = (): string | undefined => {
    if (!touched) return undefined;
    if (!email.trim()) return 'O e-mail é obrigatório.';
    if (!isValidEmail(email)) return 'Insira um formato de e-mail válido.';
    return undefined;
  };

  const isFormFilled = email.trim().length > 0;

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!isValidEmail(email)) {
      toast.error('Informe um e-mail válido para recuperação.', 'E-mail Inválido');
      return;
    }

    setStatus('loading');
    setServerError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const result = await parseApiResponse(res);
      const data = result.data;

      if (!result.ok) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[FORGOT PASSWORD CLIENT WARNING]', {
            status: result.status,
            statusText: result.statusText,
            data,
          });
        }
        setStatus('error');
        const errorMessage = data.error || `Falha ao solicitar recuperação (${result.status}: ${result.statusText || 'Erro'}).`;
        setServerError({
          message: errorMessage,
          detail: process.env.NODE_ENV !== 'production' ? data.detail : undefined,
          diagnosis: process.env.NODE_ENV !== 'production' ? data.diagnosis : undefined,
        });
        toast.error(errorMessage, 'Erro na Recuperação');
      } else {
        setStatus('success');
        toast.success(`Instruções de redefinição enviadas para ${email}.`, 'E-mail Enviado');
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[FORGOT PASSWORD CLIENT EXCEPTION]', err);
      }
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Falha ao solicitar recuperação.';
      setServerError({ message });
      toast.error(message, 'Erro de Conexão');
    }
  };

  return (
    <div className="max-w-[440px] mx-auto px-6 py-16 space-y-8">
      <Link href="/auth/login" className="flex items-center gap-2 text-ink hover:text-body text-[14px] font-medium">
        <ArrowLeft size={16} weight="bold" />
        <span>Voltar para o Login</span>
      </Link>

      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-sm bg-primary text-white font-bold text-xl flex items-center justify-center mx-auto">
          P
        </div>
        <h1 className="text-[24px] font-bold text-ink tracking-tight">
          Recuperar Senha
        </h1>
        <p className="text-[14px] text-muted">
          Informe seu e-mail cadastrado para receber as instruções de redefinição de senha.
        </p>
      </div>

      <Card variant="bordered" className="p-6">
        {status === 'success' ? (
          <div className="text-center space-y-4">
            <CheckCircle size={48} weight="fill" className="text-primary mx-auto" />
            <h2 className="text-[18px] font-bold text-ink">E-mail Enviado</h2>
            <p className="text-[14px] text-muted">
              Enviamos um link de redefinição de senha para <strong className="text-ink">{email}</strong>. Verifique sua caixa de entrada.
            </p>
            <Link href="/auth/login">
              <Button variant="secondary" className="w-full mt-4">
                Voltar ao Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} noValidate className="space-y-4">
            <Input
              label="E-mail Cadastrado"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="seu@email.com"
              error={getEmailError()}
            />

            {serverError && (
              <FeedbackAlert
                variant="error"
                title="Erro na Solicitação"
                message={serverError.message}
                detail={serverError.detail}
                diagnosis={serverError.diagnosis}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full gap-2"
              disabled={!isFormFilled || status === 'loading'}
              isLoading={status === 'loading'}
            >
              <Key size={18} weight="bold" />
              <span>Enviar Link de Redefinição</span>
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
