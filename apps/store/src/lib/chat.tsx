import { api, getAccessToken } from './api';

export interface ChatThread {
  id: string;
  userId: string;
  status: 'open' | 'closed';
  lastMessageAt: string | null;
  unreadAdminCount: number;
  unreadUserCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: 'user' | 'admin';
  body: string;
  messageUuid: string;
  readAt: string | null;
  createdAt: string;
}

export interface ThreadWithStats {
  thread: ChatThread;
  lastMessage: ChatMessage | null;
  unreadAdminCount: number;
  unreadUserCount: number;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
}

export const chatApi = {
  getThread: () => api.get<ThreadWithStats>('/api/me/chat/thread'),
  getMessages: (page = 1, limit = 50) =>
    api.get<ChatMessagesResponse>(`/api/me/chat/thread/messages?page=${page}&limit=${limit}`),
  send: (body: string, messageUuid: string) =>
    api.post<{ message: ChatMessage; thread: ChatThread }>('/api/me/chat/thread/messages', {
      body,
      messageUuid,
    }),
  markRead: () => api.post<{ markedCount: number }>('/api/me/chat/thread/messages/read'),
};

// SSE for chat using fetch + ReadableStream (supports Authorization Bearer + cookies)
export function subscribeToChat(
  onMessage: (m: ChatMessage) => void,
  onError?: (e: any) => void
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

      const res = await fetch('/api/me/chat/thread/stream', {
        headers,
        credentials: 'include',
        signal: abortController.signal,
      });

      if (!res.ok || !res.body) {
        if (!isClosed && onError) onError(new Error(`Chat SSE failed: HTTP ${res.status}`));
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
                if (parsed.timestamp && !parsed.body && !parsed.payload) {
                  // Ping event, ignore
                  continue;
                }
                const msg = parsed.payload || parsed;
                if (msg && msg.id && msg.body) {
                  onMessage(msg as ChatMessage);
                }
              }
            } catch {
              // Ignore non-JSON
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
