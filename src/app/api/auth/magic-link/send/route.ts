import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateRandomToken, hashToken } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const user = await db.queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', [
      cleanEmail,
    ]);

    await db.query(
      `
      INSERT INTO auth_tokens (user_id, email, token_hash, token_type, expires_at)
      VALUES ($1, $2, $3, 'magic_link', $4)
      `,
      [user?.id ?? null, cleanEmail, tokenHash, expiresAt]
    );

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:10450';
    const magicLinkUrl = `${appUrl}/api/auth/magic-link/verify?token=${rawToken}`;

    await sendMagicLinkEmail(cleanEmail, magicLinkUrl);

    return NextResponse.json({
      success: true,
      message: 'Link mágico de acesso enviado para o seu e-mail',
    });
  } catch (err: unknown) {
    logDevError('AUTH MAGIC LINK SEND ERROR', err);
    const payload = formatDevErrorResponse('Erro ao enviar link mágico', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
