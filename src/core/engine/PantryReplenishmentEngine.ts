export type ReplenishmentStatus = 'DEPLETED' | 'DUE_SOON' | 'STOCKED';

export interface PurchaseEvent {
  purchasedAt: string | Date;
  quantity: number;
  unitPrice: number;
}

export interface ProductReplenishmentInput {
  canonicalProductId: string;
  commercialName: string;
  category: string;
  standardUnit: string;
  estimatedUnitPrice: number;
  purchases: PurchaseEvent[];
}

export interface ReplenishmentRecommendation {
  canonicalProductId: string;
  commercialName: string;
  category: string;
  standardUnit: string;
  estimatedUnitPrice: number;
  status: ReplenishmentStatus;
  urgencyScore: number;
  averageCadenceDays: number;
  cadenceLabel: string;
  daysSinceLastPurchase: number;
  recommendedQuantity: number;
  estimatedRestockCost: number;
  lastPurchaseDate: string;
  dailyConsumptionRate: number;
  daysRemainingEstimate: number;
  reason: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PantryReplenishmentReport {
  referenceDate: string;
  totalProductsAnalyzed: number;
  suggestedItems: ReplenishmentRecommendation[];
  stockedItems: ReplenishmentRecommendation[];
  totalSuggestedCost: number;
  urgentCount: number;
  soonCount: number;
}

interface GroupedDatePurchase {
  date: Date;
  quantity: number;
  unitPrice: number;
}

export class PantryReplenishmentEngine {
  // ALGORITHM: Heuristica de reposicao periodica baseada em cadencia de compra, taxa de consumo e dias transcorridos
  public generateReplenishmentReport(
    products: ProductReplenishmentInput[],
    referenceDate: Date = new Date()
  ): PantryReplenishmentReport {
    const suggestedItems: ReplenishmentRecommendation[] = [];
    const stockedItems: ReplenishmentRecommendation[] = [];

    for (const prod of products) {
      if (!prod.purchases || prod.purchases.length === 0) {
        continue;
      }

      const rec = this.evaluateProduct(prod, referenceDate);
      if (rec.status === 'DEPLETED' || rec.status === 'DUE_SOON') {
        suggestedItems.push(rec);
      } else {
        stockedItems.push(rec);
      }
    }

    suggestedItems.sort((a, b) => {
      if (b.urgencyScore !== a.urgencyScore) {
        return b.urgencyScore - a.urgencyScore;
      }
      return b.daysSinceLastPurchase - a.daysSinceLastPurchase;
    });
    stockedItems.sort((a, b) => a.daysRemainingEstimate - b.daysRemainingEstimate);

    const totalSuggestedCost = suggestedItems.reduce(
      (acc, item) => acc + item.estimatedRestockCost,
      0
    );

    const urgentCount = suggestedItems.filter((i) => i.status === 'DEPLETED').length;
    const soonCount = suggestedItems.filter((i) => i.status === 'DUE_SOON').length;

    return {
      referenceDate: referenceDate.toISOString(),
      totalProductsAnalyzed: products.length,
      suggestedItems,
      stockedItems,
      totalSuggestedCost: Number(totalSuggestedCost.toFixed(2)),
      urgentCount,
      soonCount,
    };
  }

  private evaluateProduct(
    prod: ProductReplenishmentInput,
    referenceDate: Date
  ): ReplenishmentRecommendation {
    const grouped = this.groupPurchasesByCalendarDay(prod.purchases);
    grouped.sort((a, b) => a.date.getTime() - b.date.getTime());

    const lastEvent = grouped[grouped.length - 1]!;
    const msDiff = referenceDate.getTime() - lastEvent.date.getTime();
    const daysSinceLastPurchase = Math.max(0, Math.floor(msDiff / 86400000));

    let averageCadenceDays = 30;
    let averageQuantity = lastEvent.quantity;
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

    if (grouped.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < grouped.length; i++) {
        const prev = grouped[i - 1]!;
        const curr = grouped[i]!;
        const intervalDays = Math.max(1, Math.round((curr.date.getTime() - prev.date.getTime()) / 86400000));
        intervals.push(intervalDays);
      }

      const totalInterval = intervals.reduce((acc, v) => acc + v, 0);
      averageCadenceDays = Math.max(3, Math.round(totalInterval / intervals.length));

      const totalQty = grouped.reduce((acc, v) => acc + v.quantity, 0);
      averageQuantity = totalQty / grouped.length;
      confidence = grouped.length >= 4 ? 'HIGH' : 'MEDIUM';
    } else {
      averageCadenceDays = this.getDefaultCadenceByCategory(prod.category);
      averageQuantity = lastEvent.quantity;
      confidence = 'LOW';
    }

