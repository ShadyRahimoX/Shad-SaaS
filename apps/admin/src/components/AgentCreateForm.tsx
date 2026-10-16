import React, { useState } from 'react';
import { adminAgentsApi, type CreateAgentInput } from '../lib/agents';
import {
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AgentCreateFormProps {
  onSuccess: () => void;
}

export const AgentCreateForm: React.FC<AgentCreateFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [callSign, setCallSign] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('0');
  const [notes, setNotes] = useState('');
  const [userId, setUserId] = useState('');
  const [active, setActive] = useState(true);
  const [showExtra, setShowExtra] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError('اسم الوكيل يجب أن يتكون من حرفين على الأقل');
      return;
    }

    const commNum = Number(commissionPercent);
    if (isNaN(commNum) || commNum < 0 || commNum > 100) {
      setError('نسبة العمولة يجب أن تكون رقماً بين 0 و 100');
      return;
    }

    const trimmedUserId = userId.trim();
    if (trimmedUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedUserId)) {
      setError('معرّف المستخدم (User ID) يجب أن يكون بصيغة UUID صحيحة');
      return;
    }

    const payload: CreateAgentInput = {
      name: trimmedName,
      address: address.trim() || null,
      callSign: callSign.trim() || null,
      phone: phone.trim() || null,
      commissionPercent: commNum.toFixed(2),
      active,
      notes: notes.trim() || null,
      userId: trimmedUserId || null,
    };

    setLoading(true);
    try {
      const res = await adminAgentsApi.create(payload);
      if (res.success) {
        setName('');
        setAddress('');
        setCallSign('');
        setPhone('');
        setCommissionPercent('0');
        setNotes('');
        setUserId('');
        setActive(true);
        setSuccessMsg('تم إضافة الوكيل بنجاح');
        setTimeout(() => setSuccessMsg(null), 3000);
        onSuccess();
      } else {
        if (res.error?.code === 'USER_NOT_FOUND') {
          setError('لم يتم العثور على حساب المستخدم المرتبط (USER_NOT_FOUND)');
        } else {
          setError(res.error?.message || 'فشل إضافة الوكيل');
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-agent-create-form
      data-agent-form
      className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4"
      dir="rtl"
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-foreground">إضافة وكيل جديد</h2>
            <p className="text-[11px] text-muted-foreground">
              أدخل بيانات الوكيل المعتمد، عنوانه، النداء، ونسبة العمولة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowExtra((v) => !v)}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{showExtra ? 'إخفاء الحقول الإضافية' : 'خيارات إضافية (ملاحظات / ربط مستخدم)'}</span>
          {showExtra ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Top 5 Main Fields: Name + Address + CallSign + Phone + Commission */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              اسم الوكيل <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مكتب النور..."
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* 2. Address */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">العنوان</label>
            <input
              type="text"
              maxLength={200}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="المدينة / المنطقة..."
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* 3. CallSign */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">النداء (Call Sign)</label>
            <input
              type="text"
              maxLength={50}
              value={callSign}
              onChange={(e) => setCallSign(e.target.value)}
              placeholder="مثال: شام-1..."
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* 4. Phone */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">رقم الهاتف</label>
            <input
              type="text"
              maxLength={50}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+963..."
              dir="ltr"
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* 5. Commission Percent */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">نسبة العمولة (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              placeholder="0.00"
              dir="ltr"
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Extra Optional Fields (User ID + Notes) */}
        {showExtra && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50 animate-in fade-in">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">
                ربط بحساب مستخدم (User UUID - اختياري)
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                dir="ltr"
                className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">ملاحظات إدارية (اختياري)</label>
              <input
                type="text"
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات حول أوقات العمل أو التغطية..."
                className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {/* Submit Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded-md text-primary focus:ring-primary/20"
            />
            <span className="font-bold text-foreground">تفعيل الوكيل مباشرة بعد الإضافة</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-10 px-6 rounded-2xl bg-primary hover:opacity-95 text-primary-foreground font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>إضافة وكيل</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgentCreateForm;
