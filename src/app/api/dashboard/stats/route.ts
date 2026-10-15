import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';
import { ensureAtacadaoReceiptLoaded } from '@/lib/db/bootstrap-atacadao';

interface SummaryRow {
  receipts_count: string | number;
  total_spent: string | number;
  total_saved: string | number;
  last_receipt_date: string | null;
}

interface ProductCountRow {
  products_count: string | number;
}

interface BasketCountRow {
  baskets_count: string | number;
}

interface TopStoreRow {
  store_id: string;
  store_name: string;
  city: string;
  receipts_count: string | number;
  total_spent: string | number;
}

interface MonthlyTrendRow {
  month_key: string;
  spent: string | number;
  savings: string | number;
}

interface CategoryRow {
  category: string;
  items_count: string | number;
  total_spent: string | number;
}

interface RecentReceiptRow {
  id: string;
  store_name: string;
  city: string;
  issued_at: string;
  total_amount: string | number;
  items_count: string | number;
}

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    const targetUserId = sessionUser?.id ?? 'd0000000-0000-0000-0000-000000000001';

    await ensureAtacadaoReceiptLoaded(sessionUser?.id);

    const summaryRows = await db.query<SummaryRow>(
      `
      SELECT
        COUNT(*)::int AS receipts_count,
        COALESCE(SUM(net_amount), 0)::numeric(12,2) AS total_spent,
        COALESCE(SUM(discount_amount), 0)::numeric(12,2) AS total_saved,
        MAX(issued_at) AS last_receipt_date
      FROM receipts
      WHERE user_id = $1
      `,
      [targetUserId]
    );

    const receiptsCount = Number(summaryRows[0]?.receipts_count ?? 0);
    const totalSpent = Number(summaryRows[0]?.total_spent ?? 0);
    const totalSavedBRL = Number(summaryRows[0]?.total_saved ?? 0);
    const lastReceiptDate = summaryRows[0]?.last_receipt_date ?? null;

    const productsRows = await db.query<ProductCountRow>(
      `
      SELECT COUNT(DISTINCT ri.canonical_product_id)::int AS products_count
      FROM receipt_items ri
      JOIN receipts r ON r.id = ri.receipt_id
      WHERE r.user_id = $1
      `,
      [targetUserId]
    );
    const productsCount = Number(productsRows[0]?.products_count ?? 0);

    const basketsRows = await db.query<BasketCountRow>(
      `SELECT COUNT(*)::int AS baskets_count FROM baskets WHERE user_id = $1`,
      [targetUserId]
    );
    const basketsCount = Number(basketsRows[0]?.baskets_count ?? 0);

    const topStores = await db.query<TopStoreRow>(
      `
      SELECT
        s.id AS store_id,
        s.trade_name AS store_name,
        s.city,
        COUNT(r.id)::int AS receipts_count,
        COALESCE(SUM(r.net_amount), 0)::numeric(12,2) AS total_spent
      FROM receipts r
      JOIN stores s ON s.id = r.store_id
      WHERE r.user_id = $1
      GROUP BY s.id, s.trade_name, s.city
      ORDER BY total_spent DESC
      LIMIT 5
      `,
      [targetUserId]
    );

    const monthlyTrends = await db.query<MonthlyTrendRow>(
      `
      SELECT
        TO_CHAR(r.issued_at, 'YYYY-MM') AS month_key,
        COALESCE(SUM(r.net_amount), 0)::numeric(12,2) AS spent,
        COALESCE(SUM(r.discount_amount), 0)::numeric(12,2) AS savings
      FROM receipts r
      WHERE r.user_id = $1
      GROUP BY TO_CHAR(r.issued_at, 'YYYY-MM')
      ORDER BY month_key ASC
      LIMIT 6
      `,
      [targetUserId]
    );

    const topCategories = await db.query<CategoryRow>(
      `
      SELECT
        COALESCE(cp.category, 'Geral') AS category,
        COUNT(ri.id)::int AS items_count,
        COALESCE(SUM(ri.total_price), 0)::numeric(12,2) AS total_spent
      FROM receipt_items ri
      JOIN receipts r ON r.id = ri.receipt_id
      LEFT JOIN canonical_products cp ON cp.id = ri.canonical_product_id
      WHERE r.user_id = $1
      GROUP BY COALESCE(cp.category, 'Geral')
      ORDER BY total_spent DESC
      LIMIT 6
      `,
      [targetUserId]
    );

    const recentReceipts = await db.query<RecentReceiptRow>(
      `
      SELECT
        r.id,
        s.trade_name AS store_name,
        s.city,
        r.issued_at,
        r.net_amount AS total_amount,
        (SELECT count(*)::int FROM receipt_items WHERE receipt_id = r.id) AS items_count
      FROM receipts r
      JOIN stores s ON s.id = r.store_id
      WHERE r.user_id = $1
      ORDER BY r.issued_at DESC
      LIMIT 5
      `,
      [targetUserId]
    );

    return NextResponse.json({
      success: true,
      stats: {
        receiptsCount,
        basketsCount,
        totalSavedBRL,
        productsCount,
        totalSpentBRL: totalSpent,
        lastReceiptDate,
        monthlyTrends: monthlyTrends.map((t) => ({
          month: t.month_key,
          spent: Number(t.spent),
          savings: Number(t.savings),
        })),
        topStores: topStores.map((s) => ({
          storeId: s.store_id,
          storeName: s.store_name,
          city: s.city,
          receiptsCount: Number(s.receipts_count),
          totalSpent: Number(s.total_spent),
        })),
        topCategories: topCategories.map((c) => ({
          category: c.category,
          itemsCount: Number(c.items_count),
          totalSpent: Number(c.total_spent),
        })),
        recentReceipts: recentReceipts.map((r) => ({
          id: r.id,
          storeName: r.store_name,
          city: r.city,
          issuedAt: r.issued_at,
          totalAmount: Number(r.total_amount),
          itemsCount: Number(r.items_count),
        })),
      },
    });
  } catch (err: unknown) {
    logDevError('DASHBOARD STATS GET ERROR', err);
    const payload = formatDevErrorResponse('Erro ao carregar estatísticas do dashboard', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
