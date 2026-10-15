import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';
import { ensureAtacadaoReceiptLoaded } from '@/lib/db/bootstrap-atacadao';

interface RawStoreRow {
  id: string;
  cnpj: string;
  trade_name: string;
  corporate_name: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  latitude: string | number | null;
  longitude: string | number | null;
}

interface PriceItemRow {
  store_id: string;
  canonical_product_id: string;
  unit_price: string | number;
}

export async function GET(req: NextRequest) {
  try {
    await ensureAtacadaoReceiptLoaded();

    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') ?? 'Florianópolis';
    const state = searchParams.get('state') ?? 'SC';
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const maxDistanceKm = parseFloat(searchParams.get('maxDistanceKm') ?? '15.0') || 15.0;

    const userLat = latParam ? parseFloat(latParam) : null;
    const userLon = lonParam ? parseFloat(lonParam) : null;

    const stores = await db.query<RawStoreRow>(
      `
      SELECT id, cnpj, trade_name, corporate_name, neighborhood, city, state, latitude, longitude
      FROM stores
      WHERE LOWER(city) = LOWER($1) AND UPPER(state) = UPPER($2)
      `,
      [city, state]
    );

    if (stores.length === 0) {
      return NextResponse.json({ stores: [] });
    }

    const storeIds = stores.map((s) => s.id);
    const priceItems = await db.query<PriceItemRow>(
      `
      SELECT store_id, canonical_product_id, unit_price
      FROM receipt_items
      WHERE store_id = ANY($1)
      `,
      [storeIds]
    );

    const pricesByStore = new Map<string, number[]>();
    for (const p of priceItems) {
      const list = pricesByStore.get(p.store_id) ?? [];
      list.push(Number(p.unit_price));
      pricesByStore.set(p.store_id, list);
    }

    const calculateDistance = (
      lat1: number | null,
      lon1: number | null,
      lat2: number | null,
      lon2: number | null
    ): number => {
      if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
        return 0.0;
      }
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c * 10) / 10;
    };

    const results = stores
      .map((store) => {
        const storeLat = store.latitude !== null ? Number(store.latitude) : null;
        const storeLon = store.longitude !== null ? Number(store.longitude) : null;
        const distanceKm =
          userLat && userLon && storeLat && storeLon
            ? calculateDistance(userLat, userLon, storeLat, storeLon)
            : 0.0;

        const prices = pricesByStore.get(store.id) ?? [];
        const totalSample = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) : 0;
        const avgTotal = totalSample > 0 ? Math.round(totalSample * 100) / 100 : 85.0;

        return {
          id: store.id,
          name: store.trade_name,
          neighborhood: store.neighborhood ?? 'Região Central',
          city: store.city,
          state: store.state,
          distanceKm,
          rating: 4.85,
          coveragePct: prices.length > 0 ? Math.min(100, prices.length * 20) : 100,
          total: avgTotal,
        };
      })
      .filter((s) => !userLat || !userLon || s.distanceKm <= maxDistanceKm)
      .sort((a, b) => a.total - b.total);

    const withCheapestBadge = results.map((item, idx) => ({
      ...item,
      isCheapest: idx === 0,
    }));

    return NextResponse.json({ stores: withCheapestBadge });
  } catch (err: unknown) {
    logDevError('REGIONAL STORES ERROR', err);
    const payload = formatDevErrorResponse('Erro ao buscar supermercados', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
