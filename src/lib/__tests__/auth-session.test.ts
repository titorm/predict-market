import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_DAYS,
  SESSION_REFRESH_INTERVAL_MS,
  getSessionCookieOptions,
} from '../auth/session-config.ts';

describe('Auth Session & Cookie Rolling Refresh', () => {
  it('deve configurar o intervalo de refresh para exatamente 15 minutos', () => {
    assert.equal(SESSION_REFRESH_INTERVAL_MS, 15 * 60 * 1000);
    assert.equal(SESSION_REFRESH_INTERVAL_MS, 900000);
  });

  it('deve usar o nome padrao de cookie de sessao seguro', () => {
    assert.equal(SESSION_COOKIE_NAME, 'pm_session');
  });

  it('deve produzir opcoes de cookie HTTP-only com duracao correta', () => {
    const futureDate = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
    const options = getSessionCookieOptions(futureDate);

    assert.equal(options.httpOnly, true);
    assert.equal(options.sameSite, 'lax');
    assert.equal(options.path, '/');
    assert.equal(options.maxAge, 30 * 24 * 60 * 60);
    assert.equal(options.expires.getTime(), futureDate.getTime());
  });

  it('deve calcular corretamente a expiracao estendida de 30 dias no refresh', () => {
    const now = Date.now();
    const extendedDate = new Date(now + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const diffDays = Math.round((extendedDate.getTime() - now) / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, 30);
  });

  it('deve identificar quando o intervalo de 15 minutos foi atingido para disparar refresh', () => {
    const lastRefresh = Date.now() - 16 * 60 * 1000;
    const elapsed = Date.now() - lastRefresh;

    assert.equal(elapsed >= SESSION_REFRESH_INTERVAL_MS, true);

    const recentRefresh = Date.now() - 5 * 60 * 1000;
    const recentElapsed = Date.now() - recentRefresh;
    assert.equal(recentElapsed >= SESSION_REFRESH_INTERVAL_MS, false);
  });
});
