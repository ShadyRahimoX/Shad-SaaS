import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'wouter';
import {
  chatApi,
  subscribeToChat,
  type ChatMessage,
  type ChatThread,
} from '../lib/chat';
import { useAuth } from '../lib/auth';
import { formatDate } from '../lib/utils';
import {
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Clock,
  ArrowRight,
  Headphones,
  User,
} from 'lucide-react';

export const Chat: React.FC = () => {
  const { user } = useAuth();

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([chatApi.getThread(), chatApi.getMessages(1, 50)])
      .then(([threadRes, msgRes]) => {
        if (!isMounted) return;
        if (threadRes.success && threadRes.data) {
          setThread(threadRes.data.thread);
        }
        if (msgRes.success && msgRes.data) {
          // Messages come from DB sorted by createdAt desc
          const sorted = [...msgRes.data.messages].reverse();
          setMessages(sorted);
          setHasMore(msgRes.data.total > sorted.length);
        }
        // Mark as read
        chatApi.markRead().catch(() => {});
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'فشل جلب محادثة الدعم');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
          setTimeout(() => scrollToBottom('auto'), 100);
        }
      });

    // Subscribe to SSE
    const unsubscribe = subscribeToChat((incomingMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === incomingMsg.id || m.messageUuid === incomingMsg.messageUuid)) {
          return prev;
        }
        return [...prev, incomingMsg];
      });
      setTimeout(() => scrollToBottom('smooth'), 50);
      chatApi.markRead().catch(() => {});
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await chatApi.getMessages(nextPage, 50);
      if (res.success && res.data) {
        const older = [...res.data.messages].reverse();
        setMessages((prev) => [...older, ...prev]);
        setPage(nextPage);
        setHasMore(res.data.total > messages.length + older.length);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text || sending) return;

    setSending(true);
    const messageUuid = crypto.randomUUID();

    // Optimistic message
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      threadId: thread?.id || '',
      senderId: user?.id || '',
      senderRole: 'user',
      body: text,
      messageUuid,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputValue('');
    setTimeout(() => scrollToBottom('smooth'), 30);

    try {
      const res = await chatApi.send(text, messageUuid);
      if (res.success && res.data) {
        const realMsg = res.data.message;
        setMessages((prev) =>
          prev.map((m) => (m.messageUuid === messageUuid ? realMsg : m))
        );
        if (res.data.thread) setThread(res.data.thread);
      }
    } catch (err: any) {
      setError(err.message || 'فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" dir="rtl">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>الرئيسية</span>
        </Link>
      </div>

      {/* Main Chat Container */}
      <div className="rounded-3xl bg-card border border-border shadow-xs overflow-hidden flex flex-col h-[75vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-foreground">الدعم المباشر (Live Chat)</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>متصل الآن</span>
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">نحن هنا للإجابة على جميع استفساراتك ومساعدتك</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tickets"
              className="text-xs font-bold text-primary hover:underline px-3 py-1.5 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              تذاكر الدعم ←
            </Link>
          </div>
        </div>

        {/* Messages Body */}
        <div
          ref={scrollContainerRef}
          data-chat-messages
          className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-muted/5 flex flex-col"
        >
          {loading ? (
            <div className="my-auto flex flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <span className="text-xs font-bold text-muted-foreground">جاري فتح محادثة الدعم...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : messages.length === 0 ? (
            /* Empty State */
            <div className="my-auto text-center space-y-3 p-8 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h3 className="font-black text-foreground text-base">مرحباً بك في خدمة العملاء!</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                فريق خدمة العملاء جاهز لمساعدتك في أي وقت. اكتب رسالتك أدناه وسيجيبك أحد ممثلي الخدمة فوراً.
              </p>
            </div>
          ) : (
            <>
              {hasMore && (
                <div className="text-center pb-2">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-4 py-1.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-bold text-[11px] transition-colors"
                  >
                    {loadingMore ? 'جاري التحميل...' : 'تحميل الرسائل السابقة ↑'}
                  </button>
                </div>
              )}

              {messages.map((m) => {
                const isUser = m.senderRole === 'user';

                return (
                  <div
                    key={m.id || m.messageUuid}
                    data-chat-message={m.id}
                    data-chat-role={m.senderRole}
                    className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted-foreground/20 text-foreground'
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[78%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs space-y-1 ${
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-bl-xs shadow-xs'
                          : 'bg-card border border-border text-foreground rounded-br-xs shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                        <span className="font-bold">{isUser ? 'أنت' : 'فريق الدعم'}</span>
                        <span dir="ltr">{formatDate(m.createdAt)}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-border/80 bg-background flex items-center gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك هنا... (اضغط Enter للإرسال)"
            rows={1}
            disabled={sending || thread?.status === 'closed'}
            className="flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-2xl bg-muted/40 border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-none"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || sending || thread?.status === 'closed'}
            className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-sm hover:opacity-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rotate-180" />}
            <span className="hidden sm:inline">إرسال</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
