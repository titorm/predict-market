import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  PantryReplenishmentEngine,
  ProductReplenishmentInput,
} from '@/core/engine/PantryReplenishmentEngine';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';
import { ensureAtacadaoReceiptLoaded } from '@/lib/db/bootstrap-atacadao';

interface ReceiptItemDbRow {
  canonical_product_id: string;
  commercial_name: string;
  category: string | null;
  standard_unit: string | null;
  quantity: string | number;
  unit_price: string | number;
  purchased_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    await ensureAtacadaoReceiptLoaded(sessionUser?.id);

    const targetUserId = sessionUser?.id ?? 'd0000000-0000-0000-0000-000000000001';

    let rows = await db.query<ReceiptItemDbRow>(
      `
      SELECT
        cp.id AS canonical_product_id,
        cp.commercial_name,
        cp.category,
        cp.standard_unit,
        ri.quantity,
        ri.unit_price,
        ri.purchased_at
      FROM receipt_items ri
      JOIN receipts r ON r.id = ri.receipt_id
      JOIN canonical_products cp ON cp.id = ri.canonical_product_id
      WHERE r.user_id = $1
      ORDER BY cp.id, ri.purchased_at ASC
      `,
      [targetUserId]
    );

    if (rows.length === 0) {
      rows = await db.query<ReceiptItemDbRow>(
        `
        SELECT
          cp.id AS canonical_product_id,
          cp.commercial_name,
          cp.category,
          cp.standard_unit,
          ri.quantity,
          ri.unit_price,
          ri.purchased_at
        FROM receipt_items ri
        JOIN receipts r ON r.id = ri.receipt_id
        JOIN canonical_products cp ON cp.id = ri.canonical_product_id
        ORDER BY cp.id, ri.purchased_at ASC
        `
      );
    }

    const productsMap = new Map<string, ProductReplenishmentInput>();

    for (const row of rows) {
      let entry = productsMap.get(row.canonical_product_id);
      if (!entry) {
        entry = {
          canonicalProductId: row.canonical_product_id,
          commercialName: row.commercial_name,
          category: row.category || 'Mercearia',
          standardUnit: row.standard_unit || 'UN',
          estimatedUnitPrice: Number(row.unit_price) || 0,
          purchases: [],
        };
        productsMap.set(row.canonical_product_id, entry);
      }

      entry.purchases.push({
        purchasedAt: row.purchased_at,
        quantity: Number(row.quantity) || 1,
        unitPrice: Number(row.unit_price) || 0,
      });

      if (Number(row.unit_price) > 0) {
        entry.estimatedUnitPrice = Number(row.unit_price);
      }
    }

    const { searchParams } = new URL(req.url);
    const refDateParam = searchParams.get('referenceDate');
    const referenceDate = refDateParam ? new Date(refDateParam) : new Date();

    const engine = new PantryReplenishmentEngine();
    const report = engine.generateReplenishmentReport(
      Array.from(productsMap.values()),
      referenceDate
    );

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: unknown) {
    logDevError('API /api/baskets/smart-suggest GET error', error);
    const payload = formatDevErrorResponse('Falha ao processar sugestões de reposição da despensa', error);
    return NextResponse.json(payload, { status: 500 });
  }
}
