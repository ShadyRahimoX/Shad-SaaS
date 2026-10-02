import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import {
  notificationsApi,
  useNotifications,
  type Notification,
} from '../lib/notifications';
import { formatDate } from '../lib/utils';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  ShoppingBag,
  Wallet,
  Users,
  Crown,
  MessageCircle,
  Ticket,
  Loader2,
  AlertCircle,
  ExternalLink,
  Clock,
  Inbox,
  ArrowRight,
} from 'lucide-react';

export const Notifications: React.FC = () => {
  const { unreadCount, setUnreadCount, latestNotification } = useNotifications();
  const [, setLocation] = useLocation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchNotifications = async (targetPage: number, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await notificationsApi.list({
        page: targetPage,
        limit: 20,
        unreadOnly: unreadOnly ? true : undefined,
      });

      if (res.success && res.data) {
        const data = res.data;
        if (append) {
          setNotifications((prev) => [...prev, ...data.notifications]);
        } else {
          setNotifications(data.notifications);
        }
        setTotal(data.total);
        setHasMore(targetPage * 20 < data.total);
      } else {
        setError(res.error?.message || 'فشل جلب الإشعارات');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل الإشعارات');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchNotifications(1, false);
  }, [unreadOnly]);

  // Live SSE listener: prepend newly arrived notification to page list
  useEffect(() => {
    if (!latestNotification) return;
    setNotifications((prev) => {
      if (prev.some((n) => n.id === latestNotification.id)) return prev;
      return [latestNotification, ...prev];
    });
    setTotal((prev) => prev + 1);
  }, [latestNotification]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const handleMarkAsRead = async (item: Notification) => {
    if (item.isRead) return;
    try {
      const res = await notificationsApi.markAsRead(item.id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationsApi.markAllAsRead();
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, wasUnread: boolean) => {
    e.stopPropagation();
    try {
      const res = await notificationsApi.remove(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleNotificationClick = async (item: Notification) => {
    await handleMarkAsRead(item);

    // Deep-linking based on notification payload or type
    if (item.payload?.orderId) {
      setLocation(`/orders/${item.payload.orderId}`);
    } else if (item.type.startsWith('deposit.')) {
      setLocation('/wallet/deposits');
    } else if (item.type.startsWith('vip.')) {
      setLocation('/profile');
    } else if (item.type.startsWith('referral.')) {
      setLocation('/referrals');
    }
  };

  // Date filtering client-side
  const filteredList = useMemo(() => {
    return notifications.filter((item) => {
      if (!dateFrom && !dateTo) return true;
      const dTime = new Date(item.createdAt).getTime();
      if (dateFrom && dTime < new Date(dateFrom).getTime()) return false;
      if (dateTo) {
        const toEnd = new Date(dateTo);
        toEnd.setHours(23, 59, 59, 999);
        if (dTime > toEnd.getTime()) return false;
      }
      return true;
    });
  }, [notifications, dateFrom, dateTo]);

  const getNotificationIcon = (type: string) => {
    if (type.startsWith('order.')) return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
    if (type.startsWith('deposit.')) return <Wallet className="w-5 h-5 text-primary" />;
    if (type.startsWith('vip.')) return <Crown className="w-5 h-5 text-amber-500" />;
    if (type.startsWith('referral.')) return <Users className="w-5 h-5 text-purple-500" />;
    if (type.startsWith('chat.')) return <MessageCircle className="w-5 h-5 text-blue-500" />;
    if (type.startsWith('ticket.')) return <Ticket className="w-5 h-5 text-orange-500" />;
    return <Bell className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
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
            <Bell className="w-7 h-7 text-primary" />
            <span>إشعاراتي</span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-destructive text-destructive-foreground font-black text-xs">
                {unreadCount} جديد
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            تابع آخر المستجدات حول طلباتك، عمليات الشحن، والترقيات أولاً بأول
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors border border-border cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-primary" />
            <span>تعليم الكل كمقروء</span>
          </button>
        )}
      </div>

      {/* Filter Bar (Image #13) */}
      <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Toggle unread */}
        <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-foreground">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="w-4 h-4 rounded text-primary border-border focus:ring-primary/20 accent-primary"
          />
          <span>عرض الإشعارات غير المقروءة فقط</span>
        </label>

        {/* Date Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground font-bold">من:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 px-2.5 rounded-xl bg-muted/50 border border-border text-foreground font-medium text-xs focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-bold">إلى:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 px-2.5 rounded-xl bg-muted/50 border border-border text-foreground font-medium text-xs focus:outline-hidden"
            />
          </div>

          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="px-2.5 py-1 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-bold text-[11px]"
            >
              مسح التاريخ
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-card border border-border flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground">جاري تحميل الإشعارات...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : filteredList.length === 0 ? (
        /* Empty State (Image #13) */
        <div className="p-16 rounded-3xl bg-card border border-border text-center space-y-3">
          <Inbox className="w-14 h-14 text-muted-foreground/30 mx-auto" />
          <h3 className="font-extrabold text-foreground text-sm">
            لا يوجد إشعارات ضمن النطاق الزمني الحالي.
          </h3>
          <p className="text-xs text-muted-foreground">
            ستصلك التنبيهات الفورية هنا فور حدوث أي تحديث على حسابك أو طلباتك.
          </p>
        </div>
      ) : (
        <div data-notifications-list className="space-y-3">
          {filteredList.map((item) => {
            const isUnread = !item.isRead;

            return (
              <div
                key={item.id}
                data-notification-item={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-primary/5 border-primary/30 shadow-xs hover:border-primary'
                    : 'bg-card border-border/80 hover:border-border hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Icon */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isUnread
                        ? 'bg-primary/10 border-primary/20'
                        : 'bg-muted/60 border-border/60'
                    }`}
                  >
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Body & Title */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm font-black truncate ${
                          isUnread ? 'text-foreground' : 'text-foreground/90'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {isUnread && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-black">
                          جديد
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {item.body}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground/80 pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(item.createdAt)}</span>
                      </span>
                      {item.payload?.orderId && (
                        <span className="inline-flex items-center gap-1 text-primary font-bold">
                          <span>عرض الطلب</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id, !item.isRead)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="حذف الإشعار"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-2xl bg-muted/80 hover:bg-muted text-foreground font-bold text-xs transition-colors border border-border shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? 'جاري تحميل المزيد...' : 'تحميل المزيد من الإشعارات ↓'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
