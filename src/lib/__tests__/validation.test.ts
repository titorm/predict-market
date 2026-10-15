import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidEmail,
  isValidPassword,
  isValidOtp,
  calculatePasswordStrength,
} from '../validation.ts';

describe('Form Validation Helpers', () => {
  it('deve validar e-mails corretos e rejeitar formatos invalidos', () => {
    assert.equal(isValidEmail('usuario@dominio.com'), true);
    assert.equal(isValidEmail('teste.dev@sub.dominio.com.br'), true);
    assert.equal(isValidEmail(''), false);
    assert.equal(isValidEmail('sem-arroba.com'), false);
    assert.equal(isValidEmail('sem-dominio@'), false);
    assert.equal(isValidEmail('espacos @dominio.com'), false);
  });

  it('deve validar requisitos de senha de 8 caracteres com maiuscula, minuscula e numero', () => {
    assert.equal(isValidPassword('Senha123'), true);
    assert.equal(isValidPassword('MercadoForte2026!'), true);
    assert.equal(isValidPassword('senha123'), false);
    assert.equal(isValidPassword('SENHA123'), false);
    assert.equal(isValidPassword('SenhaSemNumero'), false);
    assert.equal(isValidPassword('Sen1'), false);
    assert.equal(isValidPassword(''), false);
  });

  it('deve suportar verificacao numerica de comprimento para compatibilidade legado', () => {
    assert.equal(isValidPassword('123456', 6), true);
    assert.equal(isValidPassword('12345', 6), false);
  });

  it('deve calcular forca da senha e niveis com base na entropia e padroes', () => {
    const emptyResult = calculatePasswordStrength('');
    assert.equal(emptyResult.level, 0);
    assert.equal(emptyResult.isValid, false);

    const weakResult = calculatePasswordStrength('123456');
    assert.equal(weakResult.level, 0);
    assert.equal(weakResult.isValid, false);

    const simpleValid = calculatePasswordStrength('Senha123');
    assert.equal(simpleValid.isValid, true);
    assert.equal(simpleValid.hasMinLength, true);
    assert.equal(simpleValid.hasUppercase, true);
    assert.equal(simpleValid.hasLowercase, true);
    assert.equal(simpleValid.hasNumber, true);
    assert.equal(simpleValid.hasRepetitionOrSequence, true);

    const strongResult = calculatePasswordStrength('T9#xP2$wL8!v');
    assert.equal(strongResult.isValid, true);
    assert.equal(strongResult.level, 4);
    assert.equal(strongResult.label, 'Muito forte');
    assert.equal(strongResult.hasSpecialChar, true);
    assert.equal(strongResult.hasRepetitionOrSequence, false);
  });

  it('deve validar codigo OTP de 6 digitos numericos', () => {
    assert.equal(isValidOtp('123456'), true);
    assert.equal(isValidOtp('000000'), true);
    assert.equal(isValidOtp('12345'), false);
    assert.equal(isValidOtp('1234567'), false);
    assert.equal(isValidOtp('12345a'), false);
    assert.equal(isValidOtp(''), false);
  });
});
