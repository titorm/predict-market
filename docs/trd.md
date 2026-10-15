# Technical Requirement Document (TRD): PredictMarket PWA
**Versão:** 1.0.0 (Core Imutável)  
**Stack Principal:** Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4, Supabase (PostgreSQL 16 + `pgvector`), Cheerio, Zod, OpenAI/Gemini Embeddings.

---

## 1. Arquitetura Técnica e Fluxo de Dados

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       CLIENTE WEB / MOBILE (PWA)                         │
│  [Leitor QR HTML5]  [Web Share Target Worker]  [Dashboard React 19 UI]   │
└──────────────────┬───────────────────────────────────────┬───────────────┘
                   │ POST /api/receipts/ingest             │ GET /api/forecasts
                   ▼                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   CAMADA DE APLICAÇÃO (NEXT.JS SERVER)                   │
│  ┌───────────────────────────────┐    ┌───────────────────────────────┐  │
│  │     NfceIngestionService      │    │     GroceryForecastEngine     │  │
│  │  1. Parser Chave 44 dígitos   │    │  1. Série Temporal Mensal     │  │
│  │  2. Scraper SEFAZ (Cheerio)   │    │  2. EWMA + Bayesian Shrinkage │  │
│  │  3. Limpeza Léxica + Regex    │    │  3. Cenários Opt / Real / Pess│  │
│  │  4. Geração de Embeddings     │    │  4. Otimizador Split-Cart     │  │
│  └───────────────┬───────────────┘    └───────────────┬───────────────┘  │
└──────────────────┼────────────────────────────────────┼──────────────────┘
                   │ RPC match_or_resolve_product       │ Query Views
                   ▼                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  CAMADA DE PERSISTÊNCIA (SUPABASE POSTGRES)              │
│  [stores]  [canonical_products (HNSW 1536d)]  [store_product_aliases]    │
│  [receipts]  [receipt_items]  [baskets]  [vw_monthly_product_price_stats]│
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Especificação Matemática do Motor Preditivo e Arbitragem

### 2.1. Projeção Individual por Produto ($i$)
Dado o histórico mensal agregado do produto $i$, extrai-se o vetor de variações percentuais mensais $R_i = \{r_{i,1}, r_{i,2}, \dots, r_{i,n}\}$, truncado no intervalo $[-0.40, +0.80]$:

$$r_{i,m} = \text{clamp}\left(\frac{\bar{P}_{i,m} - \bar{P}_{i,m-1}}{\bar{P}_{i,m-1}}, -0.40, 0.80\right)$$

1. **Tendência Exponencial ($g_{i,\text{hist}}$):** Com $\alpha = 0.40$:
   $$g_{i,1} = r_{i,1}, \quad g_{i,k} = \alpha \cdot r_{i,k} + (1 - \alpha) \cdot g_{i,k-1}$$
2. **Encolhimento Bayesiano para *Cold Start* ($\hat{\mu}_i, \hat{\sigma}_i$):** Com constante de maturação $\tau = 3$, inflação base $\pi_{\text{prior}} = 0.0085$ ($0.85\%$ a.m.) e volatilidade base $\sigma_{\text{prior}} = 0.035$ ($3.5\%$ a.m.):
   $$w_n = \frac{n}{n + \tau}$$
   $$\hat{\mu}_i = w_n \cdot g_{i,\text{hist}} + (1 - w_n) \cdot \pi_{\text{prior}}$$
   $$\hat{\sigma}_i = w_n \cdot s_i + (1 - w_n) \cdot \sigma_{\text{prior}}$$
   Onde $s_i$ é o desvio padrão amostral das variações $R_i$ (ou $0$ se $n < 2$).
3. **Equações de Preço Unitário Projetado ($t+1$):**
   * **Realista:** $\hat{P}_{i,t+1}^{\text{real}} = P_{i,t}^{\text{atual}} \cdot (1 + \hat{\mu}_i)$
   * **Otimista:** $\hat{P}_{i,t+1}^{\text{opt}} = \min\left(\hat{P}_{i,t+1}^{\text{real}},\; P_{i,t}^{\min\_\text{regional}} \cdot \max(0.95,\; 1 + \hat{\mu}_i - 0.5\hat{\sigma}_i)\right)$
   * **Pessimista:** $\hat{P}_{i,t+1}^{\text{pess}} = \max\left(\hat{P}_{i,t+1}^{\text{real}},\; P_{i,t}^{\max\_\text{regional}} \cdot (1 + \hat{\mu}_i + 1.5\hat{\sigma}_i)\right)$

