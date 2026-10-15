import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logDevError, formatDevErrorResponse } from '@/lib/dev-logger';

interface ProfileRow {
  id: string;
  full_name: string;
  city: string;
  state: string;
  car_consumption_kml: string | number;
  fuel_price_brl: string | number;
  max_distance_km: string | number;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const row = await db.queryOne<ProfileRow>(
      `
      SELECT
        p.id,
        COALESCE(p.full_name, u.full_name, 'Consumidor') AS full_name,
        COALESCE(p.city, u.city, 'Florianópolis') AS city,
        COALESCE(p.state, u.state, 'SC') AS state,
        COALESCE(p.car_consumption_kml, 10.5) AS car_consumption_kml,
        COALESCE(p.fuel_price_brl, 5.99) AS fuel_price_brl,
        COALESCE(p.max_distance_km, u.max_distance_km, 15.0) AS max_distance_km
      FROM profiles p
      JOIN users u ON u.id = p.id
      WHERE p.id = $1
      `,
      [user.id]
    );

    if (!row) {
      return NextResponse.json({
        profile: {
          id: user.id,
          full_name: user.full_name,
          city: user.city,
          state: user.state,
          car_consumption_kml: user.car_consumption_kml,
          fuel_price_brl: user.fuel_price_brl,
          max_distance_km: user.max_distance_km,
        },
      });
    }

    return NextResponse.json({
      profile: {
        id: row.id,
        full_name: row.full_name,
        city: row.city,
        state: row.state,
        car_consumption_kml: Number(row.car_consumption_kml),
        fuel_price_brl: Number(row.fuel_price_brl),
        max_distance_km: Number(row.max_distance_km),
      },
    });
  } catch (err: unknown) {
    logDevError('PROFILE GET ERROR', err);
    const payload = formatDevErrorResponse('Erro ao carregar perfil', err);
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, city, state, car_consumption_kml, fuel_price_brl, max_distance_km } = body;

    const newFullName = typeof full_name === 'string' && full_name.trim() ? full_name.trim() : user.full_name;
    const newCity = typeof city === 'string' && city.trim() ? city.trim() : user.city;
    const newState = typeof state === 'string' && state.trim() ? state.trim().toUpperCase() : user.state;
    const newConsumption = typeof car_consumption_kml === 'number' && car_consumption_kml > 0 ? car_consumption_kml : user.car_consumption_kml;
    const newFuel = typeof fuel_price_brl === 'number' && fuel_price_brl > 0 ? fuel_price_brl : user.fuel_price_brl;
    const newDistance = typeof max_distance_km === 'number' && max_distance_km > 0 ? max_distance_km : user.max_distance_km;

    await db.query(
      `
      UPDATE users
      SET full_name = $1, city = $2, state = $3, max_distance_km = $4, updated_at = NOW()
      WHERE id = $5
      `,
      [newFullName, newCity, newState, newDistance, user.id]
    );

    await db.query(
      `
      INSERT INTO profiles (id, full_name, city, state, car_consumption_kml, fuel_price_brl, max_distance_km, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        car_consumption_kml = EXCLUDED.car_consumption_kml,
        fuel_price_brl = EXCLUDED.fuel_price_brl,
        max_distance_km = EXCLUDED.max_distance_km,
        updated_at = NOW()
      `,
      [user.id, newFullName, newCity, newState, newConsumption, newFuel, newDistance]
    );

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        full_name: newFullName,
        city: newCity,
        state: newState,
        car_consumption_kml: newConsumption,
        fuel_price_brl: newFuel,
        max_distance_km: newDistance,
      },
    });
  } catch (err: unknown) {
    logDevError('PROFILE PUT ERROR', err);
    const payload = formatDevErrorResponse('Erro ao atualizar perfil', err);
    return NextResponse.json(payload, { status: 500 });
  }
}
