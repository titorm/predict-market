import { describe, it } from 'node:test';
import assert from 'node:assert';

interface PurchasedProductItem {
  id: string;
  commercialName: string;
  ean: string | null;
  category: string;
  standardUnit: string;
  purchaseCount: number;
  lastPurchasedAt: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  lastPrice: number;
  lastStoreName: string;
}

function filterAndSortProducts(
  products: PurchasedProductItem[],
  query: string,
  category: string,
  sortBy: 'recent' | 'purchases' | 'price-asc' | 'price-desc' | 'name'
): PurchasedProductItem[] {
  let list = [...products];

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.commercialName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.ean && p.ean.includes(q)) ||
        p.lastStoreName.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'Todos') {
    list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  list.sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.lastPurchasedAt).getTime() - new Date(a.lastPurchasedAt).getTime();
    }
    if (sortBy === 'purchases') {
      return b.purchaseCount - a.purchaseCount;
    }
    if (sortBy === 'price-asc') {
      return a.lastPrice - b.lastPrice;
    }
    if (sortBy === 'price-desc') {
      return b.lastPrice - a.lastPrice;
    }
    return a.commercialName.localeCompare(b.commercialName);
  });

  return list;
}

function calculatePriceVariation(minPrice: number, maxPrice: number): number {
  if (minPrice <= 0 || maxPrice <= minPrice) return 0;
  return Math.round(((maxPrice - minPrice) / minPrice) * 100);
}

describe('Purchased Products Catalog Logic', () => {
  const sampleProducts: PurchasedProductItem[] = [
    {
      id: 'p-1',
      commercialName: 'Arroz Branco Tipo 1 5kg',
      ean: '7891234567890',
      category: 'Mercearia',
      standardUnit: 'KG',
      purchaseCount: 5,
      lastPurchasedAt: '2026-10-10T14:00:00Z',
      minPrice: 24.9,
      maxPrice: 29.9,
      avgPrice: 27.5,
      lastPrice: 28.5,
      lastStoreName: 'Atacadão Estreito',
    },
    {
      id: 'p-2',
      commercialName: 'Banana Prata Kg',
      ean: null,
      category: 'Hortifrúti',
      standardUnit: 'KG',
      purchaseCount: 12,
      lastPurchasedAt: '2026-10-12T10:30:00Z',
      minPrice: 4.99,
      maxPrice: 8.99,
      avgPrice: 6.49,
      lastPrice: 6.99,
      lastStoreName: 'Komprão Rio Vermelho',
    },
    {
      id: 'p-3',
      commercialName: 'Leite Integral UHT 1L',
      ean: '7899876543210',
      category: 'Laticínios',
      standardUnit: 'L',
      purchaseCount: 8,
      lastPurchasedAt: '2026-10-08T09:15:00Z',
      minPrice: 4.29,
      maxPrice: 4.89,
      avgPrice: 4.59,
      lastPrice: 4.49,
      lastStoreName: 'Fort Atacadista',
    },
  ];

  it('deve filtrar produtos por termo de busca no nome comercial', () => {
    const results = filterAndSortProducts(sampleProducts, 'banana', 'Todos', 'recent');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].commercialName, 'Banana Prata Kg');
  });

  it('deve filtrar produtos por código de barras EAN', () => {
    const results = filterAndSortProducts(sampleProducts, '7899876543210', 'Todos', 'recent');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].commercialName, 'Leite Integral UHT 1L');
  });

  it('deve filtrar produtos por categoria específica', () => {
    const results = filterAndSortProducts(sampleProducts, '', 'Mercearia', 'recent');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].category, 'Mercearia');
  });

  it('deve ordenar por mais comprados', () => {
    const results = filterAndSortProducts(sampleProducts, '', 'Todos', 'purchases');
    assert.strictEqual(results[0].commercialName, 'Banana Prata Kg');
    assert.strictEqual(results[0].purchaseCount, 12);
  });

  it('deve ordenar por menor preço', () => {
    const results = filterAndSortProducts(sampleProducts, '', 'Todos', 'price-asc');
    assert.strictEqual(results[0].commercialName, 'Leite Integral UHT 1L');
    assert.strictEqual(results[results.length - 1].commercialName, 'Arroz Branco Tipo 1 5kg');
  });

  it('deve ordenar alfabeticamente pelo nome', () => {
    const results = filterAndSortProducts(sampleProducts, '', 'Todos', 'name');
    assert.strictEqual(results[0].commercialName, 'Arroz Branco Tipo 1 5kg');
    assert.strictEqual(results[1].commercialName, 'Banana Prata Kg');
    assert.strictEqual(results[2].commercialName, 'Leite Integral UHT 1L');
  });

  it('deve calcular a variação percentual de preço corretamente', () => {
    const variationArroz = calculatePriceVariation(24.9, 29.9);
    assert.strictEqual(variationArroz, 20);

    const variationBanana = calculatePriceVariation(4.99, 8.99);
    assert.strictEqual(variationBanana, 80);

    const noVariation = calculatePriceVariation(10.0, 10.0);
    assert.strictEqual(noVariation, 0);
  });
});