### 2.2. Equação de Detecção de Reduflação (*Shrinkflation*)
Um alerta de reduflação é emitido quando um produto da mesma marca e categoria apresenta redução de medida líquida ($M_{\text{nova}} < M_{\text{antiga}}$) enquanto a razão de preço nominal satisfaz:

$$\text{Inflação Oculta (\%)} = \left( \frac{P_{\text{novo}} / M_{\text{nova}}}{P_{\text{antigo}} / M_{\text{antiga}}} - 1 \right) \times 100 \ge 5.0\%$$

### 2.3. Equação do Otimizador de Carrinho Dividido (*Split-Cart*)
Seja $S$ o conjunto de supermercados disponíveis na região, $C_{\text{único}}(s) = \sum_{i \in C} q_i \cdot \hat{P}_{i,s}$ o custo da cesta inteira no estabelecimento $s$, e $s^* = \arg\min_{s \in S} C_{\text{único}}(s)$ o melhor mercado único. Para qualquer par de mercados $(s_a, s_b)$ com custo extra de deslocamento $\Delta_{\text{transporte}}$:

$$C_{\text{dividido}}(s_a, s_b) = \sum_{i \in C} q_i \cdot \min\left(\hat{P}_{i,s_a}, \hat{P}_{i,s_b}\right) + \Delta_{\text{transporte}}$$

A divisão de compra só é recomendada se $\text{Economia Líquida} = C_{\text{único}}(s^*) - C_{\text{dividido}}(s_a, s_b) > 0$.

---

## 3. Implementação Core do Motor Preditivo e Otimizador (`src/core/engine/GroceryForecastEngine.ts`)

