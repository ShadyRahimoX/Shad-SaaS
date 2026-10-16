import React, { useEffect, useState } from 'react';
import {
  adminDebtsApi,
  type DebtUser,
  type DebtTransaction,
} from '../lib/debts';
import {
  X,
  Loader2,
  AlertCircle,
  History,
  HelpCircle,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

interface DebtHistoryModalProps {
  open: boolean;
  onClose: () => void;
  user: DebtUser | null;
}

const FILTER_CHIPS: Array<{ value: string; label: string }> = [
  { value: '', label: 'الكل' },
  { value: 'debt_increase', label: 'زيادة' },
  { value: 'debt_decrease', label: 'تسديد' },
  { value: 'debt_cleared', label: 'تسديد كامل' },
  { value: 'adjustment', label: 'تعديل' },
];

export const DebtHistoryModal: React.FC<DebtHistoryModalProps> = ({
  open,
  onClose,
  user,
}) => {
  const [transactions, setTransactions] = useState<DebtTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [typeFilter, setTypeFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (targetPage: number, targetType: string, append: boolean) => {
    if (!user) return;
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await adminDebtsApi.getHistory(user.id, {
        page: targetPage,
        limit,
        type: targetType || undefined,
      });

      if (res.success && res.data) {
        if (append) {
          setTransactions((prev) => [...prev, ...res.data!.transactions]);
        } else {
          setTransactions(res.data.transactions);
        }
        setTotal(res.data.total);
      } else {
        setError(res.error?.message || 'فشل جلب سجل الديون');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!open || !user) return;
    setTypeFilter('');
    setPage(1);
    fetchHistory(1, '', false);
  }, [open, user]);

  const handleFilterChange = (nextType: string) => {
    setTypeFilter(nextType);
    setPage(1);
    fetchHistory(1, nextType, false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, typeFilter, true);
  };

  if (!open || !user) return null;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'debt_increase':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            زيادة
          </span>
        );
      case 'debt_decrease':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            تسديد
          </span>
        );
      case 'debt_cleared':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            تسديد كامل
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            تعديل
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      data-debt-history-modal
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-foreground truncate">
                سجل حركات الرصيد المدين — @{user.username}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                إجمالي الحركات المسجلة: <span className="font-bold font-mono">{total}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="px-6 py-3 border-b border-border/60 flex items-center gap-2 overflow-x-auto shrink-0">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value || 'all'}
              type="button"
              data-history-chip={chip.value || 'all'}
              onClick={() => handleFilterChange(chip.value)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                typeFilter === chip.value
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2.5">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <span className="font-bold text-muted-foreground">جاري تحميل السجل...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="font-bold text-foreground">لا توجد حركات مطابقة في السجل</p>
            </div>
          ) : (
            <>
              {transactions.map((tx) => {
                const amt = Number(tx.amountUsd) || 0;
                const isIncrease = amt > 0 || tx.type === 'debt_increase';

                return (
                  <div
                    key={tx.id}
                    data-debt-history-row
                    className="p-4 rounded-2xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-mono font-black text-sm ${
                            isIncrease
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                          dir="ltr"
                        >
                          {amt > 0 ? `+$${amt.toFixed(2)}` : `-$${Math.abs(amt).toFixed(2)}`}
                        </span>
                        {getTypeBadge(tx.type)}
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(tx.createdAt)}</span>
                        </span>
                      </div>

                      {tx.reason && (
                        <div className="font-bold text-foreground">{tx.reason}</div>
                      )}
                      {tx.description && (
                        <div className="text-muted-foreground">{tx.description}</div>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-1.5 font-mono text-[11px] bg-muted/60 px-3 py-1.5 rounded-xl shrink-0"
                      dir="ltr"
                    >
                      <span className="text-muted-foreground">
                        ${Number(tx.balanceBefore || 0).toFixed(2)}
                      </span>
                      <ArrowLeft className="w-3 h-3 text-muted-foreground rotate-180" />
                      <span className="font-bold text-foreground">
                        ${Number(tx.balanceAfter || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {transactions.length < total && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={handleLoadMore}
                    className="px-5 py-2 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>تحميل المزيد ({total - transactions.length})</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtHistoryModal;
