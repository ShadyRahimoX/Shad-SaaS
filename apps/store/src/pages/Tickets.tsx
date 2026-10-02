import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ticketsApi,
  type Ticket,
} from '../lib/tickets';
import { formatDate } from '../lib/utils';
import {
  Ticket as TicketIcon,
  PlusCircle,
  Filter,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  HelpCircle,
  X,
  Send,
  ChevronRight,
} from 'lucide-react';

export const Tickets: React.FC = () => {
  const [, setLocation] = useLocation();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // New Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'billing' | 'technical' | 'feature_request' | 'other'>('technical');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchTickets = async (targetPage: number, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await ticketsApi.list({
        page: targetPage,
        limit: 15,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (res.success && res.data) {
        const data = res.data;
        if (append) {
          setTickets((prev) => [...prev, ...data.tickets]);
        } else {
          setTickets(data.tickets);
        }
        setTotal(data.total);
        setHasMore(targetPage * 15 < data.total);
      } else {
        setError(res.error?.message || 'فشل جلب قائمة التذاكر');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchTickets(1, false);
  }, [statusFilter]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTickets(nextPage, true);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || subject.trim().length < 3) {
      setCreateError('عنوان التذكرة يجب أن يكون بين 3 و 200 حرف');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const res = await ticketsApi.create({
        subject: subject.trim(),
        category,
        priority,
      });

      if (res.success && res.data?.id) {
        setIsModalOpen(false);
        setSubject('');
        setLocation(`/tickets/${res.data.id}`);
      } else {
        setCreateError(res.error?.message || 'فشل إنشاء التذكرة');
      }
    } catch (err: any) {
      setCreateError(err.message || 'حدث خطأ أثناء إنشاء التذكرة');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return {
          label: 'مفتوحة',
          badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
      case 'in_progress':
        return {
          label: 'قيد المعالجة',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'awaiting_user':
        return {
          label: 'بانتظار ردك',
          badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        };
      case 'resolved':
        return {
          label: 'تم الحل',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'closed':
        return {
          label: 'مغلقة',
          badgeClass: 'bg-muted text-muted-foreground border-border',
        };
      default:
        return {
          label: status,
          badgeClass: 'bg-muted text-muted-foreground border-border',
        };
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'billing':
        return 'المدفوعات والرصيد';
      case 'technical':
        return 'دعم فني وتقني';
      case 'feature_request':
        return 'اقتراح ميزة';
      default:
        return 'أخرى / عام';
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return { label: 'عاجل جداً', class: 'text-red-600 font-black' };
      case 'high':
        return { label: 'أولوية عالية', class: 'text-orange-500 font-bold' };
      case 'low':
        return { label: 'منخفضة', class: 'text-muted-foreground' };
      default:
        return { label: 'عادية', class: 'text-foreground font-medium' };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            <TicketIcon className="w-7 h-7 text-primary" />
            <span>تذاكر الدعم الفني</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            أنشئ تذاكر للدعم المتقدم، وتابع حالة التذاكر والردود الموجهة لحسابك
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs transition-all shadow-sm cursor-pointer self-start sm:self-auto hover:opacity-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>فتح تذكرة جديدة</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'open', label: 'مفتوحة' },
          { id: 'in_progress', label: 'قيد المعالجة' },
          { id: 'awaiting_user', label: 'بانتظار ردك' },
          { id: 'resolved', label: 'تم الحل' },
          { id: 'closed', label: 'مغلقة' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-2xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-card border border-border flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground">جاري تحميل تذاكر الدعم...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-16 rounded-3xl bg-card border border-border text-center space-y-3">
          <HelpCircle className="w-14 h-14 text-muted-foreground/30 mx-auto" />
          <h3 className="font-extrabold text-foreground text-sm">لا توجد تذاكر دعم مسجلة</h3>
          <p className="text-xs text-muted-foreground">
            لم تقم بإنشاء أي تذاكر دعم تطابق هذا الفلتر بعد.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer"
          >
            فتح تذكرة الآن
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const statusCfg = getStatusBadge(t.status);
            const prioCfg = getPriorityBadge(t.priority);

            return (
              <div
                key={t.id}
                onClick={() => setLocation(`/tickets/${t.id}`)}
                className="p-5 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-black text-sm sm:text-base text-foreground truncate">
                      {t.subject}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusCfg.badgeClass}`}
                    >
                      {statusCfg.label}
                    </span>
                    {t.unreadUserCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground font-black text-[10px]">
                        {t.unreadUserCount} رد جديد
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="font-medium">القسم: {getCategoryLabel(t.category)}</span>
                    <span>•</span>
                    <span className={prioCfg.class}>الأولوية: {prioCfg.label}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(t.createdAt)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-border/60 pt-2 sm:pt-0">
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <span>عرض المحادثة</span>
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </span>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-2xl bg-muted/80 hover:bg-muted text-foreground font-bold text-xs transition-colors border border-border shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? 'جاري التحميل...' : 'تحميل المزيد من التذاكر ↓'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                  <TicketIcon className="w-5 h-5 text-primary" />
                  <span>فتح تذكرة دعم فني جديدة</span>
                </h3>
                <p className="text-xs text-muted-foreground">أدخل تفاصيل المشكلة أو الاستفسار بدقة</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              {createError && (
                <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  موضوع التذكرة <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: استفسار بخصوص تنفيذ الطلب رقم #14"
                  className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    القسم / الفئة
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full h-12 px-3 rounded-2xl bg-muted/40 border border-border text-foreground font-bold text-xs focus:outline-hidden"
                  >
                    <option value="technical">دعم فني وتقني</option>
                    <option value="billing">المدفوعات والرصيد</option>
                    <option value="feature_request">اقتراح ميزة</option>
                    <option value="other">أخرى / عام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    الأولوية
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full h-12 px-3 rounded-2xl bg-muted/40 border border-border text-foreground font-bold text-xs focus:outline-hidden"
                  >
                    <option value="low">منخفضة</option>
                    <option value="normal">عادية</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة جداً</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 h-11 rounded-2xl bg-muted text-foreground font-bold text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={creating || !subject.trim()}
                  className="px-6 h-11 rounded-2xl bg-primary text-primary-foreground font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-40"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rotate-180" />}
                  <span>إنشاء التذكرة ومتابعة المحادثة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
