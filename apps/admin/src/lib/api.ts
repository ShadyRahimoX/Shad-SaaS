export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getAdminKey(): string | null {
  try {
    return localStorage.getItem('admin_sync_key');
  } catch {
    return null;
  }
}

export async function adminRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const key = getAdminKey();
  if (key) headers['X-Admin-Key'] = key;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    return json as ApiResponse<T>;
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'FETCH_ERROR', message: err.message || 'Network error' },
    };
  }
}

export const adminApi = {
  get: <T>(path: string) => adminRequest<T>(path),
  post: <T>(path: string, body?: any) =>
    adminRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: any) =>
    adminRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T>(path: string) => adminRequest<T>(path, { method: 'DELETE' }),
};
