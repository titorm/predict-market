import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  findKnownReceipt,
  ATACADAO_FLORIANOPOLIS_RECEIPT,
} from '../known-receipts.ts';

describe('Known Receipts Fixture and Registry', () => {
  test('deve localizar cupom do Atacadao por chave continua', () => {
    const fixture = findKnownReceipt('42261075315333029000655120001403961048579170');
    assert.ok(fixture);
    assert.strictEqual(fixture.accessKey, '42261075315333029000655120001403961048579170');
    assert.strictEqual(fixture.store.cnpj, '75315333029000');
    assert.strictEqual(fixture.store.tradeName, 'Atacadão - Florianópolis Estreito');
    assert.strictEqual(fixture.store.city, 'Florianópolis');
    assert.strictEqual(fixture.store.state, 'SC');
  });

  test('deve localizar cupom mesmo com espacos entre digitos', () => {
    const formatted = '4226 1075 3153 3302 9000 6551 2000 1403 9610 4857 9170';
    const fixture = findKnownReceipt(formatted);
    assert.ok(fixture);
    assert.strictEqual(fixture.number, '140396');
    assert.strictEqual(fixture.series, '512');
  });

  test('deve conter exatamente 20 produtos com consistencia financeira', () => {
    assert.strictEqual(ATACADAO_FLORIANOPOLIS_RECEIPT.items.length, 20);

    const sumTotals = ATACADAO_FLORIANOPOLIS_RECEIPT.items.reduce(
      (acc, item) => acc + item.totalPrice,
      0
    );
    const sumDiscounts = ATACADAO_FLORIANOPOLIS_RECEIPT.items.reduce(
      (acc, item) => acc + item.discountValue,
      0
    );

    assert.strictEqual(Math.round(sumTotals * 100) / 100, ATACADAO_FLORIANOPOLIS_RECEIPT.grossTotal);
    assert.strictEqual(ATACADAO_FLORIANOPOLIS_RECEIPT.discountTotal, 9.4);
    assert.strictEqual(
      Math.round((ATACADAO_FLORIANOPOLIS_RECEIPT.grossTotal - ATACADAO_FLORIANOPOLIS_RECEIPT.discountTotal) * 100) / 100,
      ATACADAO_FLORIANOPOLIS_RECEIPT.netTotal
    );
  });

  test('deve validar categorias e unidades de medida dos produtos', () => {
    for (const item of ATACADAO_FLORIANOPOLIS_RECEIPT.items) {
      assert.ok(item.commercialName.length > 0);
      assert.ok(item.category.length > 0);
      assert.ok(item.quantity > 0);
      assert.ok(item.unitPrice > 0);
      assert.ok(['UN', 'KG', 'L'].includes(item.standardUnit));
    }
  });

  test('deve retornar null para chave inexistente', () => {
    const result = findKnownReceipt('00000000000000000000000000000000000000000000');
    assert.strictEqual(result, null);
  });

  test('deve localizar cupom do Komprao Rio Vermelho por chave continua ou com espacos', () => {
    const key = '42261002831172007498651300000764741871511332';
    const formatted = '4226 1002 8311 7200 7498 6513 0000 0764 7418 7151 1332';

    const fixture = findKnownReceipt(key);
    assert.ok(fixture);
    assert.strictEqual(fixture.accessKey, key);
    assert.strictEqual(fixture.number, '76474');
    assert.strictEqual(fixture.series, '130');
    assert.strictEqual(fixture.store.cnpj, '02831172007498');
    assert.strictEqual(fixture.store.tradeName, 'Komprão Koch Atacadista - Rio Vermelho');

    const fixtureFromFormatted = findKnownReceipt(formatted);
    assert.ok(fixtureFromFormatted);
    assert.strictEqual(fixtureFromFormatted.accessKey, key);
  });

  test('deve conter exatamente 52 produtos com consistencia financeira para o Komprao', async () => {
    const { KOMPRAO_RIO_VERMELHO_RECEIPT } = await import('../known-receipts.ts');
    assert.strictEqual(KOMPRAO_RIO_VERMELHO_RECEIPT.items.length, 52);

    const sumTotals = KOMPRAO_RIO_VERMELHO_RECEIPT.items.reduce(
      (acc, item) => acc + item.totalPrice,
      0
    );
    const sumDiscounts = KOMPRAO_RIO_VERMELHO_RECEIPT.items.reduce(
      (acc, item) => acc + item.discountValue,
      0
    );

    assert.strictEqual(Math.round(sumTotals * 100) / 100, KOMPRAO_RIO_VERMELHO_RECEIPT.grossTotal);
    assert.strictEqual(KOMPRAO_RIO_VERMELHO_RECEIPT.grossTotal, 908.1);
    assert.strictEqual(KOMPRAO_RIO_VERMELHO_RECEIPT.discountTotal, 9.4);
    assert.strictEqual(
      Math.round((KOMPRAO_RIO_VERMELHO_RECEIPT.grossTotal - KOMPRAO_RIO_VERMELHO_RECEIPT.discountTotal) * 100) / 100,
      KOMPRAO_RIO_VERMELHO_RECEIPT.netTotal
    );
    assert.strictEqual(KOMPRAO_RIO_VERMELHO_RECEIPT.netTotal, 898.7);
  });
});
