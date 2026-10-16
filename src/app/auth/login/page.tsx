'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  EnvelopeSimple,
  Key,
  CheckCircle,
  SignIn,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { PredictMarketLogo } from '@/components/ui/PredictMarketLogo';
import { useAuth } from '@/context/AuthContext';
import type { AuthUser } from '@/lib/auth/types';
import { isValidEmail, isValidPassword, isValidOtp } from '@/lib/validation';
import { parseApiResponse } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { setUser } = useAuth();

  const [tab, setTab] = useState<'password' | 'magic-link' | 'otp-code'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');

  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
    otpToken?: boolean;
  }>({});

  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [serverError, setServerError] = useState<{
    message: string;
    detail?: string;
    diagnosis?: string;
  } | null>(null);

  const handleBlur = (field: 'email' | 'password' | 'otpToken') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getEmailError = (): string | undefined => {
    if (!touched.email) return undefined;
    if (!email.trim()) return 'O e-mail é obrigatório.';
    if (!isValidEmail(email)) return 'Insira um formato de e-mail válido.';
    return undefined;
  };

  const getPasswordError = (): string | undefined => {
    if (!touched.password) return undefined;
    if (!password) return 'A senha é obrigatória.';
    if (!isValidPassword(password, 6)) return 'A senha deve conter no mínimo 6 caracteres.';
    return undefined;
  };

  const getOtpError = (): string | undefined => {
    if (!touched.otpToken) return undefined;
    if (!otpToken.trim()) return 'O código OTP é obrigatório.';
    if (!isValidOtp(otpToken)) return 'O código OTP deve ter exatamente 6 dígitos numéricos.';
    return undefined;
  };

  const isPasswordFormFilled = email.trim().length > 0 && password.length > 0;
  const isMagicLinkFormFilled = email.trim().length > 0;
  const isOtpFormFilled = email.trim().length > 0 && otpToken.trim().length === 6;

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched((prev) => ({ ...prev, email: true, password: true }));

    if (!isValidEmail(email) || !isValidPassword(password, 6)) {
      toast.error('Preencha os campos obrigatórios corretamente.', 'Dados Inválidos');
      return;
    }

    setStatus('loading');
    setServerError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const result = await parseApiResponse(res);
      const data = result.data;

      if (!result.ok) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[LOGIN CLIENT WARNING]', {
            status: result.status,
            statusText: result.statusText,
            data,
          });
        }
        setStatus('error');
        const errorMessage = data.error || `Credenciais inválidas (${result.status}: ${result.statusText || 'Erro'}).`;
        setServerError({
          message: errorMessage,
          detail: process.env.NODE_ENV !== 'production' ? data.detail : undefined,
          diagnosis: process.env.NODE_ENV !== 'production' ? data.diagnosis : undefined,
        });
        toast.error(errorMessage, 'Falha no Login');
      } else {
        if (data.user && typeof data.user === 'object') {
          setUser(data.user as AuthUser);
        }
        toast.success('Login realizado com sucesso! Redirecionando...', 'Bem-vindo');
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[LOGIN CLIENT EXCEPTION]', err);
      }
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Falha ao autenticar.';
      setServerError({ message: msg });
      toast.error(msg, 'Erro de Conexão');
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched((prev) => ({ ...prev, email: true }));

    if (!isValidEmail(email)) {
      toast.error('Informe um e-mail válido para receber o link.', 'E-mail Inválido');
      return;
    }

    setStatus('loading');
    setServerError(null);

    try {
      const res = await fetch('/api/auth/magic-link/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const result = await parseApiResponse(res);
      const data = result.data;

      if (!result.ok) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[MAGIC LINK CLIENT WARNING]', {
            status: result.status,
            statusText: result.statusText,
            data,
          });
        }
        setStatus('error');
        const msg = data.error || `Falha ao enviar link (${result.status}: ${result.statusText || 'Erro'}).`;
        setServerError({ message: msg, detail: data.detail });
        toast.error(msg, 'Erro ao Enviar Link');
      } else {
        setStatus('sent');
        toast.success(`Enviamos o link de acesso para ${email}.`, 'Link Mágico Enviado');
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[MAGIC LINK CLIENT EXCEPTION]', err);
      }
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Falha ao enviar link.';
      setServerError({ message: msg });
      toast.error(msg, 'Erro de Conexão');
    }
  };

  const handleSendOtp = async () => {
    setTouched((prev) => ({ ...prev, email: true }));

    if (!isValidEmail(email)) {
      toast.error('Digite um e-mail válido antes de solicitar o código.', 'E-mail Obrigatório');
      return;
    }

    setStatus('loading');
    setServerError(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const result = await parseApiResponse(res);
      const data = result.data;

      if (!result.ok) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[OTP SEND CLIENT WARNING]', {
            status: result.status,
            statusText: result.statusText,
            data,
          });
        }
        setStatus('error');
        const msg = data.error || `Erro ao enviar código (${result.status}: ${result.statusText || 'Erro'}).`;
        setServerError({ message: msg, detail: data.detail });
        toast.error(msg, 'Falha no Envio');
      } else {
        setStatus('idle');
        toast.success('Código de 6 dígitos enviado para seu e-mail.', 'Código Enviado');
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[OTP SEND CLIENT EXCEPTION]', err);
      }
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Erro ao enviar código.';
      setServerError({ message: msg });
      toast.error(msg, 'Erro de Conexão');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched((prev) => ({ ...prev, email: true, otpToken: true }));

    if (!isValidEmail(email) || !isValidOtp(otpToken)) {
      toast.error('Informe um e-mail válido e o código de 6 dígitos.', 'Dados Inválidos');
      return;
    }

    setStatus('loading');
    setServerError(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otpToken.trim() }),
      });

      const result = await parseApiResponse(res);
      const data = result.data;

      if (!result.ok) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[OTP VERIFY CLIENT WARNING]', {
            status: result.status,
            statusText: result.statusText,
            data,
          });
        }
        setStatus('error');
        const errorMessage = data.error || `Código OTP inválido (${result.status}: ${result.statusText || 'Erro'}).`;
        setServerError({
          message: errorMessage,
          detail: process.env.NODE_ENV !== 'production' ? data.detail : undefined,
          diagnosis: process.env.NODE_ENV !== 'production' ? data.diagnosis : undefined,
        });
        toast.error(errorMessage, 'Código Inválido');
      } else {
        if (data.user && typeof data.user === 'object') {
          setUser(data.user as AuthUser);
        }
        toast.success('Autenticação confirmada! Redirecionando...', 'Sucesso');
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[OTP VERIFY CLIENT EXCEPTION]', err);
      }
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Código OTP inválido.';
      setServerError({ message: msg });
      toast.error(msg, 'Erro de Conexão');
    }
  };

  return (
    <div className="max-w-[440px] mx-auto px-6 py-12 space-y-8">
      <Link href="/" className="flex items-center gap-2 text-ink hover:text-body text-[14px] font-medium">
        <ArrowLeft size={16} weight="bold" />
        <span>Início</span>
      </Link>

      <div className="text-center space-y-2.5">
        <div className="flex justify-center pb-1">
          <PredictMarketLogo size={36} showText={true} />
        </div>
        <h1 className="text-[24px] font-bold text-ink tracking-tight">
          Acesse Sua Conta
        </h1>
        <p className="text-[14px] text-muted">
          Consulte suas notas fiscais e descubra onde sua lista de compras sai mais barata.
        </p>
      </div>

      <div className="flex border-b border-hairline bg-surface-soft p-1 rounded-sm gap-1">
        <button
          type="button"
          onClick={() => {
            setTab('password');
            setStatus('idle');
            setServerError(null);
          }}
          className={`flex-1 py-2 text-[13px] font-semibold rounded-sm transition-colors ${
            tab === 'password' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          E-mail e Senha
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('magic-link');
            setStatus('idle');
            setServerError(null);
          }}
          className={`flex-1 py-2 text-[13px] font-semibold rounded-sm transition-colors ${
            tab === 'magic-link' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          Magic Link
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('otp-code');
            setStatus('idle');
            setServerError(null);
          }}
          className={`flex-1 py-2 text-[13px] font-semibold rounded-sm transition-colors ${
            tab === 'otp-code' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          Código OTP
        </button>
      </div>

      <Card variant="bordered" className="p-6">
        {status === 'sent' && tab === 'magic-link' ? (
          <div className="text-center space-y-4">
            <CheckCircle size={48} weight="fill" className="text-primary mx-auto" />
            <h2 className="text-[18px] font-bold text-ink">Link Enviado</h2>
            <p className="text-[14px] text-muted">
              Enviamos um link de login para <strong className="text-ink">{email}</strong>. Abra seu e-mail e clique no link para entrar.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setTab('otp-code');
                setStatus('idle');
              }}
              className="w-full"
            >
              Prefiro digitar o código de 6 dígitos
            </Button>
          </div>
        ) : tab === 'password' ? (
          <form onSubmit={handlePasswordLogin} noValidate className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="seu@email.com"
              error={getEmailError()}
            />

            <div className="space-y-1">
              <Input
                label="Senha"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="Sua senha"
                error={getPasswordError()}
              />
              <div className="text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-[12px] text-muted hover:text-ink underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>

            {serverError && (
              <FeedbackAlert
                variant="error"
                title="Erro de Autenticação"
                message={serverError.message}
                detail={serverError.detail}
                diagnosis={serverError.diagnosis}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full gap-2"
              disabled={!isPasswordFormFilled || status === 'loading'}
              isLoading={status === 'loading'}
            >
              <SignIn size={18} weight="bold" />
              <span>Entrar com Senha</span>
            </Button>
          </form>
        ) : tab === 'magic-link' ? (
          <form onSubmit={handleMagicLink} noValidate className="space-y-4">
            <Input
              label="Seu e-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="exemplo@email.com"
              error={getEmailError()}
            />

            {serverError && (
              <FeedbackAlert
                variant="error"
                title="Erro no Magic Link"
                message={serverError.message}
                detail={serverError.detail}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full gap-2"
              disabled={!isMagicLinkFormFilled || status === 'loading'}
              isLoading={status === 'loading'}
            >
              <EnvelopeSimple size={18} weight="bold" />
              <span>Receber Magic Link</span>
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="seu@email.com"
              error={getEmailError()}
            />

            <Input
              label="Código de Confirmação (6 dígitos)"
              type="text"
              required
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value)}
              onBlur={() => handleBlur('otpToken')}
              placeholder="123456"
              maxLength={6}
              error={getOtpError()}
            />

            {serverError && (
              <FeedbackAlert
                variant="error"
                title="Erro no Código OTP"
                message={serverError.message}
                detail={serverError.detail}
                diagnosis={serverError.diagnosis}
              />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSendOtp}
                className="w-full text-[13px]"
                disabled={!isMagicLinkFormFilled || status === 'loading'}
                isLoading={status === 'loading'}
              >
                <span>Enviar Código por E-mail</span>
              </Button>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full gap-2"
              disabled={!isOtpFormFilled || status === 'loading'}
              isLoading={status === 'loading'}
            >
              <Key size={18} weight="bold" />
              <span>Verificar Código OTP</span>
            </Button>
          </form>
        )}

        <div className="pt-4 mt-4 border-t border-hairline text-center text-[13px] text-muted">
          Não tem uma conta?{' '}
          <Link href="/auth/signup" className="text-ink font-semibold underline">
            Cadastre-se grátis
          </Link>
        </div>
      </Card>
    </div>
  );
}
