import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashToken, createSession } from '@/lib/auth';
import { logDevError } from '@/lib/dev-logger';

interface TokenRow {
  id: string;
  user_id: string | null;
  email: string;
}

interface UserRow {
  id: string;
  email: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  const origin = new URL(request.url).origin;

  if (!token) {
    return NextResponse.redirect(`${origin}/auth/login?error=Token+invalido`);
  }

  try {
    const tokenHash = hashToken(token.trim());

    const tokenRow = await db.queryOne<TokenRow>(
      `
      SELECT id, user_id, email
      FROM auth_tokens
      WHERE token_hash = $1
        AND token_type = 'magic_link'
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [tokenHash]
    );

    if (!tokenRow) {
      return NextResponse.redirect(`${origin}/auth/login?error=Link+magico+expirado+ou+invalido`);
    }

    await db.query('UPDATE auth_tokens SET used_at = NOW() WHERE id = $1', [tokenRow.id]);

    let user = await db.queryOne<UserRow>(
      'SELECT id, email FROM users WHERE email = $1',
      [tokenRow.email]
    );

    if (!user) {
      user = await db.queryOne<UserRow>(
        `
        INSERT INTO users (email, email_verified, full_name, city, state)
        VALUES ($1, true, 'Consumidor', 'Florianópolis', 'SC')
        RETURNING id, email
        `,
        [tokenRow.email]
      );
    } else {
      await db.query('UPDATE users SET email_verified = true WHERE id = $1', [user.id]);
    }

    if (!user) {
      return NextResponse.redirect(`${origin}/auth/login?error=Falha+na+autenticacao`);
    }

    await createSession(user.id);

    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (err: unknown) {
    logDevError('AUTH MAGIC LINK VERIFY ERROR', err);
    return NextResponse.redirect(`${origin}/auth/login?error=Erro+no+processamento`);
  }
}
