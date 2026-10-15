import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';
import { isValidPassword } from '@/lib/validation';

interface SignupRow {
  id: string;
  email: string;
  full_name: string;
  city: string;
  state: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, city, state, maxDistanceKm } = body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          error:
            'A senha deve conter no mínimo 8 dígitos, incluindo pelo menos uma letra maiúscula (A-Z), uma letra minúscula (a-z) e um número (0-9).',
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (existing) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const userCity = typeof city === 'string' && city.trim() ? city.trim() : 'Florianópolis';
    const userState = typeof state === 'string' && state.trim() ? state.trim().toUpperCase() : 'SC';
    const userDistance = typeof maxDistanceKm === 'number' && maxDistanceKm > 0 ? maxDistanceKm : 15.0;
    const userFullName = typeof fullName === 'string' && fullName.trim() ? fullName.trim() : 'Consumidor';

    const row = await db.queryOne<SignupRow>(
      `
      INSERT INTO users (email, password_hash, full_name, city, state, max_distance_km)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, full_name, city, state
      `,
      [cleanEmail, passwordHash, userFullName, userCity, userState, userDistance]
    );

    if (!row) {
      return NextResponse.json({ error: 'Falha ao criar conta' }, { status: 500 });
    }

    try {
      await db.query(
        `
        INSERT INTO profiles (id, full_name, city, state, max_distance_km)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
        `,
        [row.id, userFullName, userCity, userState, userDistance]
      );
    } catch (profileErr: unknown) {
      logDevError('AUTH SIGNUP PROFILE WARNING', profileErr);
    }

    await createSession(row.id);

    sendWelcomeEmail(cleanEmail, userFullName).catch((emailErr: unknown) => {
      logDevError('AUTH SIGNUP EMAIL WARNING', emailErr);
    });

    return NextResponse.json({
      success: true,
      user: {
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        city: row.city,
        state: row.state,
      },
    });
  } catch (err: unknown) {
    logDevError('AUTH SIGNUP ERROR', err);
    const payload = formatDevErrorResponse('Erro interno ao processar cadastro', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
