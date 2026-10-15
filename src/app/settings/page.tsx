'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Sparkle,
  ShieldCheck,
  GasPump,
  FloppyDisk,
  QrCode,
  Trash,
  Warning,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useToast } from '@/components/ui/Toast';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { isSantaCatarinaCity } from '@/data/santa-catarina-cities';

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();

  const [transitPenalty, setTransitPenalty] = useState('35.00');
  const [maxRadiusKm, setMaxRadiusKm] = useState('15');
  const [city, setCity] = useState('Florianópolis');
  const [state, setState] = useState('SC');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [receiptsCount, setReceiptsCount] = useState(0);
  const [tier, setTier] = useState('FREE');

  const [touched, setTouched] = useState<{
    fullName?: boolean;
    city?: boolean;
    state?: boolean;
  }>({});

  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
          router.push('/auth/login');
          return;
        }

        const data = (await res.json()) as {
          profile?: {
            full_name?: string;
            city?: string;
            state?: string;
            max_distance_km?: number | string;
            email?: string;
          };
        };

        if (data.profile && isMounted) {
          queueMicrotask(() => {
            setFullName(data.profile?.full_name ?? '');
            setCity(data.profile?.city ?? 'Florianópolis');
            setState(data.profile?.state ?? 'SC');
            setMaxRadiusKm(data.profile?.max_distance_km?.toString() ?? '15');
            setTransitPenalty('35.00');
            setReceiptsCount(3);
            setTier('PRO');
          });
        }
      } catch (err: unknown) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[SETTINGS PROFILE LOAD WARNING]', err);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleBlur = (field: 'fullName' | 'city' | 'state') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getFullNameError = (): string | undefined => {
    if (!touched.fullName) return undefined;
    if (!fullName.trim()) return 'O nome completo é obrigatório.';
    if (fullName.trim().length < 2) return 'O nome deve ter no mínimo 2 caracteres.';
    return undefined;
  };

  const getCityError = (): string | undefined => {
    if (!touched.city) return undefined;
    if (!city.trim()) return 'A cidade base é obrigatória.';
    if (!isSantaCatarinaCity(city)) return 'Selecione uma cidade válida de Santa Catarina.';
    return undefined;
  };

  const getStateError = (): string | undefined => {
    if (!touched.state) return undefined;
    if (!state.trim()) return 'A UF é obrigatória.';
    if (state.trim().length !== 2) return 'A UF deve ter exatamente 2 letras (ex: SC).';
    return undefined;
  };

  const isFormFilled =
    fullName.trim().length > 0 &&
    isSantaCatarinaCity(city) &&
    state.trim().length === 2;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ fullName: true, city: true, state: true });

    if (!isFormFilled) {
      toast.error('Preencha os campos obrigatórios corretamente.', 'Formulário Incompleto');
      return;
    }

    setIsSaving(true);
    setServerError(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          max_distance_km: parseFloat(maxRadiusKm) || 15.0,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        detail?: string;
      };

      if (res.ok) {
        toast.success('Configurações atualizadas com sucesso!', 'Salvo');
      } else {
        const msg = data.error || 'Falha ao salvar configurações.';
        setServerError({ message: msg, detail: data.detail });
        toast.error(msg, 'Erro ao Salvar');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar configurações.';
      setServerError({ message: msg });
      toast.error(msg, 'Erro de Conexão');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
      });

      if (res.ok) {
        toast.warning('Sua conta foi excluída com sucesso.', 'Conta Removida');
        router.push('/');
      } else {
        toast.error('Falha ao excluir conta. Tente novamente.', 'Erro');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir conta.';
      toast.error(msg, 'Erro');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <PageHeader
        title="Configurações"
        description="Gerencie seu perfil, sua cidade e os parâmetros de arbitragem de compras."
        actions={
          <Link
            href="/scanner"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors"
          >
            <QrCode size={16} weight="bold" />
            <span>Escanear Nova Nota</span>
          </Link>
        }
      />

      <Card variant="bordered" className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div>
            <span className="text-[12px] font-bold uppercase text-muted block">Status do Plano</span>
            <h2 className="text-[18px] font-bold text-ink">
              {tier === 'FREE' ? 'Plano Gratuito' : 'Give-to-Get Pro Ativo'}
            </h2>
          </div>
          <Badge variant="optimistic" className="py-1 px-3 gap-1">
            <Sparkle size={14} weight="bold" />
            <span>{receiptsCount * 7} Dias Pro Acumulados</span>
          </Badge>
        </div>

        <p className="text-[14px] text-body leading-relaxed">
          Cada nota fiscal inédita escaneada na sua cidade adiciona automaticamente +7 dias de acesso Pro a todos os 3 cenários e alertas de reduflação.
        </p>

        <div className="pt-2 flex items-center gap-4 text-[13px] text-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} weight="bold" className="text-primary" />
            <span>{receiptsCount} notas fiscais contribuídas</span>
          </div>
          {email && (
            <>
              <span>·</span>
              <span className="truncate">{email}</span>
            </>
          )}
        </div>
      </Card>

      <form onSubmit={handleSave} noValidate className="space-y-6">
        <Card variant="bordered" className="p-6 space-y-5">
          <h2 className="text-[18px] font-bold text-ink">Dados Pessoais</h2>
          <Input
            label="Nome Completo"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => handleBlur('fullName')}
            placeholder="Seu nome"
            error={getFullNameError()}
          />
        </Card>

        <Card variant="bordered" className="p-6 space-y-5">
          <h2 className="text-[18px] font-bold text-ink flex items-center gap-2">
            <GasPump size={20} weight="bold" />
            <span>Parâmetros de Deslocamento e Arbitragem</span>
          </h2>

          <Input
            label="Custo Estimado por Viagem Extra (R$)"
            showOptionalBadge
            value={transitPenalty}
            onChange={(e) => setTransitPenalty(e.target.value)}
            placeholder="Ex: 35.00"
            hint="Valor do combustível e tempo para ir em um segundo mercado"
          />

          <Input
            label="Raio Máximo de Deslocamento (km)"
            showOptionalBadge
            value={maxRadiusKm}
            onChange={(e) => setMaxRadiusKm(e.target.value)}
            placeholder="Ex: 15"
            hint="Supermercados além desta distância serão excluídos das recomendações"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <CityAutocomplete
                label="Cidade Base"
                required
                value={city}
                onChange={(newCity) => {
                  setCity(newCity);
                  setState('SC');
                  if (touched.city) {
                    setTouched((prev) => ({ ...prev, city: true }));
                  }
                }}
                onBlur={() => handleBlur('city')}
                placeholder="Selecione sua cidade em SC..."
                error={getCityError()}
              />
            </div>
            <Input
              label="Estado (UF)"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              onBlur={() => handleBlur('state')}
              placeholder="SC"
              maxLength={2}
              error={getStateError()}
            />
          </div>
        </Card>

        {serverError && (
          <FeedbackAlert
            variant="error"
            title="Erro nas Configurações"
            message={serverError.message}
            detail={serverError.detail}
          />
        )}

        <div className="flex items-center justify-between">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="gap-2"
            disabled={!isFormFilled || isSaving}
            isLoading={isSaving}
          >
            <FloppyDisk size={18} weight="bold" />
            <span>Salvar Alterações</span>
          </Button>
        </div>
      </form>

      <Card variant="bordered" className="p-6 border-error/30 bg-surface-soft space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-error flex items-center gap-2">
            <Warning size={18} weight="bold" />
            <span>Zona de Perigo</span>
          </h2>
          <p className="text-[13px] text-muted mt-1">
            Ao excluir sua conta, todas as suas notas fiscais, cestas base e histórico serão removidos permanentemente.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsDeleteModalOpen(true)}
          className="border-danger/40 text-danger hover:bg-danger hover:text-white rounded-lg transition-colors"
        >
          <Trash size={16} weight="bold" className="mr-1.5" />
          <span>Excluir Minha Conta</span>
        </Button>
      </Card>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Excluir Minha Conta"
        description="Esta ação removerá permanentemente todos os seus dados, notas fiscais e cestas. Esta ação não poderá ser desfeita. Deseja confirmar?"
        confirmLabel="Sim, Excluir Minha Conta"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
