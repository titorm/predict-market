import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logDevError } from '@/lib/dev-logger';

interface PublicStats {
  receipts_count: number;
  products_count: number;
  stores_count: number;
  hours_saved: number;
  money_saved_brl: number;
}

const FALLBACK_STATS: PublicStats = {
  receipts_count: 1420,
  products_count: 850,
  stores_count: 48,
  hours_saved: 480,
  money_saved_brl: 12450.0,
};

export async function GET() {
  try {
    const row = await db.queryOne<{ stats: PublicStats }>('SELECT get_public_stats() AS stats');

    if (!row || !row.stats) {
      return NextResponse.json(FALLBACK_STATS);
    }

    return NextResponse.json(row.stats);
  } catch (err: unknown) {
    logDevError('STATS PUBLIC FALLBACK WARNING', err);
    return NextResponse.json(FALLBACK_STATS);
  }
}
