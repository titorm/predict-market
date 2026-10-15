import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateRandomToken, hashToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', [
      cleanEmail,
    ]);

    if (user) {
      const rawToken = generateRandomToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.query(
        `
        INSERT INTO auth_tokens (user_id, email, token_hash, token_type, expires_at)
        VALUES ($1, $2, $3, 'password_reset', $4)
        `,
        [user.id, cleanEmail, tokenHash, expiresAt]
      );

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:10450';
      const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}`;

      await sendPasswordResetEmail(cleanEmail, resetUrl);
    }

    return NextResponse.json({
      success: true,
      message: 'Se este e-mail estiver cadastrado, enviamos as instruções para redefinição de senha.',
    });
  } catch (err: unknown) {
    logDevError('AUTH FORGOT PASSWORD ERROR', err);
    const payload = formatDevErrorResponse('Erro ao processar recuperação de senha', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
