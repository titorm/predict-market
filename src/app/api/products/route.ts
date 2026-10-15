import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';
import { ensureAtacadaoReceiptLoaded } from '@/lib/db/bootstrap-atacadao';

interface PurchasedProductRow {
  id: string;
  commercial_name: string;
  gtin_ean: string | null;
  category: string | null;
  standard_unit: string;
  purchase_count: string | number;
  last_purchased_at: string;
  min_price: string | number;
  max_price: string | number;
  avg_price: string | number;
  last_price: string | number;
  last_store_name: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    await ensureAtacadaoReceiptLoaded(sessionUser?.id);

    const targetUserId = sessionUser?.id ?? 'd0000000-0000-0000-0000-000000000001';
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() ?? '';
    const category = searchParams.get('category')?.trim() ?? '';

    let rows = await db.query<PurchasedProductRow>(
      `
      SELECT
        cp.id,
        cp.commercial_name,
        cp.gtin_ean,
        cp.category,
        cp.standard_unit,
        COUNT(ri.id)::int AS purchase_count,
        MAX(ri.purchased_at) AS last_purchased_at,
        MIN(ri.unit_price)::numeric(10,2) AS min_price,
        MAX(ri.unit_price)::numeric(10,2) AS max_price,
        ROUND(AVG(ri.unit_price)::numeric, 2) AS avg_price,
        (
          SELECT ri2.unit_price
          FROM receipt_items ri2
          WHERE ri2.canonical_product_id = cp.id
          ORDER BY ri2.purchased_at DESC, ri2.id DESC
          LIMIT 1
        )::numeric(10,2) AS last_price,
        (
          SELECT s.trade_name
          FROM receipt_items ri3
          JOIN stores s ON s.id = ri3.store_id
          WHERE ri3.canonical_product_id = cp.id
          ORDER BY ri3.purchased_at DESC, ri3.id DESC
          LIMIT 1
        ) AS last_store_name
      FROM canonical_products cp
      JOIN receipt_items ri ON ri.canonical_product_id = cp.id
      JOIN receipts r ON r.id = ri.receipt_id
      WHERE r.user_id = $1
      GROUP BY cp.id, cp.commercial_name, cp.gtin_ean, cp.category, cp.standard_unit
      ORDER BY MAX(ri.purchased_at) DESC, COUNT(ri.id) DESC
      `,
      [targetUserId]
    );

    if (rows.length === 0) {
      rows = await db.query<PurchasedProductRow>(
        `
        SELECT
          cp.id,
          cp.commercial_name,
          cp.gtin_ean,
          cp.category,
          cp.standard_unit,
          COUNT(ri.id)::int AS purchase_count,
          MAX(ri.purchased_at) AS last_purchased_at,
          MIN(ri.unit_price)::numeric(10,2) AS min_price,
          MAX(ri.unit_price)::numeric(10,2) AS max_price,
          ROUND(AVG(ri.unit_price)::numeric, 2) AS avg_price,
          (
            SELECT ri2.unit_price
            FROM receipt_items ri2
            WHERE ri2.canonical_product_id = cp.id
            ORDER BY ri2.purchased_at DESC, ri2.id DESC
            LIMIT 1
          )::numeric(10,2) AS last_price,
          (
            SELECT s.trade_name
            FROM receipt_items ri3
            JOIN stores s ON s.id = ri3.store_id
            WHERE ri3.canonical_product_id = cp.id
            ORDER BY ri3.purchased_at DESC, ri3.id DESC
            LIMIT 1
          ) AS last_store_name
        FROM canonical_products cp
        JOIN receipt_items ri ON ri.canonical_product_id = cp.id
        JOIN receipts r ON r.id = ri.receipt_id
        GROUP BY cp.id, cp.commercial_name, cp.gtin_ean, cp.category, cp.standard_unit
        ORDER BY MAX(ri.purchased_at) DESC, COUNT(ri.id) DESC
        LIMIT 200
        `
      );
    }

    let products = rows.map((r) => ({
      id: r.id,
      commercialName: r.commercial_name,
      ean: r.gtin_ean,
      category: r.category ?? 'Geral',
      standardUnit: r.standard_unit,
      purchaseCount: Number(r.purchase_count),
      lastPurchasedAt: r.last_purchased_at,
      minPrice: Number(r.min_price),
      maxPrice: Number(r.max_price),
      avgPrice: Number(r.avg_price),
      lastPrice: Number(r.last_price),
      lastStoreName: r.last_store_name ?? 'Supermercado',
    }));

    if (query) {
      const lower = query.toLowerCase();
      products = products.filter(
        (p) =>
          p.commercialName.toLowerCase().includes(lower) ||
          p.category.toLowerCase().includes(lower) ||
          (p.ean && p.ean.includes(lower))
      );
    }

    if (category && category !== 'Todos') {
      products = products.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    return NextResponse.json({
      products,
      totalCount: products.length,
    });
  } catch (err: unknown) {
    logDevError('PURCHASED PRODUCTS GET ERROR', err);
    const payload = formatDevErrorResponse('Erro ao listar produtos comprados', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
