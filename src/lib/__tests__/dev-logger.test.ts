import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractErrorDetails,
  formatDevErrorResponse,
  logDevError,
} from '../dev-logger.ts';

describe('Dev Logger and Diagnostic Formatter', () => {
  it('deve extrair detalhes de erro simples', () => {
    const error = new Error('Erro de teste');
    const details = extractErrorDetails(error);

    assert.equal(details.message, 'Erro de teste');
    assert.equal(details.code, undefined);
  });

  it('deve diagnosticar tabela ausente (código 42P01)', () => {
    const error = {
      message: 'relation "users" does not exist',
      code: '42P01',
      detail: 'Table missing',
    };
    const details = extractErrorDetails(error);

    assert.equal(details.code, '42P01');
    assert.match(details.diagnosis ?? '', /não existe no banco de dados/);
  });

  it('deve diagnosticar falha de autenticação (código 28P01)', () => {
    const error = {
      message: 'password authentication failed for user "postgres"',
      code: '28P01',
    };
    const details = extractErrorDetails(error);

    assert.equal(details.code, '28P01');
    assert.match(details.diagnosis ?? '', /DATABASE_URL/);
  });

  it('deve diagnosticar erro de conexão recusada ECONNREFUSED', () => {
    const error = new Error('connect ECONNREFUSED 127.0.0.1:5432');
    const details = extractErrorDetails(error);

    assert.match(details.diagnosis ?? '', /Conexão recusada/);
  });

  it('deve diagnosticar erro de host nao encontrado ENOTFOUND', () => {
    const error = { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND ep-xyz.neon.tech' };
    const details = extractErrorDetails(error);

    assert.match(details.diagnosis ?? '', /Host do PostgreSQL não encontrado/);
  });

  it('deve diagnosticar erro de timeout ETIMEDOUT', () => {
    const error = { code: 'ETIMEDOUT', message: 'Connection timed out' };
    const details = extractErrorDetails(error);

    assert.match(details.diagnosis ?? '', /Tempo limite de conexão excedido/);
  });

  it('deve formatar payload de resposta com diagnóstico em desenvolvimento', () => {
    const originalEnv = process.env.NODE_ENV;
    const env = process.env as Record<string, string | undefined>;
    try {
      env.NODE_ENV = 'development';
      const error = {
        message: 'relation "users" does not exist',
        code: '42P01',
        detail: 'Key error',
      };
      const response = formatDevErrorResponse('Falha padrão', error);

      assert.equal(response.error, 'relation "users" does not exist');
      assert.equal(response.code, '42P01');
      assert.equal(response.detail, 'Key error');
      assert.ok(response.diagnosis);
    } finally {
      env.NODE_ENV = originalEnv;
    }
  });

  it('deve omitir diagnóstico e dados técnicos em produção', () => {
    const originalEnv = process.env.NODE_ENV;
    const env = process.env as Record<string, string | undefined>;
    try {
      env.NODE_ENV = 'production';
      const error = {
        message: 'relation "users" does not exist',
        code: '42P01',
        detail: 'Secret schema data',
      };
      const response = formatDevErrorResponse('Falha padrão', error);

      assert.equal(response.error, 'relation "users" does not exist');
      assert.equal(response.code, undefined);
      assert.equal(response.detail, undefined);
      assert.equal(response.diagnosis, undefined);
    } finally {
      env.NODE_ENV = originalEnv;
    }
  });

  it('não deve emitir log em produção', () => {
    const originalEnv = process.env.NODE_ENV;
    const env = process.env as Record<string, string | undefined>;
    let logged = false;
    const originalError = console.error;
    try {
      env.NODE_ENV = 'production';
      console.error = () => {
        logged = true;
      };
      logDevError('TEST_PROD', new Error('Falha'));
      assert.equal(logged, false);
    } finally {
      console.error = originalError;
      env.NODE_ENV = originalEnv;
    }
  });
});
