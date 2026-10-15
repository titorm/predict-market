export const SESSION_COOKIE_NAME = 'pm_session';
export const SESSION_DURATION_DAYS = 30;
export const SESSION_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

export interface SessionCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
  expires: Date;
}

export function getSessionCookieOptions(expiresAt: Date): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    expires: expiresAt,
  };
}
