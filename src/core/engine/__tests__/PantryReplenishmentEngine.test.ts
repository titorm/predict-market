import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PantryReplenishmentEngine } from '../PantryReplenishmentEngine.ts';
import type { ProductReplenishmentInput } from '../PantryReplenishmentEngine.ts';

describe('Pantry Replenishment Heuristic Engine', () => {
  const engine = new PantryReplenishmentEngine();

  it('deve identificar item bimestral que nao foi comprado no mes passado e recomendar compra', () => {
    const referenceDate = new Date('2026-10-15T12:00:00Z');

    const riceProduct: ProductReplenishmentInput = {
      canonicalProductId: 'prod-arroz-5kg',
      commercialName: 'Arroz Branco Tipo 1 5kg',
      category: 'Mercearia',
      standardUnit: 'KG',
      estimatedUnitPrice: 28.5,
      purchases: [
        { purchasedAt: '2026-02-01T10:00:00Z', quantity: 5, unitPrice: 25.0 },
        { purchasedAt: '2026-04-02T10:00:00Z', quantity: 5, unitPrice: 26.0 },
        { purchasedAt: '2026-06-03T10:00:00Z', quantity: 5, unitPrice: 27.0 },
        { purchasedAt: '2026-08-05T10:00:00Z', quantity: 5, unitPrice: 28.5 },
      ],
    };

    const report = engine.generateReplenishmentReport([riceProduct], referenceDate);

    assert.strictEqual(report.suggestedItems.length, 1);
    const item = report.suggestedItems[0]!;
    assert.strictEqual(item.status, 'DEPLETED');
    assert.strictEqual(item.recommendedQuantity, 5);
    assert.strictEqual(item.standardUnit, 'KG');
    assert.ok(item.averageCadenceDays >= 58 && item.averageCadenceDays <= 65);
    assert.ok(item.cadenceLabel.includes('bimestral'));
    assert.ok(item.daysSinceLastPurchase >= 70);
    assert.strictEqual(item.estimatedRestockCost, 142.5);
    assert.strictEqual(report.stockedItems.length, 0);
  });

  it('deve marcar item bimestral como abastecido se comprado recentemente', () => {
    const referenceDate = new Date('2026-10-15T12:00:00Z');

    const riceProduct: ProductReplenishmentInput = {
      canonicalProductId: 'prod-arroz-5kg',
      commercialName: 'Arroz Branco Tipo 1 5kg',
      category: 'Mercearia',
      standardUnit: 'KG',
      estimatedUnitPrice: 28.5,
      purchases: [
        { purchasedAt: '2026-06-01T10:00:00Z', quantity: 5, unitPrice: 26.0 },
        { purchasedAt: '2026-08-01T10:00:00Z', quantity: 5, unitPrice: 27.0 },
        { purchasedAt: '2026-10-01T10:00:00Z', quantity: 5, unitPrice: 28.5 },
      ],
    };

    const report = engine.generateReplenishmentReport([riceProduct], referenceDate);

    assert.strictEqual(report.suggestedItems.length, 0);
    assert.strictEqual(report.stockedItems.length, 1);
    const item = report.stockedItems[0]!;
    assert.strictEqual(item.status, 'STOCKED');
    assert.strictEqual(item.daysSinceLastPurchase, 14);
    assert.ok(item.daysRemainingEstimate >= 40);
  });

  it('deve identificar item de consumo mensal regular e sugerir quantidade exata', () => {
    const referenceDate = new Date('2026-10-15T12:00:00Z');

    const tapiocaProduct: ProductReplenishmentInput = {
      canonicalProductId: 'prod-tapioca',
      commercialName: 'Goma de Tapioca Hidratada 500g',
      category: 'Mercearia',
      standardUnit: 'UN',
      estimatedUnitPrice: 7.9,
      purchases: [
        { purchasedAt: '2026-07-10T10:00:00Z', quantity: 5, unitPrice: 7.5 },
        { purchasedAt: '2026-08-11T10:00:00Z', quantity: 5, unitPrice: 7.5 },
        { purchasedAt: '2026-09-10T10:00:00Z', quantity: 5, unitPrice: 7.9 },
      ],
    };

    const report = engine.generateReplenishmentReport([tapiocaProduct], referenceDate);

    assert.strictEqual(report.suggestedItems.length, 1);
    const item = report.suggestedItems[0]!;
    assert.strictEqual(item.status, 'DEPLETED');
    assert.strictEqual(item.recommendedQuantity, 5);
    assert.strictEqual(item.standardUnit, 'UN');
    assert.ok(item.averageCadenceDays >= 29 && item.averageCadenceDays <= 32);
    assert.ok(item.cadenceLabel.includes('mensal'));
    assert.strictEqual(item.daysSinceLastPurchase, 35);
    assert.strictEqual(item.estimatedRestockCost, 39.5);
  });

  it('deve classificar item em estoque baixo como DUE_SOON', () => {
    const referenceDate = new Date('2026-10-15T12:00:00Z');

    const coffeeProduct: ProductReplenishmentInput = {
      canonicalProductId: 'prod-cafe',
      commercialName: 'Café Torrado e Moído 500g',
      category: 'Mercearia',
      standardUnit: 'UN',
      estimatedUnitPrice: 18.0,
      purchases: [
        { purchasedAt: '2026-08-20T10:00:00Z', quantity: 2, unitPrice: 17.5 },
        { purchasedAt: '2026-09-20T10:00:00Z', quantity: 2, unitPrice: 18.0 },
      ],
    };

    const report = engine.generateReplenishmentReport([coffeeProduct], referenceDate);

    assert.strictEqual(report.suggestedItems.length, 1);
    const item = report.suggestedItems[0]!;
    assert.strictEqual(item.status, 'DUE_SOON');
    assert.strictEqual(item.daysSinceLastPurchase, 25);
    assert.strictEqual(item.recommendedQuantity, 2);
    assert.ok(item.daysRemainingEstimate > 0);
  });

  it('deve usar heuristica de categoria para compra unica antiga', () => {
    const referenceDate = new Date('2026-10-15T12:00:00Z');

    const freshProduct: ProductReplenishmentInput = {
      canonicalProductId: 'prod-banana',
      commercialName: 'Banana Prata Kg',
      category: 'Hortifrúti',
      standardUnit: 'KG',
      estimatedUnitPrice: 6.5,
      purchases: [
        { purchasedAt: '2026-09-25T10:00:00Z', quantity: 2.0, unitPrice: 6.5 },
      ],
    };

    const report = engine.generateReplenishmentReport([freshProduct], referenceDate);

    assert.strictEqual(report.suggestedItems.length, 1);
    const item = report.suggestedItems[0]!;
    assert.strictEqual(item.status, 'DEPLETED');
    assert.strictEqual(item.recommendedQuantity, 2.0);
    assert.strictEqual(item.confidence, 'LOW');
  });

  it('deve ordenar sugestoes pela pontuacao de urgencia', () => {
    const referenceDate = new Date('2026-10-15T12:00:00Z');

    const products: ProductReplenishmentInput[] = [
      {
        canonicalProductId: 'p1',
        commercialName: 'Feijão Carioca 1kg',
        category: 'Mercearia',
        standardUnit: 'KG',
        estimatedUnitPrice: 9.0,
        purchases: [
          { purchasedAt: '2026-08-01T10:00:00Z', quantity: 2, unitPrice: 9.0 },
          { purchasedAt: '2026-09-01T10:00:00Z', quantity: 2, unitPrice: 9.0 },
        ],
      },
      {
        canonicalProductId: 'p2',
        commercialName: 'Azeite de Oliva 500ml',
        category: 'Mercearia',
        standardUnit: 'UN',
        estimatedUnitPrice: 42.0,
        purchases: [
          { purchasedAt: '2026-06-01T10:00:00Z', quantity: 1, unitPrice: 40.0 },
          { purchasedAt: '2026-07-01T10:00:00Z', quantity: 1, unitPrice: 42.0 },
        ],
      },
    ];

    const report = engine.generateReplenishmentReport(products, referenceDate);

    assert.strictEqual(report.suggestedItems.length, 2);
    assert.ok(report.suggestedItems[0]!.urgencyScore >= report.suggestedItems[1]!.urgencyScore);
    assert.strictEqual(report.suggestedItems[0]!.canonicalProductId, 'p2');
  });
});
