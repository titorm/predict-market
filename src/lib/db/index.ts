import { Pool, PoolClient, QueryResultRow } from 'pg';
import { logDevError } from '@/lib/dev-logger';

let poolInstance: Pool | null = null;

function logDatabaseError(
  context: string,
  error: unknown,
  text?: string,
  params?: unknown[]
): void {
  logDevError(`DB ERROR - ${context}`, error, {
    query: text ? text.replace(/\s+/g, ' ').trim() : undefined,
    params,
  });
}

function getPool(): Pool {
  if (!poolInstance) {
    const connectionString =
      process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/postgres';
    const isSsl = connectionString.includes('sslmode=require') || connectionString.includes('neon.tech');

    poolInstance = new Pool({
      connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    poolInstance.on('error', (err: Error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[DB POOL CLIENT ERROR]', err.message);
      }
    });
  }
  return poolInstance;
}

let schemaBootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;

async function bootstrapSchema(): Promise<void> {
  if (schemaBootstrapped) return;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const schemaFile = path.resolve(process.cwd(), 'db/schema.sql');
      if (fs.existsSync(schemaFile)) {
        const sql = fs.readFileSync(schemaFile, 'utf8');
        const pool = getPool();

        try {
          await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
        } catch {
        }

        const sqlWithoutExtension = sql.replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";?/gi, '');
        await pool.query(sqlWithoutExtension);
        schemaBootstrapped = true;
        if (process.env.NODE_ENV !== 'production') {
          console.info('[DB AUTO-SETUP] db/schema.sql executado com sucesso.');
        }
      }
    } catch (setupErr: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[DB AUTO-SETUP WARNING]', setupErr);
      }
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const pool = getPool();
    const res = await pool.query<T>(text, params);
    return res.rows;
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === '42P01') {
      try {
        await bootstrapSchema();
        const pool = getPool();
        const retryRes = await pool.query<T>(text, params);
        return retryRes.rows;
      } catch {
      }
    }
    logDatabaseError('QUERY', error, text, params);
    throw error;
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    logDatabaseError('TRANSACTION', error);
    throw error;
  } finally {
    client.release();
  }
}

export const db = {
  query,
  queryOne,
  transaction,
};