    const recommendedQuantity = this.roundQuantity(averageQuantity, prod.standardUnit);
    const dailyConsumptionRate = Number((recommendedQuantity / averageCadenceDays).toFixed(4));
    const depletionRatio = daysSinceLastPurchase / averageCadenceDays;
    const cadenceLabel = this.getCadenceLabel(averageCadenceDays);

    let status: ReplenishmentStatus = 'STOCKED';
    let urgencyScore = 0;
    let daysRemainingEstimate = 0;
    let reason = '';

    if (depletionRatio >= 1.0) {
      status = 'DEPLETED';
      urgencyScore = Math.min(100, Math.round(depletionRatio * 75));
      daysRemainingEstimate = 0;
      reason = `${cadenceLabel}. Última compra há ${daysSinceLastPurchase} dias. Ciclo esgotado há ${daysSinceLastPurchase - averageCadenceDays} dias.`;
    } else if (depletionRatio >= 0.75) {
      status = 'DUE_SOON';
      urgencyScore = Math.round(depletionRatio * 65);
      daysRemainingEstimate = Math.max(1, averageCadenceDays - daysSinceLastPurchase);
      reason = `${cadenceLabel}. Última compra há ${daysSinceLastPurchase} dias. Restam cerca de ${daysRemainingEstimate} dias de estoque.`;
    } else {
      status = 'STOCKED';
      daysRemainingEstimate = Math.max(1, averageCadenceDays - daysSinceLastPurchase);
      urgencyScore = Math.round(depletionRatio * 30);
      reason = `Abastecido. Ciclo ${cadenceLabel.toLowerCase()}. Restam ~${daysRemainingEstimate} dias de consumo estimado.`;
    }

    const unitPrice = prod.estimatedUnitPrice > 0 ? prod.estimatedUnitPrice : lastEvent.unitPrice;
    const estimatedRestockCost = Number((recommendedQuantity * unitPrice).toFixed(2));

    return {
      canonicalProductId: prod.canonicalProductId,
      commercialName: prod.commercialName,
      category: prod.category || 'Geral',
      standardUnit: prod.standardUnit || 'UN',
      estimatedUnitPrice: unitPrice,
      status,
      urgencyScore,
      averageCadenceDays,
      cadenceLabel,
      daysSinceLastPurchase,
      recommendedQuantity,
      estimatedRestockCost,
      lastPurchaseDate: lastEvent.date.toISOString(),
      dailyConsumptionRate,
      daysRemainingEstimate,
      reason,
      confidence,
    };
  }

  private groupPurchasesByCalendarDay(purchases: PurchaseEvent[]): GroupedDatePurchase[] {
    const map = new Map<string, GroupedDatePurchase>();

    for (const p of purchases) {
      const d = new Date(p.purchasedAt);
      const dayKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const existing = map.get(dayKey);

      if (existing) {
        existing.quantity += Number(p.quantity) || 1;
        if (p.unitPrice > 0) {
          existing.unitPrice = p.unitPrice;
        }
      } else {
        map.set(dayKey, {
          date: d,
          quantity: Number(p.quantity) || 1,
          unitPrice: Number(p.unitPrice) || 0,
        });
      }
    }

    return Array.from(map.values());
  }

  private getDefaultCadenceByCategory(category?: string): number {
    if (!category) return 30;
    const cat = category.toLowerCase();
    if (cat.includes('hortifrúti') || cat.includes('hortifruti') || cat.includes('padaria') || cat.includes('laticín') || cat.includes('acougue') || cat.includes('açougue')) {
      return 10;
    }
    if (cat.includes('limpeza') || cat.includes('higiene') || cat.includes('perfumaria')) {
      return 45;
    }
    return 30;
  }

  private getCadenceLabel(days: number): string {
    if (days <= 10) return `Consumo semanal (~${days} dias)`;
    if (days <= 20) return `Consumo quinzenal (~${days} dias)`;
    if (days <= 40) return `Consumo mensal (~${days} dias)`;
    if (days <= 75) return `Consumo bimestral (~${days} dias)`;
    if (days <= 110) return `Consumo trimestral (~${days} dias)`;
    return `Consumo periódico (~${days} dias)`;
  }

  private roundQuantity(rawQty: number, unit: string): number {
    const u = unit.toUpperCase();
    if (u === 'UN' || u === 'L' || u === 'PCT' || u === 'CX') {
      return Math.max(1, Math.round(rawQty));
    }
    if (u === 'KG') {
      const rounded = Math.round(rawQty * 10) / 10;
      return Math.max(0.5, rounded);
    }
    return Math.max(1, Math.round(rawQty));
  }
}
