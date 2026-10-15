import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashToken, createSession } from '@/lib/auth';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';

interface TokenRow {
  id: string;
  user_id: string | null;
  email: string;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  city: string;
  state: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp || typeof email !== 'string' || typeof otp !== 'string') {
      return NextResponse.json({ error: 'E-mail e código OTP são obrigatórios' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const tokenHash = hashToken(cleanOtp);

    const tokenRow = await db.queryOne<TokenRow>(
      `
      SELECT id, user_id, email
      FROM auth_tokens
      WHERE email = $1
        AND token_hash = $2
        AND token_type = 'otp'
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [cleanEmail, tokenHash]
    );

    if (!tokenRow) {
      return NextResponse.json({ error: 'Código OTP inválido ou expirado' }, { status: 401 });
    }

    await db.query('UPDATE auth_tokens SET used_at = NOW() WHERE id = $1', [tokenRow.id]);

    let user = await db.queryOne<UserRow>(
      'SELECT id, email, full_name, city, state FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (!user) {
      user = await db.queryOne<UserRow>(
        `
        INSERT INTO users (email, email_verified, full_name, city, state)
        VALUES ($1, true, 'Consumidor', 'Florianópolis', 'SC')
        RETURNING id, email, full_name, city, state
        `,
        [cleanEmail]
      );
    } else {
      await db.query('UPDATE users SET email_verified = true WHERE id = $1', [user.id]);
    }

    if (!user) {
      return NextResponse.json({ error: 'Falha ao autenticar usuário' }, { status: 500 });
    }

    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        city: user.city,
        state: user.state,
      },
    });
  } catch (err: unknown) {
    logDevError('AUTH OTP VERIFY ERROR', err);
    const payload = formatDevErrorResponse('Erro ao validar código OTP', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
