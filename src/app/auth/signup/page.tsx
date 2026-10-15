'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, CheckCircle } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { useToast } from '@/components/ui/Toast';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { isValidEmail, isValidPassword } from '@/lib/validation';
import { parseApiResponse } from '@/lib/api-client';
import { isSantaCatarinaCity } from '@/data/santa-catarina-cities';

export default function SignUpPage() {
  const router = useRouter();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');

  const [touched, setTouched] = useState<{
    fullName?: boolean;
    email?: boolean;
    password?: boolean;
    city?: boolean;
  }>({});

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<{
    message: string;
    detail?: string;
    diagnosis?: string;
  } | null>(null);

  const getFieldError = (field: 'fullName' | 'email' | 'password' | 'city'): string | undefined => {
    if (!touched[field]) return undefined;

    switch (field) {
      case 'fullName':
        if (!fullName.trim()) return 'Informe seu nome completo.';
        if (fullName.trim().length < 2) return 'O nome deve conter pelo menos 2 caracteres.';
        return undefined;
      case 'email':
        if (!email.trim()) return 'O e-mail é obrigatório.';
        if (!isValidEmail(email)) return 'Insira um formato de e-mail válido.';
        return undefined;
      case 'password':
        if (!password) return 'A senha é obrigatória.';
        if (password.length < 8) return 'A senha deve conter no mínimo 8 caracteres.';
        if (!/[A-Z]/.test(password)) return 'A senha deve conter pelo menos uma letra maiúscula (A-Z).';
        if (!/[a-z]/.test(password)) return 'A senha deve conter pelo menos uma letra minúscula (a-z).';
        if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos um número (0-9).';
        return undefined;
      case 'city':
        if (!city.trim()) return 'Selecione sua cidade em Santa Catarina.';
        if (!isSantaCatarinaCity(city)) return 'Selecione uma cidade válida de Santa Catarina.';
        return undefined;
    }
  };

  const isFormFilled =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    isValidPassword(password) &&
    isSantaCatarinaCity(city);

  const handleBlur = (field: 'fullName' | 'email' | 'password' | 'city') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      password: true,
      city: true,
    });

    const isEmailValid = isValidEmail(email);
    const isPasswordValid = isValidPassword(password);
    const isFullNameValid = fullName.trim().length >= 2;
    const isCityValid = isSantaCatarinaCity(city);

    if (!isEmailValid || !isPasswordValid || !isFullNameValid || !isCityValid) {
      toast.error('Preencha todos os campos obrigatórios corretamente.', 'Formulário Incompleto');
      return;
    }

    setStatus('loading');
    setServerError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim(),
          city: city.trim(),
          state: 'SC',
        }),
      });

      const result = await parseApiResponse(res);
      const data = result.data;

      if (!result.ok) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[SIGNUP CLIENT WARNING]', {
            status: result.status,
            statusText: result.statusText,
            response: data,
          });
        }
        setStatus('error');
        const errorMessage = data.error || `Falha ao criar cadastro (${result.status}: ${result.statusText || 'Erro'}).`;
        setServerError({
          message: errorMessage,
          detail: process.env.NODE_ENV !== 'production' ? data.detail : undefined,
          diagnosis: process.env.NODE_ENV !== 'production' ? data.diagnosis : undefined,
        });
        toast.error(errorMessage, 'Erro no Cadastro');
      } else {
        setStatus('success');
        toast.success('Conta criada com sucesso! Redirecionando...', 'Cadastro Concluído');
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[SIGNUP CLIENT EXCEPTION]', err);
      }
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Falha ao criar cadastro.';
      setServerError({ message });
      toast.error(message, 'Falha no Cadastro');
    }
  };

  return (
    <div className="max-w-[440px] mx-auto px-6 py-12 space-y-8">
      <Link href="/auth/login" className="flex items-center gap-2 text-ink hover:text-body text-[14px] font-medium">
        <ArrowLeft size={16} weight="bold" />
        <span>Já tenho uma conta</span>
      </Link>

      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-sm bg-primary text-white font-bold text-xl flex items-center justify-center mx-auto">
          P
        </div>
        <h1 className="text-[24px] font-bold text-ink tracking-tight">
          Criar Conta no PredictMarket
        </h1>
        <p className="text-[14px] text-muted">
          Previsão de inflação pessoal e inteligência de supermercados para a sua cidade.
        </p>
      </div>

      <Card variant="bordered" className="p-6">
        {status === 'success' ? (
          <div className="text-center space-y-4">
            <CheckCircle size={48} weight="fill" className="text-primary mx-auto" />
            <h2 className="text-[18px] font-bold text-ink">Conta Criada com Sucesso</h2>
            <p className="text-[14px] text-muted">
              Redirecionando para o seu dashboard de compras...
            </p>
            <Link href="/dashboard">
              <Button variant="primary" className="w-full mt-4">
                Acessar Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignUp} noValidate className="space-y-4">
            <Input
              label="Nome Completo"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => handleBlur('fullName')}
              placeholder="Seu nome"
              error={getFieldError('fullName')}
            />

            <Input
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="seu@email.com"
              error={getFieldError('email')}
            />

            <div className="space-y-1.5">
              <Input
                label="Senha"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="Mínimo 8 dígitos (letras, maiúscula e número)"
                minLength={8}
                error={getFieldError('password')}
              />
              <PasswordStrengthMeter password={password} />
            </div>

            <CityAutocomplete
              label="Sua Cidade Base"
              required
              value={city}
              onChange={(newCity) => {
                setCity(newCity);
                if (touched.city) {
                  setTouched((prev) => ({ ...prev, city: true }));
                }
              }}
              onBlur={() => handleBlur('city')}
              placeholder="Digite ou selecione sua cidade em SC..."
              hint="Usada para filtrar supermercados da sua região"
              error={getFieldError('city')}
            />

            {serverError && (
              <FeedbackAlert
                variant="error"
                title="Erro no Cadastro"
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
                <span>Criando sua conta...</span>
              ) : (
                <>
                  <UserPlus size={18} weight="bold" className="shrink-0" />
                  <span>Cadastrar Gratuitamente</span>
                </>
              )}
            </Button>

            <p className="text-[13px] text-muted text-center pt-2">
              Ao cadastrar, você concorda com o compartilhamento anônimo de preços da sua região.
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
