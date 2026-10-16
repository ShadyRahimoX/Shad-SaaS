import React, { useState, useEffect } from 'react';
import {
  adminDebtsApi,
  type DebtUser,
  type DebtTransactionType,
} from '../lib/debts';
import {
  X,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Wallet,
  Plus,
  Minus,
  CheckCircle2,
  Check,
} from 'lucide-react';

interface DebtAdjustModalProps {
  open: boolean;
  onClose: () => void;
  user: DebtUser | null;
  onSuccess: () => void;
}

type AdjustMode = 'increase' | 'decrease' | 'clear';

export const DebtAdjustModal: React.FC<DebtAdjustModalProps> = ({
  open,
  onClose,
  user,
  onSuccess,
}) => {
  const [mode, setMode] = useState<AdjustMode>('increase');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    const defaultMode: AdjustMode = user.creditEnabled ? 'increase' : 'decrease';
    setMode(defaultMode);
    setAmount('');
    setReason('');
    setNote('');
    setError(null);
  }, [open, user]);

  useEffect(() => {
    if (!user) return;
    if (mode === 'clear') {
      const currentDebt = Number(user.debtUsd) || 0;
      setAmount(currentDebt > 0 ? String(Number(currentDebt.toFixed(4))) : '0');
    } else if (amount === String(Number((Number(user.debtUsd) || 0).toFixed(4)))) {
      setAmount('');
    }
    setError(null);
  }, [mode, user]);

  if (!open || !user) return null;

  const currentDebt = Number(user.debtUsd) || 0;
  const creditLimit = Number(user.creditLimit) || 0;
  const availableCredit = Number(user.availableCreditUsd) || 0;
  const parsedAmount = mode === 'clear' ? currentDebt : Math.abs(Number(amount) || 0);

  const computedType: DebtTransactionType =
    mode === 'increase'
      ? 'debt_increase'
      : mode === 'clear'
      ? 'debt_cleared'
      : 'debt_decrease';

  const newDebtPreview =
    mode === 'increase'
      ? currentDebt + parsedAmount
      : mode === 'clear'
      ? 0
      : Math.max(0, currentDebt - parsedAmount);

  const isCreditDisabledWarning = mode === 'increase' && !user.creditEnabled;
  const isExceedsLimitWarning =
    mode === 'increase' && user.creditEnabled && parsedAmount > availableCredit && parsedAmount > 0;
  const isOverpaymentWarning =
    (mode === 'decrease' || mode === 'clear') && parsedAmount > currentDebt && parsedAmount > 0;

  const mapErrorCodeToMessage = (code?: string, fallback?: string): string => {
    switch (code) {
      case 'CREDIT_NOT_ENABLED':
        return 'الرصيد المدين غير مُفعَّل لهذا المستخدم. يجب تفعيله من صفحة المستخدمين أولاً.';
      case 'EXCEEDS_CREDIT_LIMIT':
        return 'المبلغ يتجاوز سقف الدين المسموح للمستخدم.';
      case 'OVERPAYMENT':
        return 'مبلغ التسديد يتجاوز الدين الحالي.';
      case 'USER_NOT_FOUND':
        return 'المستخدم غير موجود.';
      default:
        return fallback || 'فشل تعديل الرصيد المدين';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }

    const trimmedNote = note.trim();
    if (trimmedNote.length < 3) {
      setError('الملاحظة مطلوبة ويجب ألا تقل عن 3 أحرف.');
      return;
    }

    const signedAmount =
      mode === 'increase'
        ? +Number(parsedAmount)
        : mode === 'clear'
        ? -Number(currentDebt)
        : -Number(parsedAmount);

    setLoading(true);
    try {
      const res = await adminDebtsApi.adjust(user.id, {
        amount: signedAmount,
        type: computedType,
        reason: reason.trim() || undefined,
        note: trimmedNote,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(mapErrorCodeToMessage(res.error?.code, res.error?.message));
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const reasonPlaceholder =
    mode === 'increase'
      ? 'مثال: شراء آجل، طلب شحن بالائتمان...'
      : mode === 'clear'
      ? 'مثال: تصفية الحساب بالكامل نقداً أو حوالة...'
      : 'مثال: دفعة نقدية جزئية، حوالة بنكية...';

  return (
    <div
      data-debt-adjust-modal
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-foreground truncate">
                تعديل الرصيد المدين — @{user.username}
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                الدين الحالي:{' '}
                <span className="font-bold text-rose-600 dark:text-rose-400" dir="ltr">
                  ${currentDebt.toFixed(2)}
                </span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              data-mode-tab="increase"
              onClick={() => setMode('increase')}
              className={`py-2.5 px-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                mode === 'increase'
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>زيادة الدين</span>
            </button>

            <button
              type="button"
              data-mode-tab="decrease"
              onClick={() => setMode('decrease')}
              className={`py-2.5 px-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                mode === 'decrease'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Minus className="w-3.5 h-3.5 shrink-0" />
              <span>تسديد جزئي</span>
            </button>

            <button
              type="button"
              data-mode-tab="clear"
              onClick={() => setMode('clear')}
              className={`py-2.5 px-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                mode === 'clear'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>تسديد كامل</span>
            </button>
          </div>

          {/* Live Info Panel */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-card border border-border/60">
                <div className="text-[10px] text-muted-foreground">الرصيد المدين الحالي</div>
                <div className="font-mono font-black text-sm text-rose-600 dark:text-rose-400 mt-0.5" dir="ltr">
                  ${currentDebt.toFixed(2)}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-card border border-border/60">
                <div className="text-[10px] text-muted-foreground">سقف الدين</div>
                <div className="font-mono font-black text-sm text-foreground mt-0.5" dir="ltr">
                  ${creditLimit.toFixed(2)}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-card border border-border/60">
                <div className="text-[10px] text-muted-foreground">المتبقي المتاح</div>
                <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 mt-0.5" dir="ltr">
                  ${availableCredit.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="font-bold text-muted-foreground">معاينة الرصيد بعد العملية:</span>
              <span className="font-mono font-black text-foreground" dir="ltr">
                الدين الجديد سيكون ${newDebtPreview.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Live Warnings */}
          {isCreditDisabledWarning && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                الرصيد المدين غير مُفعَّل لهذا المستخدم. يجب تفعيله من صفحة المستخدمين أولاً.
              </span>
            </div>
          )}

          {isExceedsLimitWarning && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>المبلغ يتجاوز سقف الدين المسموح للمستخدم.</span>
            </div>
          )}

          {isOverpaymentWarning && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>مبلغ التسديد يتجاوز الدين الحالي.</span>
            </div>
          )}

          {/* Server / Submit Error */}
          {error && (
            <div
              data-debt-adjust-error
              className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              المبلغ (USD) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              name="amount"
              min="0.01"
              step="any"
              required
              disabled={mode === 'clear'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              dir="ltr"
              className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">السبب (اختياري)</label>
            <input
              type="text"
              name="reason"
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Note Textarea */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              ملاحظة العملية (إلزامي، 3-500 حرف) <span className="text-destructive">*</span>
            </label>
            <textarea
              name="note"
              rows={2}
              required
              minLength={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب تفاصيل التعديل أو رقم الإيصال..."
              className="w-full p-3 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary hover:opacity-95 text-primary-foreground font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>تأكيد العملية</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtAdjustModal;
