import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getAccessToken } from './api';
import { useAuth } from './auth';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.unreadOnly !== undefined) q.set('unreadOnly', String(params.unreadOnly));
    const qs = q.toString();
    return api.get<NotificationsListResponse>(`/api/me/notifications${qs ? `?${qs}` : ''}`);
  },
  getUnreadCount: () => api.get<UnreadCountResponse>('/api/me/notifications/unread-count'),
  markAsRead: (id: string) => api.post<Notification>(`/api/me/notifications/${id}/read`),
  markAllAsRead: () => api.post<{ updatedCount: number }>('/api/me/notifications/read-all'),
  remove: (id: string) => api.del<{ id: string; deleted: boolean }>(`/api/me/notifications/${id}`),
};

// SSE subscription using fetch + ReadableStream (supports Authorization Bearer + cookies)
export function subscribeToNotifications(
  onNotification: (n: Notification) => void,
  onError?: (err: any) => void
): () => void {
  const abortController = new AbortController();
  let isClosed = false;

  const startStream = async () => {
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        Accept: 'text/event-stream',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/me/notifications/stream', {
        headers,
        credentials: 'include',
        signal: abortController.signal,
      });

      if (!res.ok || !res.body) {
        if (!isClosed && onError) onError(new Error(`SSE connection failed: HTTP ${res.status}`));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!isClosed) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed && typeof parsed === 'object') {
                if (parsed.timestamp && !parsed.title) {
                  // Ping event, ignore
                  continue;
                }
                const notif = parsed.payload || parsed;
                if (notif && notif.id && notif.title) {
                  onNotification(notif as Notification);
                }
              }
            } catch {
              // Non-JSON message, ignore
            }
          }
        }
      }
    } catch (err: any) {
      if (!isClosed && err.name !== 'AbortError') {
        if (onError) onError(err);
      }
    }
  };

  startStream();

  return () => {
    isClosed = true;
    abortController.abort();
  };
}

interface NotificationsContextValue {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  refreshUnreadCount: () => Promise<void>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  latestNotification: Notification | null;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await notificationsApi.getUnreadCount();
      if (res.success && res.data) {
        setUnreadCount(res.data.count);
      }
    } catch {
      // Ignore network failures
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      setLatestNotification(null);
      return;
    }

    refreshUnreadCount();

    // Subscribe to SSE stream
    const unsubscribe = subscribeToNotifications((newNotif) => {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [newNotif, ...prev]);
      setLatestNotification(newNotif);
    });

    return () => {
      unsubscribe();
    };
  }, [user, refreshUnreadCount]);

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        refreshUnreadCount,
        notifications,
        setNotifications,
        latestNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return ctx;
}
