import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';

interface LoginRow {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string | null;
  city: string;
  state: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.queryOne<LoginRow>(
      `
      SELECT id, email, password_hash, full_name, city, state
      FROM users
      WHERE email = $1
      `,
      [cleanEmail]
    );

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
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
    logDevError('AUTH LOGIN ERROR', err);
    const payload = formatDevErrorResponse('Erro interno ao realizar login', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
