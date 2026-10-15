import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';

interface ProductRow {
  id: string;
  commercial_name: string;
  gtin_ean: string | null;
  category: string | null;
  standard_unit: string;
}

interface AliasRow {
  store_internal_code: string | null;
  raw_description: string;
  trade_name: string;
}

interface StatRow {
  month_year: string;
  mean_unit_price: string | number;
  min_unit_price: string | number;
  max_unit_price: string | number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const prod = await db.queryOne<ProductRow>(
      `
      SELECT id, commercial_name, gtin_ean, category, standard_unit
      FROM canonical_products
      WHERE id = $1
      `,
      [id]
    );

    if (!prod) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const aliases = await db.query<AliasRow>(
      `
      SELECT spa.store_internal_code, spa.raw_description, s.trade_name
      FROM store_product_aliases spa
      JOIN stores s ON s.id = spa.store_id
      WHERE spa.canonical_product_id = $1
      `,
      [id]
    );

    const history = await db.query<StatRow>(
      `
      SELECT month_year, mean_unit_price, min_unit_price, max_unit_price
      FROM vw_monthly_product_price_stats
      WHERE canonical_product_id = $1
      ORDER BY month_year DESC
      LIMIT 12
      `,
      [id]
    );

    return NextResponse.json({
      product: {
        id: prod.id,
        commercialName: prod.commercial_name,
        ean: prod.gtin_ean,
        category: prod.category,
        baseUnit: prod.standard_unit,
        netMeasure: 1.0,
      },
      aliases: aliases.map((a) => ({
        storeName: a.trade_name,
        rawDesc: a.raw_description,
        rawCode: a.store_internal_code ?? '',
      })),
      history: history.map((h) => ({
        month: h.month_year,
        avg: Number(h.mean_unit_price),
        min: Number(h.min_unit_price),
        max: Number(h.max_unit_price),
      })),
    });
  } catch (err: unknown) {
    logDevError('PRODUCTS GET ERROR', err);
    const payload = formatDevErrorResponse('Erro ao carregar dados do produto', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
