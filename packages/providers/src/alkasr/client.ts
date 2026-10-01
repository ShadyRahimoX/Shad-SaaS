export class AlkasrError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AlkasrError';
  }
}

export async function alkasrFetch<T>(path: string): Promise<T> {
  const token = process.env.ALKASR_API_TOKEN;
  if (!token) {
    throw new AlkasrError('NO_TOKEN', 'ALKASR_API_TOKEN is not set');
  }
  const base = (process.env.ALKASR_API_BASE_URL || 'https://api.alkasr-vip.com').replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${cleanPath}`;
  const res = await fetch(url, {
    headers: {
      'api-token': token,
      'Accept': 'application/json',
    },
  });
  
  const text = await res.text();
  
  if (!res.ok) {
    throw new AlkasrError('HTTP_ERROR', `Alkasr HTTP ${res.status}: ${text}`, res.status);
  }
  
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AlkasrError('PARSE_ERROR', `Invalid JSON from Alkasr: ${text.substring(0, 200)}`);
  }
}
