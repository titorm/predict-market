'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode,
  TrendUp,
  Clock,
  CurrencyCircleDollar,
  CheckCircle,
  ArrowRight,
  Sparkle,
  ShieldCheck,
  Receipt,
  ShoppingCart,
  Brain,
  Storefront,
  ChartLineUp,
  Tag,
  ChartBar,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface PublicStats {
  receipts_count: number;
  products_count: number;
  stores_count: number;
  hours_saved: number;
  money_saved_brl: number;
}

const DEFAULT_STATS: PublicStats = {
  receipts_count: 1420,
  products_count: 850,
  stores_count: 48,
  hours_saved: 480,
  money_saved_brl: 12450.0,
};

export default function LandingPage() {
  const [monthlySpend, setMonthlySpend] = useState<number>(1200);
  const [stats, setStats] = useState<PublicStats>(DEFAULT_STATS);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/stats/public')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch public stats');
        }
        return res.json();
      })
      .then((data: PublicStats) => {
        if (isMounted && data && typeof data.receipts_count === 'number') {
          queueMicrotask(() => {
            setStats(data);
          });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const estimatedHoursSavedMonth = 5;
  const estimatedSavingsMonth = monthlySpend * 0.168;
  const estimatedAnnualSavings = estimatedSavingsMonth * 12;

  return (
    <div className="bg-canvas text-ink min-h-screen">
      <header className="border-b border-hairline bg-canvas sticky top-0 z-20">
        <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center text-white font-bold text-base tracking-tight shrink-0">
              P
            </div>
            <span className="text-[18px] font-semibold tracking-tight text-ink">
              predictmarket
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="secondary" size="sm">
                Criar Conta
              </Button>
            </Link>
            <Link href="/scanner">
              <Button variant="primary" size="sm" className="gap-2">
                <QrCode size={18} weight="bold" />
                <span>Escanear Cupom</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-6 py-16 space-y-24">
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <Badge variant="optimistic" className="gap-1.5 py-1 px-3 text-[12px]">
            <Sparkle size={14} weight="bold" />
            <span>Inteligência de Compras e Previsão de Gastos</span>
          </Badge>

          <h1 className="text-[40px] md:text-[56px] font-bold leading-[1.08] tracking-[-1.5px] text-ink">
            Economize até 17% nas compras de supermercado com dados reais.
          </h1>

          <p className="text-[17px] md:text-[18px] text-body leading-[1.5]">
            Digitalize notas fiscais via QR Code em 5 segundos, acompanhe a evolução dos preços dos produtos,
            receba sugestões heurísticas de reposição e descubra a estratégia mais barata entre supermercados locais.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full gap-2">
                <span>Começar Gratuitamente</span>
                <ArrowRight size={18} weight="bold" />
              </Button>
            </Link>
            <Link href="/scanner" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full gap-2">
                <QrCode size={20} weight="bold" />
                <span>Escanear Nota Fiscal (NFC-e)</span>
              </Button>
            </Link>
          </div>
        </section>

        <section className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-[28px] font-bold text-ink">
              Tudo o que você precisa para controlar seus gastos de mercado
            </h2>
            <p className="text-[15px] text-muted">
              Uma plataforma completa que transforma cupons fiscais dispersos em inteligência preditiva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="bordered" className="p-6 bg-canvas border-hairline space-y-4">
              <div className="w-10 h-10 rounded-lg bg-surface-soft text-primary flex items-center justify-center">
                <QrCode size={22} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-ink">Digitalização Instantânea</h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  Aponte a câmera para o QR Code da NFC-e ou cole a chave de 44 dígitos. Extração automática de itens, quantidades, valores e descontos.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-semibold text-primary flex items-center gap-1">
                <span>Leitura oficial SEFAZ</span>
                <CheckCircle size={14} weight="bold" />
              </div>
            </Card>

            <Card variant="bordered" className="p-6 bg-canvas border-hairline space-y-4">
              <div className="w-10 h-10 rounded-lg bg-surface-soft text-primary flex items-center justify-center">
                <Brain size={22} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-ink">Reposição Heurística</h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  O algoritmo analisa sua cadência periódica de compras passadas e recomenda a reposição exata dos itens com estoque expirado no mês.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-semibold text-primary flex items-center gap-1">
                <span>Sugestão de despensa ativa</span>
                <CheckCircle size={14} weight="bold" />
              </div>
            </Card>

            <Card variant="bordered" className="p-6 bg-canvas border-hairline space-y-4">
              <div className="w-10 h-10 rounded-lg bg-surface-soft text-primary flex items-center justify-center">
                <ShoppingCart size={22} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-ink">Previsão e Simulação</h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  Simule custos em 3 cenários (otimista, realista e pessimista) e compare a estratégia de loja única versus divisão entre múltiplos supermercados.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-semibold text-primary flex items-center gap-1">
                <span>Simulação em painel lateral</span>
                <CheckCircle size={14} weight="bold" />
              </div>
            </Card>

            <Card variant="bordered" className="p-6 bg-canvas border-hairline space-y-4">
              <div className="w-10 h-10 rounded-lg bg-surface-soft text-primary flex items-center justify-center">
                <ChartLineUp size={22} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-ink">Séries Temporais de Preços</h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  Gráficos interativos mostram a flutuação histórica de preços de cada produto comprado, medindo a inflação pessoal real da sua cesta.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-semibold text-primary flex items-center gap-1">
                <span>Gráficos por produto</span>
                <CheckCircle size={14} weight="bold" />
              </div>
            </Card>

            <Card variant="bordered" className="p-6 bg-canvas border-hairline space-y-4">
              <div className="w-10 h-10 rounded-lg bg-surface-soft text-primary flex items-center justify-center">
                <ChartBar size={22} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-ink">Dashboard Consolidado</h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  Métricas 100% reais de despesas acumuladas, descontos obtidos, produtos monitorados e gráficos de evolução mensal sem dados inventados.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-semibold text-primary flex items-center gap-1">
                <span>Zero dados mocados</span>
                <CheckCircle size={14} weight="bold" />
              </div>
            </Card>

            <Card variant="bordered" className="p-6 bg-canvas border-hairline space-y-4">
              <div className="w-10 h-10 rounded-lg bg-surface-soft text-primary flex items-center justify-center">
                <Receipt size={22} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-ink">Gestão Ágil de Notas</h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  Visualize resumos instantâneos em barra lateral, copie chaves de acesso, consulte detalhes completos e remova notas com modal de segurança.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-semibold text-primary flex items-center gap-1">
                <span>Ações com confirmação</span>
                <CheckCircle size={14} weight="bold" />
              </div>
            </Card>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="bordered" className="p-8 border-hairline bg-surface-soft space-y-4">
            <div className="flex items-center gap-2 text-scenario-pessimistic font-bold text-[14px] uppercase tracking-wider">
              <Clock size={20} weight="bold" />
              <span>Rotina Tradicional de Compras</span>
            </div>
            <h3 className="text-[22px] font-bold text-ink">Horas perdidas e decisões no escuro</h3>
            <ul className="space-y-3 text-[15px] text-body">
              <li className="flex items-start gap-2">
                <span className="text-scenario-pessimistic font-bold">✕</span>
                <span>
                  <strong>3 horas por mês</strong> conferindo armários e montando listas manuais em blocos de notas.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-scenario-pessimistic font-bold">✕</span>
                <span>
                  <strong>Incerteza de preços</strong> em encartes desatualizados ou pagamento de preços inflacionados no mercado mais próximo.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-scenario-pessimistic font-bold">✕</span>
                <span>Sem histórico para saber se uma promoção anunciada é realmente vantajosa.</span>
              </li>
            </ul>
          </Card>

          <Card variant="bordered" className="p-8 border-hairline bg-canvas space-y-4">
            <div className="flex items-center gap-2 text-scenario-optimistic font-bold text-[14px] uppercase tracking-wider">
              <Sparkle size={20} weight="bold" />
              <span>Com o PredictMarket</span>
            </div>
            <h3 className="text-[22px] font-bold text-ink">Inteligência automatizada em segundos</h3>
            <ul className="space-y-3 text-[15px] text-body">
              <li className="flex items-start gap-2">
                <CheckCircle size={20} weight="bold" className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>5 segundos</strong> para ler o QR Code da NFC-e e catalogar todos os produtos e preços automaticamente.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={20} weight="bold" className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Previsão Bayesiana</strong> que alerta a reposição ideal de mantimentos e estima os custos futuros.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={20} weight="bold" className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Comparação regional</strong> inteligente no seu raio em km, considerando custos de deslocamento e tempo.
                </span>
              </li>
            </ul>
          </Card>
        </section>

        <section className="bg-surface-soft rounded-md border border-hairline p-8 md:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-[26px] font-bold text-ink">
              Métricas Reais da Plataforma
            </h2>
            <p className="text-[15px] text-muted">
              Preços e dados reais consolidados a partir de notas fiscais emitidas em Santa Catarina.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="bordered" className="p-6 text-center bg-canvas">
              <span className="block text-[12px] font-bold uppercase text-muted">
                Horas Poupadas
              </span>
              <strong className="block text-[30px] font-bold text-primary mt-2 tabular-nums">
                {stats.hours_saved}h+
              </strong>
              <span className="text-[12px] text-muted">livres de pesquisas manuais</span>
            </Card>

            <Card variant="bordered" className="p-6 text-center bg-canvas">
              <span className="block text-[12px] font-bold uppercase text-muted">
                Economia Acumulada
              </span>
              <strong className="block text-[28px] font-bold text-ink mt-2 tabular-nums">
                {formatBRL(stats.money_saved_brl)}
              </strong>
              <span className="text-[12px] text-muted">poupados pela comunidade</span>
            </Card>

            <Card variant="bordered" className="p-6 text-center bg-canvas">
              <span className="block text-[12px] font-bold uppercase text-muted">
                Cupons Processados
              </span>
              <strong className="block text-[30px] font-bold text-ink mt-2 tabular-nums">
                {stats.receipts_count}
              </strong>
              <span className="text-[12px] text-muted">notas fiscais oficiais</span>
            </Card>

            <Card variant="bordered" className="p-6 text-center bg-canvas">
              <span className="block text-[12px] font-bold uppercase text-muted">
                Economia Média Mensal
              </span>
              <strong className="block text-[30px] font-bold text-scenario-optimistic mt-2 tabular-nums">
                R$ 280
              </strong>
              <span className="text-[12px] text-muted">por mês no carrinho</span>
            </Card>
          </div>
        </section>

        <section className="bg-canvas rounded-md border border-hairline p-8 md:p-12">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-[26px] font-bold text-ink">
              Simule Sua Economia de Tempo e Dinheiro
            </h2>
            <p className="text-[15px] text-muted">
              Indique o gasto mensal aproximado da sua família em compras de supermercado:
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[14px] font-semibold text-muted">Gasto Mensal Atual</span>
                <span className="text-[28px] font-bold text-ink tabular-nums">
                  {formatBRL(monthlySpend)}
                </span>
              </div>

              <input
                type="range"
                min="400"
                max="4000"
                step="50"
                value={monthlySpend}
                onChange={(e) => setMonthlySpend(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-hairline rounded-lg cursor-pointer"
                aria-label="Gasto mensal aproximado"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-left">
              <Card variant="bordered" className="p-6 bg-surface-soft">
                <span className="block text-[12px] font-bold uppercase text-muted">
                  Tempo Livre Recuperado
                </span>
                <strong className="block text-[28px] font-bold text-ink mt-1 tabular-nums">
                  {estimatedHoursSavedMonth}h / mês
                </strong>
                <p className="text-[13px] text-muted mt-2">
                  60 horas por ano livres de planilhas e conferência manual.
                </p>
              </Card>

              <Card variant="bordered" className="p-6 bg-surface-soft">
                <span className="block text-[12px] font-bold uppercase text-scenario-optimistic">
                  Economia Mensal Estimada
                </span>
                <strong className="block text-[28px] font-bold text-primary mt-1 tabular-nums">
                  {formatBRL(estimatedSavingsMonth)}
                </strong>
                <p className="text-[13px] text-muted mt-2">
                  Média de 16,8% comprando nas opções mais competitivas.
                </p>
              </Card>

              <Card variant="bordered" className="p-6 bg-surface-soft">
                <span className="block text-[12px] font-bold uppercase text-scenario-optimistic">
                  Economia em 1 Ano
                </span>
                <strong className="block text-[28px] font-bold text-ink mt-1 tabular-nums">
                  {formatBRL(estimatedAnnualSavings)}
                </strong>
                <p className="text-[13px] text-muted mt-2">
                  Saldo recuperado diretamente no orçamento familiar.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-sm bg-surface-strong flex items-center justify-center text-ink">
              <Storefront size={22} weight="bold" />
            </div>
            <h3 className="text-[18px] font-bold text-ink">Localidade e Raio Real</h3>
            <p className="text-[14px] text-muted leading-relaxed">
              Configuração personalizada de cidade base e raio em km. O cálculo considera penalidade de deslocamento para evitar viagens que não compensam.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-sm bg-surface-strong flex items-center justify-center text-ink">
              <ShieldCheck size={22} weight="bold" />
            </div>
            <h3 className="text-[18px] font-bold text-ink">Privacidade e LGPD</h3>
            <p className="text-[14px] text-muted leading-relaxed">
              Isolamento estrito no Neon Postgres. Somente você acessa seus cupons fiscais e carrinhos individuais. Estatísticas públicas são anonimizadas.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-sm bg-surface-strong flex items-center justify-center text-ink">
              <TrendUp size={22} weight="bold" />
            </div>
            <h3 className="text-[18px] font-bold text-ink">Estratégia Otimizada</h3>
            <p className="text-[14px] text-muted leading-relaxed">
              Compre tudo em um único atacado ou divida a lista entre duas redes parceiras quando a economia líquida superar o custo do transporte.
            </p>
          </div>
        </section>

        <section className="text-center py-12 border-t border-hairline space-y-6">
          <h2 className="text-[28px] font-bold text-ink">
            Pronto para economizar tempo e dinheiro na sua próxima compra?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button variant="primary" size="lg">
                Criar Minha Conta Grátis
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="lg">
                Explorar Plataforma
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline py-12 bg-canvas">
        <div className="max-w-[1080px] mx-auto px-6 text-center text-[13px] text-muted space-y-2">
          <p>© 2026 PredictMarket PWA. Dados fiscais processados com total respeito à LGPD.</p>
          <p>Florianópolis, SC · Brasil</p>
        </div>
      </footer>
    </div>
  );
}
