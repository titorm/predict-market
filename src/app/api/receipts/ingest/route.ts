import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { NfceIngestionService, SefazIngestionError } from '@/core/ingestion/NfceIngestionService';
import { getCurrentUser } from '@/lib/auth';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';

const IngestSchema = z.object({
  qrCodeUrlOrKey: z.string().min(44, 'Informe a URL do QR Code ou os 44 dígitos da NFC-e.'),
  userId: z.string().uuid('ID de usuário inválido.').optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const parsed = IngestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      );
    }

    const sessionUser = await getCurrentUser();
    const targetUserId =
      sessionUser?.id ??
      parsed.data.userId ??
      'd0000000-0000-0000-0000-000000000001';

    const service = new NfceIngestionService(process.env.OPENAI_API_KEY);

    const result = await service.ingestReceipt(
      parsed.data.qrCodeUrlOrKey,
      targetUserId
    );

    const receiptInfo = await db.queryOne<{
      id: string;
      access_key: string;
      trade_name: string;
      total_amount: string | number;
      net_amount: string | number;
      items_count: string | number;
    }>(
      `
      SELECT
        r.id,
        r.access_key,
        s.trade_name,
        r.total_amount,
        r.net_amount,
        (SELECT count(*)::int FROM receipt_items WHERE receipt_id = r.id) as items_count
      FROM receipts r
      JOIN stores s ON s.id = r.store_id
      WHERE r.id = $1
      `,
      [result.receiptId]
    );

    if (result.isDuplicate) {
      return NextResponse.json(
        {
          error: 'Esta chave de acesso já foi adicionada anteriormente. Nova importação bloqueada.',
          isDuplicate: true,
          receiptId: result.receiptId,
          itemsProcessed: 0,
          receipt: receiptInfo
            ? {
                id: receiptInfo.id,
                accessKey: receiptInfo.access_key,
                storeName: receiptInfo.trade_name,
                totalAmount: Number(receiptInfo.total_amount),
                netAmount: Number(receiptInfo.net_amount),
                itemsCount: Number(receiptInfo.items_count),
              }
            : undefined,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        ...result,
        receipt: receiptInfo
          ? {
              id: receiptInfo.id,
              accessKey: receiptInfo.access_key,
              storeName: receiptInfo.trade_name,
              totalAmount: Number(receiptInfo.total_amount),
              netAmount: Number(receiptInfo.net_amount),
              itemsCount: Number(receiptInfo.items_count),
            }
          : undefined,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof SefazIngestionError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }
    logDevError('RECEIPTS INGEST ERROR', err);
    const payload = formatDevErrorResponse('Erro interno ao processar NFC-e', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