```typescript
export interface MonthlyPriceStat {
  referenceMonth: string; // 'YYYY-MM-01'
  storeId: string;
  storeName: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  priceVolatilityStddev: number;
  avgPricePerBaseUnit: number;
}

export interface BasketItemInput {
  canonicalProductId: string;
  commercialName: string;
  ean: string | null;
  baseUnit: 'KG' | 'L' | 'UN';
  netMeasure: number;
  quantity: number;
  currentUnitPrice: number;
  currentStoreId: string;
  history: MonthlyPriceStat[];
}

export interface ItemForecastOutput {
  canonicalProductId: string;
  commercialName: string;
  quantity: number;
  baseUnit: 'KG' | 'L' | 'UN';
  lastPaidUnit: number;
  lastPaidTotal: number;
  optimisticUnit: number;
  realisticUnit: number;
  pessimisticUnit: number;
  optimisticTotal: number;
  realisticTotal: number;
  pessimisticTotal: number;
  expectedMonthlyInflationPct: number;
  confidenceScorePct: number;
  cheapestStoreId: string;
  cheapestStoreName: string;
}

export interface SplitCartAllocation {
  canonicalProductId: string;
  commercialName: string;
  quantity: number;
  assignedStoreId: string;
  assignedStoreName: string;
  unitPrice: number;
  subtotal: number;
}

export interface SplitCartRecommendation {
  isWorthSplitting: boolean;
  bestSingleStoreId: string;
  bestSingleStoreName: string;
  bestSingleStoreTotal: number;
  storePairIds: [string, string] | null;
  storePairNames: [string, string] | null;
  rawSplitTotal: number;
  transitCostPenalty: number;
  netSavings: number;
  allocations: SplitCartAllocation[];
}

export interface BasketForecastReport {
  referenceDate: string;
  lastPaidBasketTotal: number;
  optimisticBasketTotal: number;
  realisticBasketTotal: number;
  pessimisticBasketTotal: number;
  projectedMonthlyInflationPct: number;
  items: ItemForecastOutput[];
  splitCartAnalysis: SplitCartRecommendation;
}

export interface EngineHyperparameters {
  ewmaAlpha: number;
  shrinkageTau: number;
  priorMonthlyInflation: number;
  priorVolatility: number;
  defaultTransitPenaltyBRL: number;
}

const DEFAULT_HYPERPARAMETERS: EngineHyperparameters = {
  ewmaAlpha: 0.4,
  shrinkageTau: 3,
  priorMonthlyInflation: 0.0085,
  priorVolatility: 0.035,
  defaultTransitPenaltyBRL: 35.0,
};

export class GroceryForecastEngine {
  private readonly params: EngineHyperparameters;

  constructor(customParams: Partial<EngineHyperparameters> = {}) {
    this.params = { ...DEFAULT_HYPERPARAMETERS, ...customParams };
  }

  public generateFullReport(
    basket: BasketItemInput[],
    customTransitPenaltyBRL?: number
  ): BasketForecastReport {
    if (!Array.isArray(basket) || basket.length === 0) {
      throw new Error('GroceryForecastEngine: A cesta de entrada não pode estar vazia.');
    }

    const items = basket.map((item) => this.forecastItem(item));

    const totals = items.reduce(
      (acc, cur) => ({
        lastPaid: this.round(acc.lastPaid + cur.lastPaidTotal),
        optimistic: this.round(acc.optimistic + cur.optimisticTotal),
        realistic: this.round(acc.realistic + cur.realisticTotal),
        pessimistic: this.round(acc.pessimistic + cur.pessimisticTotal),
      }),
      { lastPaid: 0, optimistic: 0, realistic: 0, pessimistic: 0 }
    );

    const projectedMonthlyInflationPct =
      totals.lastPaid > 0
        ? this.round(((totals.realistic - totals.lastPaid) / totals.lastPaid) * 100)
        : 0;

    const splitCartAnalysis = this.optimizeSplitCart(
      basket,
      customTransitPenaltyBRL ?? this.params.defaultTransitPenaltyBRL
    );

    return {
      referenceDate: new Date().toISOString(),
      lastPaidBasketTotal: totals.lastPaid,
      optimisticBasketTotal: totals.optimistic,
      realisticBasketTotal: totals.realistic,
      pessimisticBasketTotal: totals.pessimistic,
      projectedMonthlyInflationPct,
      items,
      splitCartAnalysis,
    };
  }

  private forecastItem(item: BasketItemInput): ItemForecastOutput {
    if (item.quantity <= 0 || item.currentUnitPrice < 0) {
      throw new Error(`Valores inválidos para o produto ${item.commercialName}`);
    }

    const monthlySeries = this.consolidateMonthlySeries(item.history);
    const returns = this.computeClampedReturns(monthlySeries);
    const n = returns.length;

    const ewmaTrend = this.computeEWMA(returns, this.params.ewmaAlpha);
    const sampleStdDev = this.computeStdDev(returns);

    const weight = n / (n + this.params.shrinkageTau);
    const expectedInflation =
      weight * ewmaTrend + (1 - weight) * this.params.priorMonthlyInflation;
    const effectiveVolatility =
      weight * sampleStdDev + (1 - weight) * this.params.priorVolatility;

    const bounds = this.extractRecentStoreBounds(item);

    const rawRealistic = item.currentUnitPrice * (1 + expectedInflation);
    const optMultiplier = Math.max(0.95, 1 + expectedInflation - 0.5 * effectiveVolatility);
    const rawOptimistic = bounds.minPrice * optMultiplier;
    const pessMultiplier = 1 + expectedInflation + 1.5 * effectiveVolatility;
    const rawPessimistic = bounds.maxPrice * pessMultiplier;

    const realisticUnit = this.round(rawRealistic);
    const optimisticUnit = this.round(Math.min(rawOptimistic, realisticUnit));
    const pessimisticUnit = this.round(Math.max(rawPessimistic, realisticUnit));

    return {
      canonicalProductId: item.canonicalProductId,
      commercialName: item.commercialName,
      quantity: item.quantity,
      baseUnit: item.baseUnit,
      lastPaidUnit: this.round(item.currentUnitPrice),
      lastPaidTotal: this.round(item.currentUnitPrice * item.quantity),
      optimisticUnit,
      realisticUnit,
      pessimisticUnit,
      optimisticTotal: this.round(optimisticUnit * item.quantity),
      realisticTotal: this.round(realisticUnit * item.quantity),
      pessimisticTotal: this.round(pessimisticUnit * item.quantity),
      expectedMonthlyInflationPct: this.round(expectedInflation * 100),
      confidenceScorePct: Math.min(99, Math.round(weight * 100)),
      cheapestStoreId: bounds.cheapestStoreId,
      cheapestStoreName: bounds.cheapestStoreName,
    };
  }

  private optimizeSplitCart(
    basket: BasketItemInput[],
    transitPenaltyBRL: number
  ): SplitCartRecommendation {
    const storeDirectory = new Map<string, string>();
    const storeItemPrices = new Map<string, Map<string, number>>();

    for (const item of basket) {
      storeDirectory.set(item.currentStoreId, 'Mercado Atual');
      for (const stat of item.history) {
        storeDirectory.set(stat.storeId, stat.storeName);
        if (!storeItemPrices.has(stat.storeId)) {
          storeItemPrices.set(stat.storeId, new Map());
        }
        storeItemPrices.get(stat.storeId)!.set(item.canonicalProductId, stat.avgPrice);
      }
    }

    const storeIds = Array.from(storeDirectory.keys());
    if (storeIds.length <= 1) {
      const fallbackId = storeIds[0] ?? basket[0].currentStoreId;
      const singleTotal = this.round(
        basket.reduce((sum, i) => sum + i.currentUnitPrice * i.quantity, 0)
      );
      return {
        isWorthSplitting: false,
        bestSingleStoreId: fallbackId,
        bestSingleStoreName: storeDirectory.get(fallbackId) ?? 'Mercado Habitual',
        bestSingleStoreTotal: singleTotal,
        storePairIds: null,
        storePairNames: null,
        rawSplitTotal: singleTotal,
        transitCostPenalty: transitPenaltyBRL,
        netSavings: 0,
        allocations: basket.map((i) => ({
          canonicalProductId: i.canonicalProductId,
          commercialName: i.commercialName,
          quantity: i.quantity,
          assignedStoreId: fallbackId,
          assignedStoreName: storeDirectory.get(fallbackId) ?? 'Mercado Habitual',
          unitPrice: i.currentUnitPrice,
          subtotal: this.round(i.currentUnitPrice * i.quantity),
        })),
      };
    }

    // 1. Melhor mercado único
    let bestSingleStoreId = storeIds[0];
    let bestSingleStoreTotal = Number.POSITIVE_INFINITY;

    for (const sId of storeIds) {
      const priceMap = storeItemPrices.get(sId);
      let total = 0;
      for (const item of basket) {
        const price = priceMap?.get(item.canonicalProductId) ?? item.currentUnitPrice * 1.03;
        total += price * item.quantity;
      }
      if (total < bestSingleStoreTotal) {
        bestSingleStoreTotal = total;
        bestSingleStoreId = sId;
      }
    }

    // 2. Melhor combinação de 2 mercados
    let bestPair: [string, string] = [storeIds[0], storeIds[1]];
    let bestRawSplitTotal = Number.POSITIVE_INFINITY;
    let bestAllocations: SplitCartAllocation[] = [];

    for (let i = 0; i < storeIds.length; i++) {
      for (let j = i + 1; j < storeIds.length; j++) {
        const sA = storeIds[i];
        const sB = storeIds[j];
        const mapA = storeItemPrices.get(sA);
        const mapB = storeItemPrices.get(sB);

        let pairTotal = 0;
        const currentAllocations: SplitCartAllocation[] = [];

        for (const item of basket) {
          const pA = mapA?.get(item.canonicalProductId) ?? item.currentUnitPrice;
          const pB = mapB?.get(item.canonicalProductId) ?? item.currentUnitPrice;
          const chosenStore = pA <= pB ? sA : sB;
          const chosenPrice = Math.min(pA, pB);

          pairTotal += chosenPrice * item.quantity;
          currentAllocations.push({
            canonicalProductId: item.canonicalProductId,
            commercialName: item.commercialName,
            quantity: item.quantity,
            assignedStoreId: chosenStore,
            assignedStoreName: storeDirectory.get(chosenStore) ?? chosenStore,
            unitPrice: this.round(chosenPrice),
            subtotal: this.round(chosenPrice * item.quantity),
          });
        }

        if (pairTotal < bestRawSplitTotal) {
          bestRawSplitTotal = pairTotal;
          bestPair = [sA, sB];
          bestAllocations = currentAllocations;
        }
      }
    }

    const netSavings = this.round(
      bestSingleStoreTotal - (bestRawSplitTotal + transitPenaltyBRL)
    );

    return {
      isWorthSplitting: netSavings > 0,
      bestSingleStoreId,
      bestSingleStoreName: storeDirectory.get(bestSingleStoreId) ?? bestSingleStoreId,
      bestSingleStoreTotal: this.round(bestSingleStoreTotal),
      storePairIds: bestPair,
      storePairNames: [
        storeDirectory.get(bestPair[0]) ?? bestPair[0],
        storeDirectory.get(bestPair[1]) ?? bestPair[1],
      ],
      rawSplitTotal: this.round(bestRawSplitTotal),
      transitCostPenalty: transitPenaltyBRL,
      netSavings: Math.max(0, netSavings),
      allocations: bestAllocations,
    };
  }

  private consolidateMonthlySeries(
    history: MonthlyPriceStat[]
  ): { month: string; avgPrice: number }[] {
    const map = new Map<string, number[]>();
    for (const h of history) {
      const list = map.get(h.referenceMonth) ?? [];
      list.push(h.avgPrice);
      map.set(h.referenceMonth, list);
    }
    return Array.from(map.entries())
      .map(([month, vals]) => ({
        month,
        avgPrice: vals.reduce((a, b) => a + b, 0) / vals.length,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private computeClampedReturns(series: { month: string; avgPrice: number }[]): number[] {
    if (series.length < 2) return [];
    const returns: number[] = [];
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1].avgPrice;
      const curr = series[i].avgPrice;
      if (prev > 0) {
        const r = (curr - prev) / prev;
        returns.push(Math.max(-0.4, Math.min(0.8, r)));
      }
    }
    return returns;
  }

  private computeEWMA(returns: number[], alpha: number): number {
    if (returns.length === 0) return 0;
    let ewma = returns[0];
    for (let i = 1; i < returns.length; i++) {
      ewma = alpha * returns[i] + (1 - alpha) * ewma;
    }
    return ewma;
  }

  private computeStdDev(returns: number[]): number {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance);
  }

  private extractRecentStoreBounds(item: BasketItemInput): {
    minPrice: number;
    maxPrice: number;
    cheapestStoreId: string;
    cheapestStoreName: string;
  } {
    if (item.history.length === 0) {
      return {
        minPrice: item.currentUnitPrice,
        maxPrice: item.currentUnitPrice,
        cheapestStoreId: item.currentStoreId,
        cheapestStoreName: 'Mercado Atual',
      };
    }

    const sorted = [...item.history].sort((a, b) =>
      b.referenceMonth.localeCompare(a.referenceMonth)
    );
    const latestMonth = sorted[0].referenceMonth;
    const recentStats = sorted.filter((s) => s.referenceMonth === latestMonth);

    let minPrice = item.currentUnitPrice;
    let maxPrice = item.currentUnitPrice;
    let cheapestStoreId = item.currentStoreId;
    let cheapestStoreName = recentStats[0]?.storeName ?? 'Mercado Atual';

    for (const stat of recentStats) {
      if (stat.minPrice < minPrice) {
        minPrice = stat.minPrice;
        cheapestStoreId = stat.storeId;
        cheapestStoreName = stat.storeName;
      }
      if (stat.maxPrice > maxPrice) {
        maxPrice = stat.maxPrice;
      }
    }

    return { minPrice, maxPrice, cheapestStoreId, cheapestStoreName };
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
```

