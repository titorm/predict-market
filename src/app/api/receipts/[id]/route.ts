import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';
import { classifyProductCategorySemantic } from '@/core/categorization/LocalProductCategorizer';

interface ReceiptHeaderRow {
  id: string;
  access_key: string;
  issue_number: string | null;
  series: string | null;
  issued_at: string;
  total_amount: string | number;
  discount_amount: string | number | null;
  net_amount: string | number;
  payment_method: string | null;
  raw_payload: unknown;
  created_at: string;
  store_id: string;
  trade_name: string;
  corporate_name: string | null;
  cnpj: string;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
}

interface ReceiptItemRow {
  id: string;
  canonical_product_id: string | null;
  item_index: number;
  raw_description: string;
  commercial_name: string | null;
  category: string | null;
  standard_unit: string | null;
  quantity: string | number;
  unit_of_measure: string;
  unit_price: string | number;
  total_price: string | number;
  discount_value: string | number | null;
  purchased_at: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const receipt = await db.queryOne<ReceiptHeaderRow>(
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
        r.raw_payload,
        r.created_at,
        s.id AS store_id,
        s.trade_name,
        s.corporate_name,
        s.cnpj,
        s.street,
        s.number,
        s.neighborhood,
        s.city,
        s.state,
        s.postal_code,
        s.latitude,
        s.longitude
      FROM receipts r
      JOIN stores s ON s.id = r.store_id
      WHERE r.id = $1
      `,
      [id]
    );

    if (!receipt) {
      return NextResponse.json(
        { error: 'Nota fiscal não encontrada' },
        { status: 404 }
      );
    }

    const itemsRows = await db.query<ReceiptItemRow>(
      `
      SELECT
        ri.id,
        ri.canonical_product_id,
        ri.item_index,
        ri.raw_description,
        cp.commercial_name,
        cp.category,
        cp.standard_unit,
        ri.quantity,
        ri.unit_of_measure,
        ri.unit_price,
        ri.total_price,
        ri.discount_value,
        ri.purchased_at
      FROM receipt_items ri
      LEFT JOIN canonical_products cp ON cp.id = ri.canonical_product_id
      WHERE ri.receipt_id = $1
      ORDER BY ri.item_index ASC
      `,
      [id]
    );

    const items = itemsRows.map((item) => {
      const baseName = item.commercial_name ?? item.raw_description;
      const classification = classifyProductCategorySemantic(item.raw_description || baseName);
      const resolvedCategory =
        classification.confidence >= 0.75 || !item.category
          ? classification.category
          : item.category;
      const resolvedName =
        item.commercial_name && item.commercial_name.includes('(Cód.')
          ? item.commercial_name
          : classification.normalizedName || baseName;
      return {
        id: item.id,
        canonicalProductId: item.canonical_product_id ?? null,
        itemIndex: item.item_index,
        rawDescription: item.raw_description,
        commercialName: resolvedName,
        category: resolvedCategory,
        standardUnit: item.standard_unit ?? item.unit_of_measure,
        quantity: Number(item.quantity),
        unitOfMeasure: item.unit_of_measure,
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price),
        discountValue: Number(item.discount_value ?? 0),
        purchasedAt: item.purchased_at,
      };
    });

    return NextResponse.json({
      receipt: {
        id: receipt.id,
        accessKey: receipt.access_key,
        issueNumber: receipt.issue_number,
        series: receipt.series,
        issuedAt: receipt.issued_at,
        totalAmount: Number(receipt.total_amount),
        discountAmount: Number(receipt.discount_amount ?? 0),
        netAmount: Number(receipt.net_amount),
        paymentMethod: receipt.payment_method,
        rawPayload: receipt.raw_payload,
        createdAt: receipt.created_at,
      },
      store: {
        id: receipt.store_id,
        name: receipt.trade_name,
        corporateName: receipt.corporate_name,
        cnpj: receipt.cnpj,
        street: receipt.street,
        number: receipt.number,
        neighborhood: receipt.neighborhood,
        city: receipt.city,
        state: receipt.state,
        postalCode: receipt.postal_code,
        latitude: receipt.latitude !== null ? Number(receipt.latitude) : null,
        longitude: receipt.longitude !== null ? Number(receipt.longitude) : null,
      },
      items,
    });
  } catch (err: unknown) {
    logDevError('RECEIPT DETAILS ERROR', err);
    const payload = formatDevErrorResponse('Erro ao buscar detalhes da nota fiscal', err);
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getCurrentUser();
    const targetUserId = sessionUser?.id ?? 'd0000000-0000-0000-0000-000000000001';
    const { id } = await params;

    const receipt = await db.queryOne<{ id: string }>(
      'SELECT id FROM receipts WHERE id = $1 AND (user_id = $2 OR $2 = $3)',
      [id, targetUserId, 'd0000000-0000-0000-0000-000000000001']
    );

    if (!receipt) {
      return NextResponse.json(
        { error: 'Nota fiscal não encontrada ou sem permissão para exclusão' },
        { status: 404 }
      );
    }

    await db.query('DELETE FROM receipts WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Nota fiscal removida com sucesso',
    });
  } catch (err: unknown) {
    logDevError('RECEIPT DELETE ERROR', err);
    const payload = formatDevErrorResponse('Erro ao excluir nota fiscal', err);
    return NextResponse.json(payload, { status: 500 });
  }
}

