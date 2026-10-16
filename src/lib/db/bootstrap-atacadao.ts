import { db } from './index';
import { NfceIngestionService } from '@/core/ingestion/NfceIngestionService';
import {
  ATACADAO_FLORIANOPOLIS_RECEIPT,
  ALL_KNOWN_RECEIPTS,
} from '@/core/ingestion/known-receipts';

let bootstrapRun = false;

interface ExistingReceiptStatsRow {
  id: string;
  user_id: string;
  net_amount: string | number;
  discount_amount: string | number;
  items_count: string | number;
  distinct_products_count: string | number;
}

export async function ensureAtacadaoReceiptLoaded(userId?: string): Promise<string> {
  if (bootstrapRun) return ATACADAO_FLORIANOPOLIS_RECEIPT.accessKey;

  try {
    const targetUserId = userId ?? 'd0000000-0000-0000-0000-000000000001';

    await db.query(
      `
      DELETE FROM receipts
      WHERE id IN (
        'e0000000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000002',
        'e0000000-0000-0000-0000-000000000003'
      )
      OR store_id IN (
        SELECT id FROM stores
        WHERE trade_name LIKE 'Supermercado Regional%'
           OR corporate_name = 'COMERCIO VAREJISTA DE ALIMENTOS LTDA'
      )
      `
    );

    const service = new NfceIngestionService();
    let atacadaoReceiptId = '';

    for (const fixture of ALL_KNOWN_RECEIPTS) {
      const existing = await db.queryOne<ExistingReceiptStatsRow>(
        `
        SELECT
          r.id,
          r.user_id,
          r.net_amount,
          r.discount_amount,
          (SELECT count(*)::int FROM receipt_items WHERE receipt_id = r.id) AS items_count,
          (SELECT count(DISTINCT canonical_product_id)::int FROM receipt_items WHERE receipt_id = r.id) AS distinct_products_count
        FROM receipts r
        WHERE r.access_key = $1
        `,
        [fixture.accessKey]
      );

      const expectedDistinctCodes = new Set(
        fixture.items.map((i) => i.storeInternalCode)
      ).size;

      if (existing) {
        const count = Number(existing.items_count);
        const distinctProducts = Number(existing.distinct_products_count);
        const netMatches =
          Math.abs(Number(existing.net_amount) - fixture.netTotal) <= 0.01;
        const discountMatches =
          Math.abs(Number(existing.discount_amount) - fixture.discountTotal) <= 0.01;

        if (
          count === fixture.items.length &&
          distinctProducts === expectedDistinctCodes &&
          netMatches &&
          discountMatches
        ) {
          if (userId && existing.user_id !== userId) {
            await db.query('UPDATE receipts SET user_id = $1 WHERE id = $2', [
              userId,
              existing.id,
            ]);
          }
          if (fixture.accessKey === ATACADAO_FLORIANOPOLIS_RECEIPT.accessKey) {
            atacadaoReceiptId = existing.id;
          }
          continue;
        }

        await db.query('DELETE FROM receipts WHERE id = $1', [existing.id]);
      }

      const result = await service.ingestReceipt(fixture.accessKey, targetUserId);
      if (fixture.accessKey === ATACADAO_FLORIANOPOLIS_RECEIPT.accessKey) {
        atacadaoReceiptId = result.receiptId;
      }
    }

    await db.query(
      `
      DELETE FROM store_product_aliases
      WHERE canonical_product_id NOT IN (
        SELECT DISTINCT canonical_product_id
        FROM receipt_items
        WHERE canonical_product_id IS NOT NULL
      )
      AND canonical_product_id NOT IN (
        SELECT DISTINCT canonical_product_id
        FROM basket_items
      )
      `
    );

    await db.query(
      `
      DELETE FROM canonical_products
      WHERE id NOT IN (
        SELECT DISTINCT canonical_product_id
        FROM receipt_items
        WHERE canonical_product_id IS NOT NULL
      )
      AND id NOT IN (
        SELECT DISTINCT canonical_product_id
        FROM basket_items
      )
      AND id NOT IN (
        SELECT DISTINCT canonical_product_id
        FROM store_product_aliases
      )
      `
    );

    await db.query(
      `
      DELETE FROM stores
      WHERE id NOT IN (SELECT DISTINCT store_id FROM receipts)
        AND id NOT IN (SELECT DISTINCT store_id FROM receipt_items)
      `
    );

    bootstrapRun = true;
    return atacadaoReceiptId;
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[BOOTSTRAP ATACADAO NOTICE]',
        err instanceof Error ? err.message : String(err)
      );
    }
    return '';
  }
}
