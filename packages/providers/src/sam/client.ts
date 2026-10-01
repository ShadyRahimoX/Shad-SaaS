export class SamError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'SamError';
  }
}

interface SamFetchOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  useAuth?: boolean;
  usePayBase?: boolean;  // for /pay/* endpoints (no /api prefix, no auth)
}

export async function samFetch<T>(
  path: string,
  options: SamFetchOptions = {}
): Promise<T> {
  const { method = 'GET', body, useAuth = true, usePayBase = false } = options;

  const apiKey = process.env.SAM_API_KEY;
  const apiBase = process.env.SAM_API_BASE_URL || 'https://www.sam-api.pro/api';
  const payBase = 'https://www.sam-api.pro';

  if (useAuth && !apiKey) {
    throw new SamError('MISSING_API_KEY', 'SAM_API_KEY is not set');
  }

  const baseUrl = usePayBase ? payBase : apiBase;
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (useAuth && apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();

  // Parse
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    throw new SamError('PARSE_ERROR', `Invalid JSON from SAM: ${text.substring(0, 200)}`, res.status);
  }

  if (!res.ok) {
    const code = parsed?.code || `HTTP_${res.status}`;
    const message = parsed?.message || `SAM HTTP ${res.status}`;
    throw new SamError(code, message, res.status);
  }

  return parsed as T;
}
