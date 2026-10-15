export interface MonthlyPriceStat {
  referenceMonth: string;
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
