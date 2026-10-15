import { NextResponse } from 'next/server';
import { refreshSession, getCurrentUser } from '@/lib/auth';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';

export async function POST() {
  try {
    const refreshed = await refreshSession();
    if (!refreshed) {
      return NextResponse.json(
        { success: false, authenticated: false, refreshed: false },
        { status: 401 }
      );
    }

    const user = await getCurrentUser();
    return NextResponse.json({
      success: true,
      authenticated: true,
      refreshed: true,
      user,
    });
  } catch (err: unknown) {
    logDevError('AUTH REFRESH ERROR', err);
    const payload = formatDevErrorResponse('Erro ao atualizar sessão', err);
    return NextResponse.json(
      { ...payload, success: false, authenticated: false, refreshed: false },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
