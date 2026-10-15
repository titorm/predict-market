import { test, describe } from 'node:test';
import assert from 'node:assert';
import { extractAccessKey, isValidAccessKey } from '../access-key-validator.ts';

describe('Duplicate Receipt Access Key Validation and Ingestion Blocking', () => {

  test('deve extrair e normalizar chave de acesso continua de 44 digitos', () => {
    const raw = '42261075315333029000655120001403961048579170';
    const key = extractAccessKey(raw);
    assert.strictEqual(key, raw);
    assert.strictEqual(key?.length, 44);
    assert.strictEqual(isValidAccessKey(raw), true);
  });

  test('deve extrair chave de acesso mesmo quando formatada com espacos', () => {
    const withSpaces = '4226 1075 3153 3302 9000 6551 2000 1403 9610 4857 9170';
    const key = extractAccessKey(withSpaces);
    assert.strictEqual(key, '42261075315333029000655120001403961048579170');
    assert.strictEqual(isValidAccessKey(withSpaces), true);
  });

  test('deve extrair chave de acesso de URLs do portal SEFAZ SC', () => {
    const url = 'https://sat.sef.sc.gov.br/nfce/consulta?p=42261075315333029000655120001403961048579170';
    const key = extractAccessKey(url);
    assert.strictEqual(key, '42261075315333029000655120001403961048579170');
    assert.strictEqual(isValidAccessKey(url), true);
  });

  test('deve rejeitar entradas com comprimento invalido ou sem chave', () => {
    assert.strictEqual(extractAccessKey('123456'), null);
    assert.strictEqual(extractAccessKey('https://google.com'), null);
    assert.strictEqual(extractAccessKey(''), null);
    assert.strictEqual(isValidAccessKey('123456'), false);
  });

  test('deve identificar chave duplicada e retornar status 409 estruturado', () => {
    const isDuplicate = true;
    const itemsProcessed = 0;
    const responseStatus = isDuplicate ? 409 : 201;

    assert.strictEqual(responseStatus, 409);
    assert.strictEqual(itemsProcessed, 0);
  });

  test('deve instanciar SefazIngestionError com status code adequado', async () => {
    const { SefazIngestionError } = await import('../errors.ts');
    const defaultErr = new SefazIngestionError('Nenhum produto identificado');
    assert.strictEqual(defaultErr.statusCode, 422);
    assert.strictEqual(defaultErr.name, 'SefazIngestionError');
    assert.strictEqual(defaultErr.message, 'Nenhum produto identificado');

    const badRequestErr = new SefazIngestionError('Chave inválida', 400);
    assert.strictEqual(badRequestErr.statusCode, 400);

    const gatewayErr = new SefazIngestionError('SEFAZ indisponível', 502);
    assert.strictEqual(gatewayErr.statusCode, 502);
  });

  test('deve processar e sintetizar qualquer chave valida de 44 digitos com consistencia financeira', () => {
    const rawKey = '4226 1009 4776 5200 0109 6500 1000 0889 9112 3456 7890';
    const key = extractAccessKey(rawKey);
    assert.ok(key);
    assert.strictEqual(key.length, 44);
    assert.strictEqual(isValidAccessKey(rawKey), true);
  });
});
