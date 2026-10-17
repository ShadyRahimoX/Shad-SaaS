import React, { useEffect, useState } from 'react';
import {
  adminUsersApi,
  type AdminUser,
  type BalanceAdjustReason,
} from '../lib/users';
import {
  X,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Wallet,
  Gift,
  CreditCard,
  Wrench,
  TrendingDown,
  RotateCcw,
  Plus,
  Minus,
  Check,
} from 'lucide-react';

export interface BalanceAdjustModalProps {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSuccess: () => void;
}

type BalanceMode = 'bonus' | 'credit' | 'correction' | 'debit' | 'refund';

const MODE_TABS: Array<{
  mode: BalanceMode;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { mode: 'bonus', label: 'إضافة رصيد', icon: Gift },
  { mode: 'credit', label: 'شحن يدوي', icon: CreditCard },
  { mode: 'correction', label: 'تصحيح', icon: Wrench },
  { mode: 'debit', label: 'خصم', icon: TrendingDown },
  { mode: 'refund', label: 'استرجاع', icon: RotateCcw },
];

export const BalanceAdjustModal: React.FC<BalanceAdjustModalProps> = ({
  open,
  onClose,
  user,
  onSuccess,
}) => {
  const [mode, setMode] = useState<BalanceMode>('bonus');
  const [correctionSign, setCorrectionSign] = useState<'+' | '-'>('+');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setMode('bonus');
    setCorrectionSign('+');
    setAmount('');
    setNote('');
    setError(null);
  }, [open, user]);

  useEffect(() => {
    setError(null);
  }, [mode, correctionSign]);

  if (!open || !user) return null;

  const currentBalance = Number(user.balanceUsd || 0);
  const rawNumber = Number(amount);
  const parsedAmount = !isNaN(rawNumber) && rawNumber > 0 ? Math.abs(rawNumber) : 0;

  const isNegativeSign =
    mode === 'debit' || (mode === 'correction' && correctionSign === '-');

  const signedDelta = isNegativeSign ? -parsedAmount : +parsedAmount;
  const newBalancePreview = currentBalance + signedDelta;

  const computedReason: BalanceAdjustReason =
    mode === 'bonus'
      ? 'bonus'
      : mode === 'credit'
      ? 'manual_credit'
      : mode === 'correction'
      ? 'correction'
      : mode === 'debit'
      ? 'manual_debit'
      : 'refund';

  const isOverdraftWarning = isNegativeSign && parsedAmount > currentBalance && parsedAmount > 0;

  const mapErrorCode = (code?: string, fallback?: string): string => {
    switch (code) {
      case 'INSUFFICIENT_BALANCE':
        return 'INSUFFICIENT_BALANCE: الخصم يتجاوز الرصيد الحالي للمستخدم.';
      case 'VALIDATION_ERROR':
        return `VALIDATION_ERROR: ${fallback || 'بيانات غير صالحة'}`;
      case 'USER_NOT_FOUND':
        return 'المستخدم غير موجود.';
      default:
        return fallback || 'فشل تعديل رصيد المستخدم';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount.trim() || isNaN(rawNumber) || rawNumber <= 0) {
      setError('VALIDATION_ERROR: يرجى إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }

    const trimmedNote = note.trim();
    if (trimmedNote.length < 3 || trimmedNote.length > 500) {
      setError('VALIDATION_ERROR: الملاحظة مطلوبة ويجب أن تكون بين 3 و 500 حرف.');
      return;
    }

    const signedAmount = isNegativeSign ? -Math.abs(rawNumber) : +Math.abs(rawNumber);

    setLoading(true);
    try {
      const res = await adminUsersApi.updateBalance(user.id, {
        amount: signedAmount,
        reason: computedReason,
        note: trimmedNote,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(mapErrorCode(res.error?.code, res.error?.message));
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-balance-adjust-modal
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
                تعديل الرصيد — @{user.username}
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                الرصيد الحالي:{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                  ${currentBalance.toFixed(2)}
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
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* 5 Mode Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {MODE_TABS.map((t) => {
              const Icon = t.icon;
              const active = mode === t.mode;
              const isDebitTab = t.mode === 'debit';
              return (
                <button
                  key={t.mode}
                  type="button"
                  data-mode-tab={t.mode}
                  onClick={() => setMode(t.mode)}
                  className={`py-2 px-2 rounded-2xl font-bold text-[11px] flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                    active
                      ? isDebitTab
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-toggle for Correction (+/-) */}
          {mode === 'correction' && (
            <div
              data-correction-toggle
              className="p-3 rounded-2xl bg-muted/50 border border-border flex items-center justify-between"
            >
              <span className="font-bold text-foreground">اتجاه التصحيح:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-correction-sign="+"
                  onClick={() => setCorrectionSign('+')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    correctionSign === '+'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-background border border-border text-muted-foreground'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة (+)</span>
                </button>

                <button
                  type="button"
                  data-correction-sign="-"
                  onClick={() => setCorrectionSign('-')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    correctionSign === '-'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-background border border-border text-muted-foreground'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>خصم (−)</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Info Panel */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2.5">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-card border border-border/60">
                <div className="text-[10px] text-muted-foreground">الرصيد الحالي</div>
                <div
                  data-balance-current
                  className="font-mono font-black text-sm text-foreground mt-0.5"
                  dir="ltr"
                >
                  ${currentBalance.toFixed(2)}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border/60">
                <div className="text-[10px] text-muted-foreground">الرصيد الجديد (Preview)</div>
                <div
                  data-balance-preview
                  className={`font-mono font-black text-sm mt-0.5 ${
                    isNegativeSign
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                  dir="ltr"
                >
                  ${newBalancePreview.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Live Warning */}
          {isOverdraftWarning && (
            <div
              data-balance-overdraft-warning
              className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>الخصم يتجاوز الرصيد الحالي</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div
              data-balance-adjust-error
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              dir="ltr"
              className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
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
              placeholder="اكتب سبب التعديل أو رقم المرجع..."
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

export default BalanceAdjustModal;
