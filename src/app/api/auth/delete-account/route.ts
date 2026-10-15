import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, destroySession } from '@/lib/auth';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await db.query('DELETE FROM users WHERE id = $1', [user.id]);
    await destroySession();

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logDevError('AUTH DELETE ACCOUNT ERROR', err);
    const payload = formatDevErrorResponse('Erro ao excluir conta', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
