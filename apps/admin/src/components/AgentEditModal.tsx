import React, { useState, useEffect } from 'react';
import {
  adminAgentsApi,
  type AdminAgent,
  type UpdateAgentInput,
} from '../lib/agents';
import { X, Loader2, AlertCircle, UserCheck, Check } from 'lucide-react';

interface AgentEditModalProps {
  open: boolean;
  onClose: () => void;
  agent: AdminAgent | null;
  onSuccess: () => void;
}

export const AgentEditModal: React.FC<AgentEditModalProps> = ({
  open,
  onClose,
  agent,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [callSign, setCallSign] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('0');
  const [notes, setNotes] = useState('');
  const [userId, setUserId] = useState('');
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !agent) return;

    setName(agent.name || '');
    setAddress(agent.address || '');
    setCallSign(agent.callSign || '');
    setPhone(agent.phone || '');
    setCommissionPercent(agent.commissionPercent ?? '0');
    setNotes(agent.notes || '');
    setUserId(agent.userId || '');
    setActive(agent.active);
    setError(null);
  }, [open, agent]);

  if (!open || !agent) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
    if (
      trimmedUserId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedUserId)
    ) {
      setError('معرّف المستخدم (User ID) يجب أن يكون بصيغة UUID صحيحة');
      return;
    }

    const payload: UpdateAgentInput = {
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
      const res = await adminAgentsApi.update(agent.id, payload);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        if (res.error?.code === 'USER_NOT_FOUND') {
          setError('لم يتم العثور على حساب المستخدم المرتبط (USER_NOT_FOUND)');
        } else {
          setError(res.error?.message || 'فشل تحديث بيانات الوكيل');
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
      data-agent-edit-modal
      data-agent-form-modal
      data-agent-modal
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-foreground truncate">
                تعديل بيانات الوكيل
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                تحديث معلومات الوكيل: {agent.name}
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
          {error && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name */}
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
              className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Address + CallSign Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">العنوان</label>
              <input
                type="text"
                maxLength={200}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="المدينة / المنطقة..."
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">النداء (Call Sign)</label>
              <input
                type="text"
                maxLength={50}
                value={callSign}
                onChange={(e) => setCallSign(e.target.value)}
                placeholder="مثال: شام-1..."
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Phone + Commission Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">رقم الهاتف</label>
              <input
                type="text"
                maxLength={50}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+963..."
                dir="ltr"
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">نسبة العمولة (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                dir="ltr"
                className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Linked User UUID */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              معرّف المستخدم المرتبط (User UUID - اختياري)
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              dir="ltr"
              className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
            {agent.username && (
              <p className="text-[11px] text-muted-foreground">
                مرتبط حالياً بالمستخدم: <span className="font-bold text-foreground">@{agent.username}</span>
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">ملاحظات إدارية (اختياري)</label>
            <textarea
              rows={2}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات حول الوكيل..."
              className="w-full p-3 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Active Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded-md text-primary focus:ring-primary/20"
              />
              <span className="font-bold text-foreground">الوكيل نشط (مفعّل)</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
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

export default AgentEditModal;