---

## 4. Pipeline Completo de Extração SEFAZ e Resolução Semântica (`src/core/ingestion/NfceIngestionService.ts`)

```typescript
import * as cheerio from 'cheerio';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SefazScrapedItem {
  cProd: string;
  xProd: string;
  cEAN: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vDesc: number;
}

export interface SefazScrapedReceipt {
  accessKey: string;
  sefazUrl: string;
  cnpjStore: string;
  tradeName: string;
  legalName: string;
  city: string;
  state: string;
  issuedAt: string;
  totalGross: number;
  totalDiscount: number;
  items: SefazScrapedItem[];
}

export class NfceIngestionService {
  private readonly supabase: SupabaseClient;
  private readonly openAiApiKey: string;

  constructor(supabaseUrl: string, supabaseServiceKey: string, openAiApiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.openAiApiKey = openAiApiKey;
  }

  public async ingestReceipt(
    rawInputUrlOrKey: string,
    userId: string
  ): Promise<{ receiptId: string; itemsProcessed: number; isDuplicate: boolean }> {
    const accessKey = this.extractAccessKey(rawInputUrlOrKey);
    if (!accessKey) {
      throw new Error('Chave de acesso de 44 dígitos inválida ou ausente no QR Code.');
    }

    // 1. Verificação de Idempotência (BR01)
    const { data: existingReceipt } = await this.supabase
      .from('receipts')
      .select('id')
      .eq('access_key', accessKey)
      .maybeSingle();

    if (existingReceipt) {
      return { receiptId: existingReceipt.id, itemsProcessed: 0, isDuplicate: true };
    }

    // 2. Extração do HTML da SEFAZ Estadual
    const targetUrl = rawInputUrlOrKey.startsWith('http')
      ? rawInputUrlOrKey
      : this.buildSefazConsultationUrl(accessKey);

    const parsedReceipt = await this.scrapeSefazPortal(targetUrl, accessKey);

    // 3. Upsert do Estabelecimento Comercial
    const storeId = await this.upsertStore(parsedReceipt);

    // 4. Gravação do Cabeçalho da Nota Fiscal
    const { data: createdReceipt, error: receiptErr } = await this.supabase
      .from('receipts')
      .insert({
        user_id: userId,
        store_id: storeId,
        access_key: parsedReceipt.accessKey,
        issued_at: parsedReceipt.issuedAt,
        total_gross: parsedReceipt.totalGross,
        total_discount: parsedReceipt.totalDiscount,
        sefaz_url: parsedReceipt.sefazUrl,
      })
      .select('id')
      .single();

    if (receiptErr || !createdReceipt) {
      throw new Error(`Falha ao persistir cabeçalho da nota: ${receiptErr?.message}`);
    }

    // 5. Resolução de Entidade e Gravação dos Itens
    let processedCount = 0;
    for (const item of parsedReceipt.items) {
      const canonicalProductId = await this.resolveOrCreateProduct(storeId, item);

      const { error: itemErr } = await this.supabase.from('receipt_items').insert({
        receipt_id: createdReceipt.id,
        store_id: storeId,
        canonical_product_id: canonicalProductId,
        purchased_at: parsedReceipt.issuedAt,
        quantity: item.qCom,
        raw_unit: item.uCom,
        gross_unit_price: item.vUnCom,
        total_item_discount: item.vDesc,
      });

      if (!itemErr) processedCount++;
    }

    return {
      receiptId: createdReceipt.id,
      itemsProcessed: processedCount,
      isDuplicate: false,
    };
  }

  public extractAccessKey(input: string): string | null {
    const cleaned = input.replace(/\s+/g, '');
    if (/^[0-9]{44}$/.test(cleaned)) return cleaned;

    const match = cleaned.match(/(?:chNFe=|p=|chave=)([0-9]{44})/i) ?? cleaned.match(/([0-9]{44})/);
    return match ? match[1] : null;
  }

  private buildSefazConsultationUrl(accessKey: string): string {
    const ufCode = accessKey.substring(0, 2);
    // 42 = SC, 23 = CE, 35 = SP, 41 = PR, 43 = RS
    const ufEndpoints: Record<string, string> = {
      '42': `[https://sat.sef.sc.gov.br/nfce/consulta?p=$](https://sat.sef.sc.gov.br/nfce/consulta?p=$){accessKey}`,
      '23': `[https://nfce.sefaz.ce.gov.br/pages/ShowNFCe.html?p=$](https://nfce.sefaz.ce.gov.br/pages/ShowNFCe.html?p=$){accessKey}`,
      '41': `[http://www.fazenda.pr.gov.br/nfce/qrcode?p=$](http://www.fazenda.pr.gov.br/nfce/qrcode?p=$){accessKey}`,
      '43': `[https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?p=$](https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?p=$){accessKey}`,
    };
    return ufEndpoints[ufCode] ?? `[https://sat.sef.sc.gov.br/nfce/consulta?p=$](https://sat.sef.sc.gov.br/nfce/consulta?p=$){accessKey}`;
  }

  private async scrapeSefazPortal(url: string, accessKey: string): Promise<SefazScrapedReceipt> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`SEFAZ retornou HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const legalName =
        $('#u20, .txtTopo').first().text().trim() || 'Estabelecimento Comercial NFC-e';
      const cnpjRaw = $('div.text:contains("CNPJ")').text() || html;
      const cnpjMatch = cnpjRaw.match(/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/);
      const cnpjStore = cnpjMatch ? cnpjMatch[1].replace(/\D/g, '') : '00000000000000';

      const items: SefazScrapedItem[] = [];
      $('table#tabResult tr[id^="Item"]').each((_, el) => {
        const xProd = $(el).find('.txtTit, .txtTit2').first().text().trim();
        const codeText = $(el).find('.RCod').text();
        const cProdMatch = codeText.match(/Código:\s*([A-Za-z0-9_-]+)/i);
        const eanMatch = codeText.match(/EAN:\s*([0-9]{8,14})/i);

        const qComText = $(el).find('.Rqtd').text().replace(/[^\d,.-]/g, '').replace(',', '.');
        const uComText = $(el).find('.RUN').text().replace(/UN:\s*/i, '').trim() || 'UN';
        const vUnText = $(el).find('.RvlUnit').text().replace(/[^\d,.-]/g, '').replace(',', '.');
        const vDescText = $(el).find('.RvlDesc').text().replace(/[^\d,.-]/g, '').replace(',', '.');

        if (xProd) {
          items.push({
            cProd: cProdMatch ? cProdMatch[1] : xProd.substring(0, 12),
            xProd,
            cEAN: eanMatch ? eanMatch[1] : 'SEM GTIN',
            uCom: uComText.substring(0, 10).toUpperCase(),
            qCom: Math.max(0.001, parseFloat(qComText) || 1),
            vUnCom: Math.max(0.01, parseFloat(vUnText) || 0),
            vDesc: Math.max(0, parseFloat(vDescText) || 0),
          });
        }
      });

      const totalGross = items.reduce((acc, i) => acc + i.qCom * i.vUnCom, 0);
      const totalDiscount = items.reduce((acc, i) => acc + i.vDesc, 0);

      return {
        accessKey,
        sefazUrl: url,
        cnpjStore,
        tradeName: legalName,
        legalName,
        city: 'Florianópolis',
        state: 'SC',
        issuedAt: new Date().toISOString(),
        totalGross: Number(totalGross.toFixed(2)),
        totalDiscount: Number(totalDiscount.toFixed(2)),
        items,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async upsertStore(receipt: SefazScrapedReceipt): Promise<string> {
    const { data, error } = await this.supabase
      .from('stores')
      .upsert(
        {
          cnpj: receipt.cnpjStore,
          trade_name: receipt.tradeName,
          legal_name: receipt.legalName,
          city: receipt.city,
          state: receipt.state,
        },
        { onConflict: 'cnpj' }
      )
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Erro ao registrar supermercado: ${error?.message}`);
    }
    return data.id;
  }

  private async resolveOrCreateProduct(
    storeId: string,
    item: SefazScrapedItem
  ): Promise<string> {
    const validEan =
      item.cEAN && /^[0-9]{8,14}$/.test(item.cEAN) ? item.cEAN : null;
    const normalizedText = this.sanitizeFiscalDescription(item.xProd);
    const embedding = await this.fetchEmbedding(normalizedText);

    const { data: matches } = await this.supabase.rpc('match_or_resolve_product', {
      p_store_id: storeId,
      p_ean: validEan,
      p_raw_code: item.cProd,
      p_raw_description: item.xProd,
      p_query_embedding: embedding,
      p_similarity_threshold: 0.88,
    });

    if (matches && matches.length > 0) {
      const topMatch = matches[0];
      if (topMatch.match_method === 'VECTOR_SEMANTIC_MATCH') {
        await this.supabase.from('store_product_aliases').upsert(
          {
            store_id: storeId,
            canonical_product_id: topMatch.resolved_product_id,
            raw_store_code: item.cProd,
            raw_description: item.xProd,
            confidence_score: topMatch.similarity,
            is_manually_verified: false,
          },
          { onConflict: 'store_id,raw_store_code,raw_description' }
        );
      }
      return topMatch.resolved_product_id;
    }

    const baseUnit = this.inferBaseUnit(item.uCom, normalizedText);
    const netMeasure = this.extractNetMeasure(normalizedText, item.qCom, baseUnit);

    const { data: createdProduct, error: prodErr } = await this.supabase
      .from('canonical_products')
      .insert({
        ean: validEan,
        commercial_name: normalizedText,
        category: this.inferCategory(normalizedText),
        base_unit: baseUnit,
        net_measure: netMeasure,
        embedding,
      })
      .select('id')
      .single();

    if (prodErr || !createdProduct) {
      throw new Error(`Erro ao criar produto canônico (${item.xProd}): ${prodErr?.message}`);
    }

    await this.supabase.from('store_product_aliases').upsert(
      {
        store_id: storeId,
        canonical_product_id: createdProduct.id,
        raw_store_code: item.cProd,
        raw_description: item.xProd,
        confidence_score: 1.0,
        is_manually_verified: true,
      },
      { onConflict: 'store_id,raw_store_code,raw_description' }
    );

    return createdProduct.id;
  }

  public sanitizeFiscalDescription(raw: string): string {
    const dictionary: Record<string, string> = {
      '\\bARR\\b': 'ARROZ',
      '\\bBCO\\b': 'BRANCO',
      '\\bFEIJ\\b': 'FEIJAO',
      '\\bT1\\b': 'TIPO 1',
      '\\bC/\\b': 'COM',
      '\\bS/\\b': 'SEM',
      '\\bBISC\\b': 'BISCOITO',
      '\\bREFRIG\\b': 'REFRIGERANTE',
      '\\bDETERG\\b': 'DETERGENTE',
      '\\bSAB\\b': 'SABAO',
      '\\bLIQ\\b': 'LIQUIDO',
      '\\bTRAD\\b': 'TRADICIONAL',
    };

    let text = raw.toUpperCase().replace(/[*_#]/g, ' ');
    for (const [pattern, replacement] of Object.entries(dictionary)) {
      text = text.replace(new RegExp(pattern, 'gi'), replacement);
    }

    return text
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
  }

  private inferBaseUnit(uCom: string, desc: string): 'KG' | 'L' | 'UN' {
    const u = uCom.toUpperCase();
    const d = desc.toUpperCase();
    if (u === 'KG' || u === 'G' || /\b(\d+\s*KG|\d+\s*G|GRANEL)\b/.test(d)) return 'KG';
    if (u === 'L' || u === 'ML' || u === 'LT' || /\b(\d+\s*L|\d+\s*ML|LITRO)\b/.test(d)) return 'L';
    return 'UN';
  }

  private extractNetMeasure(desc: string, qCom: number, baseUnit: 'KG' | 'L' | 'UN'): number {
    const upper = desc.toUpperCase();
    const kgMatch = upper.match(/(\d+(?:[.,]\d+)?)\s*KG\b/);
    if (kgMatch) return parseFloat(kgMatch[1].replace(',', '.'));

    const gMatch = upper.match(/(\d+)\s*G(?:R|RAMAS)?\b/);
    if (gMatch) return parseFloat(gMatch[1]) / 1000;

    const lMatch = upper.match(/(\d+(?:[.,]\d+)?)\s*(?:L|LT|LITROS?)\b/);
    if (lMatch) return parseFloat(lMatch[1].replace(',', '.'));

    const mlMatch = upper.match(/(\d+)\s*ML\b/);
    if (mlMatch) return parseFloat(mlMatch[1]) / 1000;

    if (baseUnit === 'KG') return 1.0;
    return Math.max(0.001, qCom > 0 ? 1.0 : 1.0);
  }

  private inferCategory(desc: string): string {
    const upper = desc.toUpperCase();
    if (/(ARROZ|FEIJAO|MACARRAO|AZEITE|OLEO|FARINHA|ACUCAR|CAFE)/.test(upper)) return 'Mercearia';
    if (/(BANANA|BATATA|TOMATE|CEBOLA|MACA|ALFACE|LIMAO|GRANEL)/.test(upper)) return 'Hortifrúti';
    if (/(CARNE|FRANGO|PEITO|ALCATRA|PATINHO|SUINO|LINGUICA)/.test(upper)) return 'Açougue';
    if (/(LEITE|QUEIJO|MANTEIGA|IOGURTE|REQUEIJAO)/.test(upper)) return 'Laticínios';
    if (/(SABAO|DETERGENTE|AMACIANTE|AGUA SANITARIA|DESINFETANTE)/.test(upper)) return 'Limpeza';
    return 'Geral';
  }

  private async fetchEmbedding(text: string): Promise<number[]> {
    const response = await fetch('[https://api.openai.com/v1/embeddings](https://api.openai.com/v1/embeddings)', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao gerar embedding vetorial: HTTP ${response.status}`);
    }

    const payload = await response.json();
    return payload.data[0].embedding as number[];
  }
}
```

---

## 5. Contratos de API e Manifesto PWA

### 5.1. Web App Manifest (`public/manifest.json`)
```json
{
  "name": "PredictMarket - Previsão de Mercado",
  "short_name": "PredictMarket",
  "description": "Previsão de inflação pessoal e comparador inteligente de supermercados via NFC-e.",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#4F46E5",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "share_target": {
    "action": "/api/receipts/share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

### 5.2. Variáveis de Ambiente Obrigatórias (`.env.example`)
```bash
NEXT_PUBLIC_SUPABASE_URL="[https://seu-projeto.supabase.co](https://seu-projeto.supabase.co)"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI..."
OPENAI_API_KEY="sk-proj-..."
NEXT_PUBLIC_APP_URL="[https://predictmarket.app](https://predictmarket.app)"