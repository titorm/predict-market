export interface ApiResponsePayload {
  error?: string;
  code?: string;
  detail?: string;
  hint?: string;
  diagnosis?: string;
  [key: string]: unknown;
}

export interface ParsedApiResponse<T = ApiResponsePayload> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  rawText: string;
}

export async function parseApiResponse<T = ApiResponsePayload>(
  res: Response
): Promise<ParsedApiResponse<T>> {
  const rawText = await res.text();
  let data: T;

  try {
    data = rawText ? (JSON.parse(rawText) as T) : ({} as T);
  } catch {
    const fallbackSnippet = rawText.trim().slice(0, 300);
    const fallbackError = fallbackSnippet || res.statusText || `Erro na requisição (${res.status})`;
    data = { error: fallbackError } as T;
  }

  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    data,
    rawText,
  };
}
