export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (inMemoryAccessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Includes httpOnly cookies
  };

  try {
    const res = await fetch(url, fetchOptions);

    // Handle 401 and try refresh once (except for auth login/register/refresh endpoints)
    if (res.status === 401 && !path.includes('/api/auth/login') && !path.includes('/api/auth/register') && !path.includes('/api/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newToken = refreshData.data?.accessToken;
            setAccessToken(newToken);
            isRefreshing = false;
            onRefreshed(newToken);

            // Retry original request with new token
            headers.set('Authorization', `Bearer ${newToken}`);
            const retryRes = await fetch(url, { ...fetchOptions, headers });
            const retryJson = await retryRes.json().catch(() => ({ success: false }));
            return retryJson;
          } else {
            // Refresh failed - clear and notify
            setAccessToken(null);
            isRefreshing = false;
            onRefreshed(null);
            return {
              success: false,
              error: { code: 'UNAUTHORIZED', message: 'Session expired. Please log in again.' },
            };
          }
        } catch (err) {
          isRefreshing = false;
          onRefreshed(null);
          return {
            success: false,
            error: { code: 'NETWORK_ERROR', message: 'Network error during session refresh.' },
          };
        }
      } else {
        // Wait for active refresh to complete
        return new Promise((resolve) => {
          refreshSubscribers.push(async (newToken) => {
            if (newToken) {
              headers.set('Authorization', `Bearer ${newToken}`);
              const retryRes = await fetch(url, { ...fetchOptions, headers });
              const retryJson = await retryRes.json().catch(() => ({ success: false }));
              resolve(retryJson);
            } else {
              resolve({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Session expired.' },
              });
            }
          });
        });
      }
    }

    if (res.status === 204) {
      return { success: true };
    }

    const json = await res.json().catch(() => ({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid server response' } }));
    return json;
  } catch (error: any) {
    console.error('API request error:', error);
    return {
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message || 'Failed to connect to server' },
    };
  }
}

export const api = {
  get: <T = any>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T = any>(path: string, body?: any) => request<T>(path, { method: 'POST', body }),
  patch: <T = any>(path: string, body?: any) => request<T>(path, { method: 'PATCH', body }),
  del: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
};
