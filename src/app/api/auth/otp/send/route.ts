import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateNumericOtp, hashToken } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpCode = generateNumericOtp();
    const tokenHash = hashToken(otpCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await db.queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', [
      cleanEmail,
    ]);

    await db.query(
      `
      INSERT INTO auth_tokens (user_id, email, token_hash, token_type, expires_at)
      VALUES ($1, $2, $3, 'otp', $4)
      `,
      [user?.id ?? null, cleanEmail, tokenHash, expiresAt]
    );

    await sendOtpEmail(cleanEmail, otpCode);

    return NextResponse.json({
      success: true,
      message: 'Código de 6 dígitos enviado com sucesso para o seu e-mail',
    });
  } catch (err: unknown) {
    logDevError('AUTH OTP SEND ERROR', err);
    const payload = formatDevErrorResponse('Erro ao enviar código OTP', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
