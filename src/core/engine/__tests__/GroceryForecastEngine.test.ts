import test from 'node:test';
import assert from 'node:assert/strict';
import { GroceryForecastEngine } from '../GroceryForecastEngine.ts';
import type { BasketItemInput } from '../GroceryForecastEngine.ts';

const mockBasket: BasketItemInput[] = [
  {
    canonicalProductId: 'p1',
    commercialName: 'Arroz Branco 5kg',
    ean: '7891234567890',
    baseUnit: 'KG',
    netMeasure: 5.0,
    quantity: 2,
    currentUnitPrice: 30.0,
    currentStoreId: 's1',
    history: [
      {
        referenceMonth: '2026-08-01',
        storeId: 's1',
        storeName: 'Mercado A',
        avgPrice: 28.0,
        minPrice: 27.0,
        maxPrice: 29.0,
        priceVolatilityStddev: 0.5,
        avgPricePerBaseUnit: 5.6,
      },
      {
        referenceMonth: '2026-09-01',
        storeId: 's1',
        storeName: 'Mercado A',
        avgPrice: 29.0,
        minPrice: 28.0,
        maxPrice: 30.0,
        priceVolatilityStddev: 0.5,
        avgPricePerBaseUnit: 5.8,
      },
    ],
  },
  {
    canonicalProductId: 'p2',
    commercialName: 'Feijão Preto 1kg',
    ean: '7891234567891',
    baseUnit: 'KG',
    netMeasure: 1.0,
    quantity: 4,
    currentUnitPrice: 8.0,
    currentStoreId: 's1',
    history: [
      {
        referenceMonth: '2026-08-01',
        storeId: 's2',
        storeName: 'Mercado B',
        avgPrice: 7.0,
        minPrice: 6.5,
        maxPrice: 7.5,
        priceVolatilityStddev: 0.3,
        avgPricePerBaseUnit: 7.0,
      },
      {
        referenceMonth: '2026-09-01',
        storeId: 's2',
        storeName: 'Mercado B',
        avgPrice: 7.5,
        minPrice: 7.0,
        maxPrice: 8.0,
        priceVolatilityStddev: 0.3,
        avgPricePerBaseUnit: 7.5,
      },
    ],
  },
];

test('BR03: Invariante de monotonicidade preditiva (Otimista <= Realista <= Pessimista)', () => {
  const engine = new GroceryForecastEngine();
  const report = engine.generateFullReport(mockBasket, 35.0);

  assert.ok(report.optimisticBasketTotal <= report.realisticBasketTotal);
  assert.ok(report.realisticBasketTotal <= report.pessimisticBasketTotal);

  for (const item of report.items) {
    assert.ok(item.optimisticUnit <= item.realisticUnit);
    assert.ok(item.realisticUnit <= item.pessimisticUnit);
    assert.ok(item.optimisticTotal <= item.realisticTotal);
    assert.ok(item.realisticTotal <= item.pessimisticTotal);
  }
});

test('Cálculo de inflação projetada mensal e não-vazio', () => {
  const engine = new GroceryForecastEngine();
  const report = engine.generateFullReport(mockBasket, 35.0);

  assert.equal(report.items.length, 2);
  assert.equal(report.lastPaidBasketTotal, 2 * 30.0 + 4 * 8.0);
  assert.ok(!Number.isNaN(report.projectedMonthlyInflationPct));
});

test('Rejeição de cesta vazia', () => {
  const engine = new GroceryForecastEngine();
  assert.throws(() => engine.generateFullReport([]), {
    message: /não pode estar vazia/,
  });
});

test('SplitCart: Avaliação correta de split e pedágio', () => {
  const engine = new GroceryForecastEngine();
  const report = engine.generateFullReport(mockBasket, 10.0);

  assert.ok(typeof report.splitCartAnalysis.isWorthSplitting === 'boolean');
  assert.ok(report.splitCartAnalysis.netSavings >= 0);
});
