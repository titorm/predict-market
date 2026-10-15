import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  GroceryForecastEngine,
  BasketItemInput,
  MonthlyPriceStat,
} from '@/core/engine/GroceryForecastEngine';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';
import { ensureAtacadaoReceiptLoaded } from '@/lib/db/bootstrap-atacadao';

interface QueryItemRow {
  canonical_product_id: string;
  store_id: string;
  quantity: string | number;
  unit_price: string | number;
  commercial_name: string;
  gtin_ean: string | null;
  standard_unit: string;
}

interface StatRow {
  canonical_product_id: string;
  month_year: string;
  store_id: string;
  trade_name: string;
  mean_unit_price: string | number;
  min_unit_price: string | number;
  max_unit_price: string | number;
  std_dev_unit_price: string | number | null;
}

interface ProfileRow {
  city: string;
  state: string;
  car_consumption_kml: string | number | null;
  fuel_price_brl: string | number | null;
  max_distance_km: string | number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      receiptId?: string;
      basketId?: string;
      userId?: string;
      transitCostPenaltyBRL?: number;
      customItems?: Array<{
        canonicalProductId: string;
        quantity: number;
      }>;
    };
    const { receiptId, basketId, userId, transitCostPenaltyBRL, customItems } = body;

    await ensureAtacadaoReceiptLoaded(userId);

    let userCity = 'Florianópolis';
    let userState = 'SC';
    let penalty = transitCostPenaltyBRL ?? 35.0;

    if (userId) {
      const profile = await db.queryOne<ProfileRow>(
        'SELECT city, state, car_consumption_kml, fuel_price_brl, max_distance_km FROM profiles WHERE id = $1',
        [userId]
      );

      if (profile) {
        userCity = profile.city || userCity;
        userState = profile.state || userState;
      }
    }

    let itemsToProcess: QueryItemRow[] = [];

    if (customItems && customItems.length > 0) {
      const ids = customItems.map((ci) => ci.canonicalProductId);
      const qtyMap = new Map<string, number>();
      for (const ci of customItems) {
        qtyMap.set(
          ci.canonicalProductId,
          (qtyMap.get(ci.canonicalProductId) ?? 0) + (Number(ci.quantity) || 1)
        );
      }

      const rows = await db.query<Omit<QueryItemRow, 'quantity'>>(
        `
        SELECT
          cp.id AS canonical_product_id,
          COALESCE(
            (SELECT store_id FROM receipt_items WHERE canonical_product_id = cp.id ORDER BY purchased_at DESC LIMIT 1),
            'a0000000-0000-0000-0000-000000000001'
          ) AS store_id,
          COALESCE(
            (SELECT unit_price FROM receipt_items WHERE canonical_product_id = cp.id ORDER BY purchased_at DESC LIMIT 1),
            (SELECT mean_unit_price FROM vw_monthly_product_price_stats WHERE canonical_product_id = cp.id ORDER BY month_year DESC LIMIT 1),
            15.00
          ) AS unit_price,
          cp.commercial_name,
          cp.gtin_ean,
          cp.standard_unit
        FROM canonical_products cp
        WHERE cp.id = ANY($1)
        `,
        [ids]
      );

      itemsToProcess = rows.map((r) => ({
        ...r,
        quantity: qtyMap.get(r.canonical_product_id) ?? 1,
      }));
    } else if (receiptId) {
      itemsToProcess = await db.query<QueryItemRow>(
        `
        SELECT
          ri.canonical_product_id,
          ri.store_id,
          ri.quantity,
          ri.unit_price,
          cp.commercial_name,
          cp.gtin_ean,
          cp.standard_unit
        FROM receipt_items ri
        JOIN canonical_products cp ON cp.id = ri.canonical_product_id
        WHERE ri.receipt_id = $1
        `,
        [receiptId]
      );
    } else if (basketId) {
      itemsToProcess = await db.query<QueryItemRow>(
        `
        SELECT
          bi.canonical_product_id,
          COALESCE(
            (SELECT store_id FROM receipt_items WHERE canonical_product_id = bi.canonical_product_id ORDER BY purchased_at DESC LIMIT 1),
            'a0000000-0000-0000-0000-000000000001'
          ) AS store_id,
          bi.planned_quantity AS quantity,
          COALESCE(
            (SELECT unit_price FROM receipt_items WHERE canonical_product_id = bi.canonical_product_id ORDER BY purchased_at DESC LIMIT 1),
            15.00
          ) AS unit_price,
          cp.commercial_name,
          cp.gtin_ean,
          cp.standard_unit
        FROM basket_items bi
        JOIN canonical_products cp ON cp.id = bi.canonical_product_id
        WHERE bi.basket_id = $1
        `,
        [basketId]
      );
    } else {
      const latestReceipt = await db.queryOne<{ id: string }>(
        'SELECT id FROM receipts ORDER BY issued_at DESC LIMIT 1'
      );

      if (latestReceipt) {
        itemsToProcess = await db.query<QueryItemRow>(
          `
          SELECT
            ri.canonical_product_id,
            ri.store_id,
            ri.quantity,
            ri.unit_price,
            cp.commercial_name,
            cp.gtin_ean,
            cp.standard_unit
          FROM receipt_items ri
          JOIN canonical_products cp ON cp.id = ri.canonical_product_id
          WHERE ri.receipt_id = $1
          `,
          [latestReceipt.id]
        );
      }

      if (itemsToProcess.length === 0) {
        itemsToProcess = await db.query<QueryItemRow>(
          `
          SELECT
            bi.canonical_product_id,
            'a0000000-0000-0000-0000-000000000001' AS store_id,
            bi.planned_quantity AS quantity,
            15.00 AS unit_price,
            cp.commercial_name,
            cp.gtin_ean,
            cp.standard_unit
          FROM basket_items bi
          JOIN canonical_products cp ON cp.id = bi.canonical_product_id
          LIMIT 10
          `
        );
      }
    }

    if (itemsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma cesta ou cupom fiscal cadastrado' },
        { status: 404 }
      );
    }

    const productIds = itemsToProcess.map((i) => i.canonical_product_id);

    const statsData = await db.query<StatRow>(
      `
      SELECT
        v.canonical_product_id,
        v.month_year,
        v.store_id,
        s.trade_name,
        v.mean_unit_price,
        v.min_unit_price,
        v.max_unit_price,
        v.std_dev_unit_price
      FROM vw_monthly_product_price_stats v
      JOIN stores s ON s.id = v.store_id
      WHERE v.canonical_product_id = ANY($1)
        AND LOWER(v.city) = LOWER($2)
        AND UPPER(v.state) = UPPER($3)
      `,
      [productIds, userCity, userState]
    );

    const statsByProduct = new Map<string, MonthlyPriceStat[]>();
    for (const row of statsData) {
      const list = statsByProduct.get(row.canonical_product_id) ?? [];
      const mean = Number(row.mean_unit_price);
      list.push({
        referenceMonth: row.month_year,
        storeId: row.store_id,
        storeName: row.trade_name,
        avgPrice: mean,
        minPrice: Number(row.min_unit_price),
        maxPrice: Number(row.max_unit_price),
        priceVolatilityStddev: Number(row.std_dev_unit_price ?? 0),
        avgPricePerBaseUnit: mean,
      });
      statsByProduct.set(row.canonical_product_id, list);
    }

    const consolidatedMap = new Map<string, BasketItemInput>();
    for (const item of itemsToProcess) {
      const rawUnit = item.standard_unit.toUpperCase();
      const validUnit: 'KG' | 'L' | 'UN' =
        rawUnit === 'KG' || rawUnit === 'L' || rawUnit === 'UN' ? rawUnit : 'UN';
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || 0;

      const existing = consolidatedMap.get(item.canonical_product_id);
      if (existing) {
        const totalQty = existing.quantity + qty;
        const weightedPrice =
          totalQty > 0
            ? (existing.quantity * existing.currentUnitPrice + qty * unitPrice) / totalQty
            : existing.currentUnitPrice;
        existing.quantity = totalQty;
        existing.currentUnitPrice = Math.round(weightedPrice * 100) / 100;
      } else {
        consolidatedMap.set(item.canonical_product_id, {
          canonicalProductId: item.canonical_product_id,
          commercialName: item.commercial_name,
          ean: item.gtin_ean,
          baseUnit: validUnit,
          netMeasure: 1.0,
          quantity: qty,
          currentUnitPrice: unitPrice,
          currentStoreId: item.store_id,
          history: statsByProduct.get(item.canonical_product_id) ?? [],
        });
      }
    }

    const basketInput: BasketItemInput[] = Array.from(consolidatedMap.values());

    const engine = new GroceryForecastEngine();
    const report = engine.generateFullReport(basketInput, penalty);

    return NextResponse.json(report, { status: 200 });
  } catch (err: unknown) {
    logDevError('FORECASTS GENERATE ERROR', err);
    const payload = formatDevErrorResponse('Erro ao calcular previsão', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
