import React, { useEffect, useState, useRef } from 'react';
import { Link, useRoute } from 'wouter';
import {
  ticketsApi,
  type Ticket,
  type TicketMessage,
} from '../lib/tickets';
import { useAuth } from '../lib/auth';
import { formatDate } from '../lib/utils';
import {
  Ticket as TicketIcon,
  Send,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
  Headphones,
  User,
  CheckCircle2,
  XCircle,
  Lock,
} from 'lucide-react';

export const TicketDetail: React.FC = () => {
  const [, params] = useRoute('/tickets/:id');
  const ticketId = params?.id || '';

  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      ticketsApi.get(ticketId),
      ticketsApi.getMessages(ticketId, { page: 1, limit: 100 }),
    ])
      .then(([detailRes, msgRes]) => {
        if (!isMounted) return;
        if (detailRes.success && detailRes.data) {
          setTicket(detailRes.data.ticket);
        } else {
          setError(detailRes.error?.message || 'لم يتم العثور على التذكرة');
        }

        if (msgRes.success && msgRes.data) {
          const sorted = [...msgRes.data.messages].reverse();
          setMessages(sorted);
        }

        // Mark as read
        ticketsApi.markRead(ticketId).catch(() => {});
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'فشل تحميل بيانات التذكرة');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
          setTimeout(() => scrollToBottom('auto'), 100);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text || sending || ticket?.status === 'closed') return;

    setSending(true);
    const messageUuid = crypto.randomUUID();

    // Optimistic message
    const tempMsg: TicketMessage = {
      id: `temp-${Date.now()}`,
      ticketId,
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
      const res = await ticketsApi.send(ticketId, text, messageUuid);
      if (res.success && res.data) {
        const realMsg = res.data.message;
        setMessages((prev) =>
          prev.map((m) => (m.messageUuid === messageUuid ? realMsg : m))
        );
        if (res.data.ticket) setTicket(res.data.ticket);
      }
    } catch (err: any) {
      setError(err.message || 'فشل إرسال الرد');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!confirm('هل أنت متأكد من رغبتك في إغلاق هذه التذكرة؟')) return;
    setClosing(true);
    try {
      const res = await ticketsApi.close(ticketId);
      if (res.success && res.data) {
        setTicket(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'فشل إغلاق التذكرة');
    } finally {
      setClosing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return { label: 'مفتوحة', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case 'in_progress':
        return { label: 'قيد المعالجة', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'awaiting_user':
        return { label: 'بانتظار ردك', class: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
      case 'resolved':
        return { label: 'تم الحل', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'closed':
        return { label: 'مغلقة', class: 'bg-muted text-muted-foreground border-border' };
      default:
        return { label: status, class: 'bg-muted text-muted-foreground border-border' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-bold">جاري تحميل بيانات التذكرة...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 text-center space-y-4" dir="rtl">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
        <h2 className="text-xl font-black">{error || 'التذكرة غير موجودة'}</h2>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للتذاكر</span>
        </Link>
      </div>
    );
  }

  const statusCfg = getStatusBadge(ticket.status);
  const isClosed = ticket.status === 'closed';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" dir="rtl">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة إلى سجل التذاكر</span>
        </Link>
      </div>

      {/* Main Ticket Container */}
      <div className="rounded-3xl bg-card border border-border shadow-xs overflow-hidden flex flex-col h-[78vh]">
        {/* Ticket Header */}
        <div className="p-4 sm:p-6 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-black text-lg text-foreground truncate">
                {ticket.subject}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusCfg.class}`}>
                {statusCfg.label}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="font-bold">القسم: {ticket.category}</span>
              <span>•</span>
              <span className="font-bold">الأولوية: {ticket.priority}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3 h-3" />
                <span>{formatDate(ticket.createdAt)}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          {!isClosed && (
            <button
              type="button"
              onClick={handleCloseTicket}
              disabled={closing}
              className="px-4 py-2 rounded-2xl bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
            >
              {closing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>إغلاق التذكرة</span>
            </button>
          )}
        </div>

        {/* Messages Body */}
        <div
          data-ticket-messages
          className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-muted/5 flex flex-col"
        >
          {messages.length === 0 ? (
            <div className="my-auto text-center space-y-2 p-8 text-xs text-muted-foreground">
              <TicketIcon className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p>تم فتح التذكرة بنجاح. اكتب رسالتك أو استفسارك بالتفصيل أدناه ليتولى الفريق الرد عليك.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.senderRole === 'user';

              return (
                <div
                  key={m.id || m.messageUuid}
                  data-ticket-message={m.id}
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
                      <span className="font-bold">{isUser ? 'أنت' : 'فريق الدعم الفني'}</span>
                      <span dir="ltr">{formatDate(m.createdAt)}</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar or Closed Notice */}
        {isClosed ? (
          <div className="p-4 border-t border-border bg-muted/30 text-center text-xs text-muted-foreground font-bold flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            <span>هذه التذكرة مغلقة حالياً. إذا كانت لديك استفسارات أخرى، يمكنك فتح تذكرة دعم جديدة.</span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-border/80 bg-background flex items-center gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب ردك هنا... (اضغط Enter للإرسال)"
              rows={1}
              disabled={sending}
              className="flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-2xl bg-muted/40 border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-none"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || sending}
              className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-sm hover:opacity-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rotate-180" />}
              <span className="hidden sm:inline">إرسال</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
