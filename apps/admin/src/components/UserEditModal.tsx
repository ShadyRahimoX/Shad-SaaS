import React, { useEffect, useState } from 'react';
import { adminUsersApi, type AdminUser } from '../lib/users';
import {
  X,
  Loader2,
  AlertCircle,
  AlertTriangle,
  UserCog,
  Check,
  ShieldAlert,
  Wallet,
} from 'lucide-react';

export interface UserEditModalProps {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSuccess: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  open,
  onClose,
  user,
  onSuccess,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [banned, setBanned] = useState(false);
  const [creditEnabled, setCreditEnabled] = useState(false);
  const [creditLimit, setCreditLimit] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setPhone(user.phone || '');
    setCountry(user.country || '');
    setBanned(Boolean(user.banned));
    setCreditEnabled(Boolean(user.creditEnabled));
    setCreditLimit(
      user.creditLimit !== undefined && user.creditLimit !== null
        ? String(Number(user.creditLimit))
        : '0'
    );
    setError(null);
  }, [open, user]);

  if (!open || !user) return null;

  const currentDebt = Number(user.debtUsd || 0);
  const showOutstandingDebtWarning = !creditEnabled && currentDebt > 0;

  const mapErrorCode = (code?: string, fallback?: string): string => {
    switch (code) {
      case 'USER_HAS_OUTSTANDING_DEBT':
        return 'USER_HAS_OUTSTANDING_DEBT: لا يمكن تعطيل credit مع وجود دين مستحق على المستخدم.';
      case 'USER_NOT_FOUND':
        return 'المستخدم غير موجود.';
      case 'VALIDATION_ERROR':
        return fallback || 'بيانات غير صالحة.';
      default:
        return fallback || 'فشل تحديث بيانات المستخدم';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedLimit = Number(creditLimit);
    if (creditEnabled && (isNaN(parsedLimit) || parsedLimit < 0)) {
      setError('يرجى إدخال سقف دين (creditLimit) رقمي أكبر من أو يساوي الصفر.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminUsersApi.update(user.id, {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        phone: phone.trim() || null,
        country: country.trim() || null,
        banned,
        creditEnabled,
        creditLimit: isNaN(parsedLimit) ? '0' : parsedLimit.toFixed(10),
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
      data-user-edit-modal
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserCog className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-foreground truncate">
                تعديل بيانات المستخدم — @{user.username}
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                المعرف: #{user.displayId}
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
          {showOutstandingDebtWarning && (
            <div
              data-user-edit-debt-warning
              className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>لا يمكن تعطيل credit مع وجود دين (${currentDebt.toFixed(2)})</span>
            </div>
          )}

          {error && (
            <div
              data-user-edit-error
              className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">الاسم الأول (First Name)</label>
              <input
                type="text"
                name="firstName"
                maxLength={100}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="الاسم الأول..."
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">الاسم الأخير (Last Name)</label>
              <input
                type="text"
                name="lastName"
                maxLength={100}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="الاسم الأخير..."
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">رقم الهاتف (Phone)</label>
              <input
                type="text"
                name="phone"
                maxLength={50}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+963..."
                dir="ltr"
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">الدولة (Country)</label>
              <input
                type="text"
                name="country"
                maxLength={50}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="مثال: SY, TR, AE..."
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Credit Section */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="font-extrabold text-foreground">إعدادات الائتمان (Credit)</span>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="creditEnabled"
                  checked={creditEnabled}
                  onChange={(e) => setCreditEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="font-bold text-foreground">تفعيل الرصيد المدين</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground block">
                سقف الدين المسموح (Credit Limit USD)
              </label>
              <input
                type="number"
                name="creditLimit"
                min="0"
                step="any"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                dir="ltr"
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Ban Toggle */}
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <div>
                <div className="font-extrabold text-foreground">حظر الحساب (Banned)</div>
                <div className="text-[11px] text-muted-foreground">
                  منع المستخدم من تسجيل الدخول أو إجراء طلبات جديدة
                </div>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="banned"
                checked={banned}
                onChange={(e) => setBanned(e.target.checked)}
                className="w-4 h-4 rounded border-border text-rose-600 focus:ring-rose-500/20"
              />
              <span className="font-bold text-rose-600 dark:text-rose-400">محظور</span>
            </label>
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
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;
