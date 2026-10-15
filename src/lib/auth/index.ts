import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { generateRandomToken } from './security';

import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_DAYS,
  SESSION_REFRESH_INTERVAL_MS,
  getSessionCookieOptions,
} from './session-config';
import type { AuthUser } from './types';

export * from './security';
export * from './types';
export * from './session-config';

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string | null;
  city: string;
  state: string;
  max_distance_km: string | number;
  car_consumption_kml: string | number | null;
  fuel_price_brl: string | number | null;
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = generateRandomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.query(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`,
    [sessionId, userId, expiresAt]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, getSessionCookieOptions(expiresAt));

  return sessionId;
}

export async function refreshSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return false;
    }

    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const updated = await db.queryOne<{ id: string; user_id: string }>(
      `
      UPDATE sessions
      SET expires_at = $1
      WHERE id = $2 AND expires_at > NOW()
      RETURNING id, user_id
      `,
      [newExpiresAt, sessionCookie.value]
    );

    if (!updated) {
      return false;
    }

    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie.value, getSessionCookieOptions(newExpiresAt));

    return true;
  } catch {
    return false;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    try {
      await db.query(`DELETE FROM sessions WHERE id = $1`, [sessionCookie.value]);
    } catch {
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const row = await db.queryOne<UserRow>(
      `
      SELECT
        u.id,
        u.email,
        u.password_hash,
        COALESCE(u.full_name, p.full_name, 'Consumidor') AS full_name,
        COALESCE(u.city, p.city, 'Florianópolis') AS city,
        COALESCE(u.state, p.state, 'SC') AS state,
        COALESCE(u.max_distance_km, p.max_distance_km, 15.0) AS max_distance_km,
        COALESCE(p.car_consumption_kml, 10.5) AS car_consumption_kml,
        COALESCE(p.fuel_price_brl, 5.99) AS fuel_price_brl
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN profiles p ON p.id = u.id
      WHERE s.id = $1 AND s.expires_at > NOW()
      `,
      [sessionCookie.value]
    );

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name || 'Consumidor',
      city: row.city,
      state: row.state,
      max_distance_km: Number(row.max_distance_km),
      car_consumption_kml: Number(row.car_consumption_kml ?? 10.5),
      fuel_price_brl: Number(row.fuel_price_brl ?? 5.99),
    };
  } catch {
    return null;
  }
}
