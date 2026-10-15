import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateRandomToken,
  generateNumericOtp,
} from '../security.ts';

describe('Auth Services & Token Security', () => {
  it('deve gerar hash bcrypt seguro e validar senha corretamente', async () => {
    const password = 'MinhaSenhaSegura123!';
    const hash = await hashPassword(password);

    assert.notEqual(hash, password);
    assert.equal(await verifyPassword(password, hash), true);
    assert.equal(await verifyPassword('SenhaIncorreta', hash), false);
  });

  it('deve gerar token aleatório com comprimento correto em hexadecimal', () => {
    const token = generateRandomToken(32);
    assert.equal(token.length, 64);
    assert.match(token, /^[0-9a-f]{64}$/);
  });

  it('deve gerar código OTP numérico de 6 dígitos', () => {
    const otp = generateNumericOtp();
    assert.equal(otp.length, 6);
    assert.match(otp, /^[0-9]{6}$/);
  });

  it('deve computar hash SHA-256 determinístico para tokens e OTPs', () => {
    const token = '123456';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
  });
});
