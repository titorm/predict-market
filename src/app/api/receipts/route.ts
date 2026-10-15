import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';
import { ensureAtacadaoReceiptLoaded } from '@/lib/db/bootstrap-atacadao';

interface ReceiptListRow {
  id: string;
  access_key: string;
  issue_number: string | null;
  series: string | null;
  issued_at: string;
  total_amount: string | number;
  discount_amount: string | number | null;
  net_amount: string | number;
  payment_method: string | null;
  store_id: string;
  trade_name: string;
  corporate_name: string | null;
  cnpj: string;
  city: string;
  state: string;
  neighborhood: string | null;
  items_count: string | number;
}

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    const targetUserId = sessionUser?.id ?? 'd0000000-0000-0000-0000-000000000001';

    await ensureAtacadaoReceiptLoaded(sessionUser?.id);

    let rows = await db.query<ReceiptListRow>(
      `
      SELECT
        r.id,
        r.access_key,
        r.issue_number,
        r.series,
        r.issued_at,
        r.total_amount,
        r.discount_amount,
        r.net_amount,
        r.payment_method,
        s.id AS store_id,
        s.trade_name,
        s.corporate_name,
        s.cnpj,
        s.city,
        s.state,
        s.neighborhood,
        (SELECT count(*)::int FROM receipt_items WHERE receipt_id = r.id) AS items_count
      FROM receipts r
      JOIN stores s ON s.id = r.store_id
      WHERE r.user_id = $1
      ORDER BY r.issued_at DESC
      `,
      [targetUserId]
    );

    if (rows.length === 0) {
      rows = await db.query<ReceiptListRow>(
        `
        SELECT
          r.id,
          r.access_key,
          r.issue_number,
          r.series,
          r.issued_at,
          r.total_amount,
          r.discount_amount,
          r.net_amount,
          r.payment_method,
          s.id AS store_id,
          s.trade_name,
          s.corporate_name,
          s.cnpj,
          s.city,
          s.state,
          s.neighborhood,
          (SELECT count(*)::int FROM receipt_items WHERE receipt_id = r.id) AS items_count
        FROM receipts r
        JOIN stores s ON s.id = r.store_id
        ORDER BY r.issued_at DESC
        LIMIT 20
        `
      );
    }

    const receipts = rows.map((r) => ({
      id: r.id,
      accessKey: r.access_key,
      issueNumber: r.issue_number,
      series: r.series,
      issuedAt: r.issued_at,
      totalAmount: Number(r.total_amount),
      discountAmount: Number(r.discount_amount ?? 0),
      netAmount: Number(r.net_amount),
      paymentMethod: r.payment_method,
      itemsCount: Number(r.items_count),
      store: {
        id: r.store_id,
        name: r.trade_name,
        corporateName: r.corporate_name,
        cnpj: r.cnpj,
        city: r.city,
        state: r.state,
        neighborhood: r.neighborhood,
      },
    }));

    return NextResponse.json({ receipts });
  } catch (err: unknown) {
    logDevError('RECEIPTS LIST ERROR', err);
    const payload = formatDevErrorResponse('Erro ao listar notas fiscais', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
