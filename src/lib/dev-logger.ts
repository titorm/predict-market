export interface DevErrorDetails {
  message: string;
  code?: string;
  detail?: string;
  hint?: string;
  table?: string;
  constraint?: string;
  stack?: string;
  diagnosis?: string;
}

export function extractErrorDetails(error: unknown): DevErrorDetails {
  if (typeof error === 'object' && error !== null) {
    const err = error as {
      message?: unknown;
      code?: unknown;
      detail?: unknown;
      hint?: unknown;
      table?: unknown;
      constraint?: unknown;
      stack?: unknown;
    };

    const message = typeof err.message === 'string' ? err.message : 'Unknown error';
    const code = typeof err.code === 'string' ? err.code : undefined;
    const detail = typeof err.detail === 'string' ? err.detail : undefined;
    const hint = typeof err.hint === 'string' ? err.hint : undefined;
    const table = typeof err.table === 'string' ? err.table : undefined;
    const constraint = typeof err.constraint === 'string' ? err.constraint : undefined;
    const stack = typeof err.stack === 'string' ? err.stack : undefined;

    let diagnosis: string | undefined;
    if (code === '42P01') {
      diagnosis = 'A tabela informada não existe no banco de dados. Execute db/schema.sql no PostgreSQL ou Neon.';
    } else if (code === '23505') {
      diagnosis = 'Registro duplicado. Violação de restrição de unicidade.';
    } else if (code === '28P01' || message.includes('password authentication failed')) {
      diagnosis = 'Falha de autenticação no PostgreSQL. Verifique usuário e senha da DATABASE_URL.';
    } else if (code === '3D000') {
      diagnosis = 'O banco de dados configurado não existe no PostgreSQL.';
    } else if (code === 'ECONNREFUSED' || message.includes('ECONNREFUSED')) {
      diagnosis = 'Conexão recusada pelo PostgreSQL. Inicie o serviço local ou verifique o host e porta 5432.';
    } else if (code === 'ENOTFOUND' || message.includes('ENOTFOUND')) {
      diagnosis = 'Host do PostgreSQL não encontrado. Verifique o host da DATABASE_URL.';
    } else if (code === 'ETIMEDOUT' || message.includes('ETIMEDOUT')) {
      diagnosis = 'Tempo limite de conexão excedido ao conectar ao PostgreSQL ou Neon.';
    }

    return {
      message,
      code,
      detail,
      hint,
      table,
      constraint,
      stack,
      diagnosis,
    };
  }

  return {
    message: String(error),
  };
}

export function logDevError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const details = extractErrorDetails(error);
  console.error(`[${context}]`, {
    ...details,
    ...extra,
  });
}

export function formatDevErrorResponse(
  fallbackMessage: string,
  error: unknown
): {
  error: string;
  code?: string;
  detail?: string;
  hint?: string;
  diagnosis?: string;
} {
  const details = extractErrorDetails(error);
  const baseMessage = details.message || fallbackMessage;

  if (process.env.NODE_ENV === 'production') {
    return { error: baseMessage };
  }

  return {
    error: baseMessage,
    code: details.code,
    detail: details.detail,
    hint: details.hint,
    diagnosis: details.diagnosis,
  };
}
