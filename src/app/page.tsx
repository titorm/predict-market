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
import { PredictMarketLogo } from '@/components/ui/PredictMarketLogo';

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
      <header className="border-b border-hairline bg-canvas sticky top-0 z-20 safe-top">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[64px] sm:h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <PredictMarketLogo size={30} showText={true} />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="px-2.5 sm:px-3 text-[13px]">
                Entrar
              </Button>
            </Link>
            <Link href="/auth/signup" className="hidden sm:inline-block">
              <Button variant="secondary" size="sm">
                Criar Conta Grátis
              </Button>
            </Link>
            <Link href="/scanner">
              <Button variant="primary" size="sm" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                <QrCode size={18} weight="bold" />
                <span className="hidden sm:inline">Importar Nota</span>
                <span className="sm:hidden">Escanear</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16 sm:space-y-24">
        <section className="text-center max-w-3xl mx-auto space-y-5 sm:space-y-6">
          <Badge variant="optimistic" className="gap-1.5 py-1 px-3 text-[11px] sm:text-[12px]">
            <Sparkle size={14} weight="bold" />
            <span>Economia Inteligente Baseada nas Suas Notas Fiscais</span>
          </Badge>

          <h1 className="text-[30px] sm:text-[44px] md:text-[56px] font-bold leading-[1.12] sm:leading-[1.08] tracking-[-1px] sm:tracking-[-1.5px] text-ink">
            Pague até 17% menos no supermercado sem mudar as marcas que você ama.
          </h1>

          <p className="text-[15px] sm:text-[17px] md:text-[18px] text-body leading-[1.5]">
            Escaneie o QR Code das suas notas fiscais em 5 segundos. O PredictMarket audita cada preço pago, avisa o que está acabando na sua despensa e mostra exatamente onde sua próxima compra sai mais barata.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-3 sm:pt-4">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full gap-2 min-h-[48px]">
                <span>Começar a Economizar Grátis</span>
                <ArrowRight size={18} weight="bold" />
              </Button>
            </Link>
            <Link href="/scanner" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full gap-2 min-h-[48px]">
                <QrCode size={20} weight="bold" />
                <span>Escanear Primeira Nota Fiscal</span>
              </Button>
            </Link>
          </div>
        </section>

        <section className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-[28px] font-bold text-ink">
              Do cupom fiscal à lista de compras mais econômica da sua região
            </h2>
            <p className="text-[15px] text-muted">
              Transforme notas fiscais esquecidas na carteira em decisões claras para proteger o orçamento da sua casa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="bordered" className="p-6 bg-canvas border-hairline space-y-4">
              <div className="w-10 h-10 rounded-lg bg-surface-soft text-primary flex items-center justify-center">
                <QrCode size={22} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-ink">Leitura em 5 Segundos</h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  Aponte a câmera para o QR Code da nota ou cole a chave de acesso. Todos os produtos, preços e descontos entram na sua conta sem digitação manual.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-semibold text-primary flex items-center gap-1">
                <span>Consulta oficial SEFAZ</span>
                <CheckCircle size={14} weight="bold" />
              </div>
            </Card>

            <Card variant="bordered" className="p-6 bg-canvas border-hairline space-y-4">
              <div className="w-10 h-10 rounded-lg bg-surface-soft text-primary flex items-center justify-center">
                <Brain size={22} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-ink">Reposição Inteligente da Despensa</h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  A plataforma aprende o ritmo de consumo da sua casa e monta automaticamente a lista com os itens que estão prestes a acabar neste mês.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-semibold text-primary flex items-center gap-1">
                <span>Sem esquecer itens essenciais</span>
                <CheckCircle size={14} weight="bold" />
              </div>
            </Card>

            <Card variant="bordered" className="p-6 bg-canvas border-hairline space-y-4">
              <div className="w-10 h-10 rounded-lg bg-surface-soft text-primary flex items-center justify-center">
                <ShoppingCart size={22} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-ink">Comparador de Carrinho Completo</h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  Veja quanto sua lista vai custar antes de sair de casa e descubra se vale mais a pena comprar tudo em um único mercado ou dividir a compra.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-semibold text-primary flex items-center gap-1">
                <span>Economia líquida comprovada</span>
                <CheckCircle size={14} weight="bold" />
              </div>
            </Card>

            <Card variant="bordered" className="p-6 bg-canvas border-hairline space-y-4">
              <div className="w-10 h-10 rounded-lg bg-surface-soft text-primary flex items-center justify-center">
                <ChartLineUp size={22} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-ink">Detector de Falsas Promoções</h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  Consulte o menor, o médio e o maior valor já pago em cada item. Saiba na hora se uma oferta é real ou se o preço subiu nos últimos meses.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-semibold text-primary flex items-center gap-1">
                <span>Histórico real por produto</span>
                <CheckCircle size={14} weight="bold" />
              </div>
            </Card>

            <Card variant="bordered" className="p-6 bg-canvas border-hairline space-y-4">
              <div className="w-10 h-10 rounded-lg bg-surface-soft text-primary flex items-center justify-center">
                <ChartBar size={22} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-ink">Raio-X do Orçamento Mensal</h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  Acompanhe quanto sua família gasta por categoria, quais redes concentram suas compras e quanto dinheiro você já economizou em descontos.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-semibold text-primary flex items-center gap-1">
                <span>100% baseado nas suas notas</span>
                <CheckCircle size={14} weight="bold" />
              </div>
            </Card>

            <Card variant="bordered" className="p-6 bg-canvas border-hairline space-y-4">
              <div className="w-10 h-10 rounded-lg bg-surface-soft text-primary flex items-center justify-center">
                <Receipt size={22} weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-bold text-ink">Arquivo Digital de Compras</h3>
                <p className="text-[14px] text-muted leading-relaxed">
                  Nunca mais perca comprovantes de papel que apagam com o tempo. Pesquise qualquer item comprado por supermercado, data ou cidade em segundos.
                </p>
              </div>
              <div className="pt-2 text-[12px] font-semibold text-primary flex items-center gap-1">
                <span>Histórico sempre acessível</span>
                <CheckCircle size={14} weight="bold" />
              </div>
            </Card>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="bordered" className="p-8 border-hairline bg-surface-soft space-y-4">
            <div className="flex items-center gap-2 text-scenario-pessimistic font-bold text-[14px] uppercase tracking-wider">
              <Clock size={20} weight="bold" />
              <span>Sem o PredictMarket</span>
            </div>
            <h3 className="text-[22px] font-bold text-ink">Compras no improviso e dinheiro perdido</h3>
            <ul className="space-y-3 text-[15px] text-body">
              <li className="flex items-start gap-2">
                <span className="text-scenario-pessimistic font-bold">✕</span>
                <span>
                  <strong>Mais de 3 horas por mês</strong> conferindo armários e anotando listas no papel ou celular.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-scenario-pessimistic font-bold">✕</span>
                <span>
                  <strong>Até 17% de custo extra</strong> comprando tudo no mercado mais próximo sem comparar o valor total da cesta.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-scenario-pessimistic font-bold">✕</span>
                <span>Nenhuma referência para saber se o preço da prateleira está caro ou barato.</span>
              </li>
            </ul>
          </Card>

          <Card variant="bordered" className="p-8 border-hairline bg-canvas space-y-4">
            <div className="flex items-center gap-2 text-scenario-optimistic font-bold text-[14px] uppercase tracking-wider">
              <Sparkle size={20} weight="bold" />
              <span>Com o PredictMarket</span>
            </div>
            <h3 className="text-[22px] font-bold text-ink">Compras planejadas com economia previsível</h3>
            <ul className="space-y-3 text-[15px] text-body">
              <li className="flex items-start gap-2">
                <CheckCircle size={20} weight="bold" className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>5 segundos por compra</strong> para escanear a nota fiscal e atualizar todo o seu histórico de preços.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={20} weight="bold" className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Lista pronta em 1 clique</strong> com sugestões baseadas na frequência real de consumo da sua família.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={20} weight="bold" className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Roteiro de menor preço</strong> na sua cidade, descontando até o custo de deslocamento entre lojas.
                </span>
              </li>
            </ul>
          </Card>
        </section>

        <section className="bg-surface-soft rounded-md border border-hairline p-8 md:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-[26px] font-bold text-ink">
              Impacto Real no Bolso dos Consumidores
            </h2>
            <p className="text-[15px] text-muted">
              Resultados auditados a partir de notas fiscais de supermercados processadas na plataforma.
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
              <span className="text-[12px] text-muted">sem planilhas manuais</span>
            </Card>

            <Card variant="bordered" className="p-6 text-center bg-canvas">
              <span className="block text-[12px] font-bold uppercase text-muted">
                Economia Identificada
              </span>
              <strong className="block text-[28px] font-bold text-ink mt-2 tabular-nums">
                {formatBRL(stats.money_saved_brl)}
              </strong>
              <span className="text-[12px] text-muted">poupados pela comunidade</span>
            </Card>

            <Card variant="bordered" className="p-6 text-center bg-canvas">
              <span className="block text-[12px] font-bold uppercase text-muted">
                Notas Auditadas
              </span>
              <strong className="block text-[30px] font-bold text-ink mt-2 tabular-nums">
                {stats.receipts_count}
              </strong>
              <span className="text-[12px] text-muted">cupons fiscais verificados</span>
            </Card>

            <Card variant="bordered" className="p-6 text-center bg-canvas">
              <span className="block text-[12px] font-bold uppercase text-muted">
                Economia Média Mensal
              </span>
              <strong className="block text-[30px] font-bold text-scenario-optimistic mt-2 tabular-nums">
                R$ 280
              </strong>
              <span className="text-[12px] text-muted">por família todo mês</span>
            </Card>
          </div>
        </section>

        <section className="bg-canvas rounded-md border border-hairline p-8 md:p-12">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-[26px] font-bold text-ink">
              Calcule Quanto Sua Família Pode Economizar
            </h2>
            <p className="text-[15px] text-muted">
              Ajuste o controle abaixo com o valor médio que você gasta por mês no supermercado:
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[14px] font-semibold text-muted">Seu Gasto Mensal no Mercado</span>
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
                  60 horas por ano livres de pesquisas de encartes e planilhas.
                </p>
              </Card>

              <Card variant="bordered" className="p-6 bg-surface-soft">
                <span className="block text-[12px] font-bold uppercase text-scenario-optimistic">
                  No Seu Bolso Todo Mês
                </span>
                <strong className="block text-[28px] font-bold text-primary mt-1 tabular-nums">
                  {formatBRL(estimatedSavingsMonth)}
                </strong>
                <p className="text-[13px] text-muted mt-2">
                  Economia média de 16,8% escolhendo o mercado ideal para sua lista.
                </p>
              </Card>

              <Card variant="bordered" className="p-6 bg-surface-soft">
                <span className="block text-[12px] font-bold uppercase text-scenario-optimistic">
                  Economia Acumulada em 1 Ano
                </span>
                <strong className="block text-[28px] font-bold text-ink mt-1 tabular-nums">
                  {formatBRL(estimatedAnnualSavings)}
                </strong>
                <p className="text-[13px] text-muted mt-2">
                  Valor equivalente a quase dois meses inteiros de compras grátis por ano.
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
            <h3 className="text-[18px] font-bold text-ink">Cálculo que Inclui o Deslocamento</h3>
            <p className="text-[14px] text-muted leading-relaxed">
              Defina sua cidade e a distância máxima que aceita percorrer. Só recomendamos dividir a compra em dois mercados quando o desconto supera o custo do trajeto.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-sm bg-surface-strong flex items-center justify-center text-ink">
              <ShieldCheck size={22} weight="bold" />
            </div>
            <h3 className="text-[18px] font-bold text-ink">Privacidade Total dos Seus Dados</h3>
            <p className="text-[14px] text-muted leading-relaxed">
              Suas notas fiscais e listas de compras são privadas e visíveis apenas na sua conta. As comparações regionais usam somente preços de produtos sem identificar você.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-sm bg-surface-strong flex items-center justify-center text-ink">
              <TrendUp size={22} weight="bold" />
            </div>
            <h3 className="text-[18px] font-bold text-ink">Decisão Rápida Antes de Sair</h3>
            <p className="text-[14px] text-muted leading-relaxed">
              Compare em segundos o custo da compra completa em um atacadista versus a combinação dos itens mais baratos em duas redes próximas.
            </p>
          </div>
        </section>

        <section className="text-center py-12 border-t border-hairline space-y-6">
          <h2 className="text-[28px] font-bold text-ink">
            Descubra hoje quanto você pode economizar na sua próxima ida ao mercado
          </h2>
          <p className="text-[15px] text-muted max-w-xl mx-auto">
            Pegue a última nota fiscal da sua compra, escaneie o QR Code e veja seu diagnóstico de preços em segundos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button variant="primary" size="lg">
                Criar Minha Conta Grátis
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="lg">
                Explorar Painel de Demonstração
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline py-12 bg-canvas">
        <div className="max-w-[1080px] mx-auto px-6 text-center text-[13px] text-muted space-y-2">
          <p>© 2026 PredictMarket. Inteligência de preços e economia doméstica com proteção integral à LGPD.</p>
          <p>Florianópolis, SC · Brasil</p>
        </div>
      </footer>
    </div>
  );
}
