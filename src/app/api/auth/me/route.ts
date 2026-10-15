import { NextResponse } from 'next/server';
import { getCurrentUser, refreshSession } from '@/lib/auth';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    await refreshSession();

    return NextResponse.json({ user });
  } catch (err: unknown) {
    logDevError('AUTH ME ERROR', err);
    const payload = formatDevErrorResponse('Erro ao recuperar usuário', err);
    return NextResponse.json({ ...payload, user: null }, { status: 500 });
  }
}
