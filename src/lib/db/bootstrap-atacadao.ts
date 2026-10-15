import { db } from './index';
import { NfceIngestionService } from '@/core/ingestion/NfceIngestionService';
import { ATACADAO_FLORIANOPOLIS_RECEIPT } from '@/core/ingestion/known-receipts';

let bootstrapRun = false;

export async function ensureAtacadaoReceiptLoaded(userId?: string): Promise<string> {
  if (bootstrapRun) return ATACADAO_FLORIANOPOLIS_RECEIPT.accessKey;

  try {
    const targetUserId = userId ?? 'd0000000-0000-0000-0000-000000000001';

    const existing = await db.queryOne<{ id: string; user_id: string }>(
      'SELECT id, user_id FROM receipts WHERE access_key = $1',
      [ATACADAO_FLORIANOPOLIS_RECEIPT.accessKey]
    );

    if (existing) {
      const itemsCount = await db.queryOne<{ count: string }>(
        'SELECT count(*)::text as count FROM receipt_items WHERE receipt_id = $1',
        [existing.id]
      );
      const count = parseInt(itemsCount?.count ?? '0', 10);

      if (count >= 20) {
        if (userId && existing.user_id !== userId) {
          await db.query('UPDATE receipts SET user_id = $1 WHERE id = $2', [userId, existing.id]);
        }
        bootstrapRun = true;
        return existing.id;
      }

      await db.query('DELETE FROM receipts WHERE id = $1', [existing.id]);
    }

    const service = new NfceIngestionService();
    const result = await service.ingestReceipt(
      ATACADAO_FLORIANOPOLIS_RECEIPT.accessKey,
      targetUserId
    );

    bootstrapRun = true;
    return result.receiptId;
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[BOOTSTRAP ATACADAO NOTICE]', err instanceof Error ? err.message : String(err));
    }
    return '';
  }
}
