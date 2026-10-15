import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashToken, hashPassword, createSession } from '@/lib/auth';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';
import { isValidPassword } from '@/lib/validation';

interface TokenRow {
  id: string;
  user_id: string;
  email: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword || typeof token !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'Token e nova senha são obrigatórios' }, { status: 400 });
    }

    if (!isValidPassword(newPassword)) {
      return NextResponse.json(
        {
          error:
            'A nova senha deve conter no mínimo 8 dígitos, incluindo pelo menos uma letra maiúscula (A-Z), uma letra minúscula (a-z) e um número (0-9).',
        },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token.trim());

    const tokenRow = await db.queryOne<TokenRow>(
      `
      SELECT id, user_id, email
      FROM auth_tokens
      WHERE token_hash = $1
        AND token_type = 'password_reset'
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [tokenHash]
    );

    if (!tokenRow || !tokenRow.user_id) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }

    const passwordHash = await hashPassword(newPassword);

    await db.query(
      `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      `,
      [passwordHash, tokenRow.user_id]
    );

    await db.query('UPDATE auth_tokens SET used_at = NOW() WHERE id = $1', [tokenRow.id]);

    await createSession(tokenRow.user_id);

    return NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso',
    });
  } catch (err: unknown) {
    logDevError('AUTH RESET PASSWORD ERROR', err);
    const payload = formatDevErrorResponse('Erro ao redefinir senha', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
