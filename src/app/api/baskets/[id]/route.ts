import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';

interface BasketRow {
  id: string;
  name: string;
  target_cadence_days: number;
}

interface BasketItemRow {
  id: string;
  canonical_product_id: string;
  planned_quantity: string | number;
  unit_of_measure: string;
  commercial_name: string;
  gtin_ean: string | null;
  category: string | null;
  standard_unit: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const basket = await db.queryOne<BasketRow>(
      'SELECT id, name, target_cadence_days FROM baskets WHERE id = $1',
      [id]
    );

    if (!basket) {
      return NextResponse.json({ error: 'Cesta não encontrada' }, { status: 404 });
    }

    const items = await db.query<BasketItemRow>(
      `
      SELECT
        bi.id,
        bi.canonical_product_id,
        bi.planned_quantity,
        bi.unit_of_measure,
        cp.commercial_name,
        cp.gtin_ean,
        cp.category,
        cp.standard_unit
      FROM basket_items bi
      JOIN canonical_products cp ON cp.id = bi.canonical_product_id
      WHERE bi.basket_id = $1
      `,
      [id]
    );

    return NextResponse.json({
      basket,
      items: items.map((i) => ({
        id: i.id,
        canonicalProductId: i.canonical_product_id,
        quantity: Number(i.planned_quantity),
        unit: i.unit_of_measure,
        commercialName: i.commercial_name,
        ean: i.gtin_ean,
        category: i.category,
      })),
    });
  } catch (err: unknown) {
    logDevError('BASKETS GET ERROR', err);
    const payload = formatDevErrorResponse('Erro ao buscar cesta', err);
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, items } = body as {
      name?: string;
      items?: Array<{ canonicalProductId: string; quantity: number }>;
    };

    if (name) {
      await db.query(
        'UPDATE baskets SET name = $1, updated_at = NOW() WHERE id = $2',
        [name, id]
      );
    }

    if (Array.isArray(items)) {
      for (const item of items) {
        await db.query(
          `
          UPDATE basket_items
          SET planned_quantity = $1
          WHERE basket_id = $2 AND canonical_product_id = $3
          `,
          [item.quantity, id, item.canonicalProductId]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logDevError('BASKETS PUT ERROR', err);
    const payload = formatDevErrorResponse('Erro ao atualizar cesta', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
