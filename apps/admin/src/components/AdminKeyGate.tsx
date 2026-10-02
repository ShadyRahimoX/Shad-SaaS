import React, { useState } from 'react';
import { useAdminKey } from '../lib/adminKey';
import { adminApi } from '../lib/api';
import { Loader2, Lock, AlertCircle, ShieldCheck } from 'lucide-react';

export const AdminKeyGate: React.FC = () => {
  const { setAdminKey } = useAdminKey();
  const [key, setKey] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('يرجى إدخال مفتاح الأدمن');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      // Test the key by calling a protected endpoint
      localStorage.setItem('admin_sync_key', key.trim());
      const res = await adminApi.get('/api/admin/settings/allowed-keys');
      if (!res.success) {
        localStorage.removeItem('admin_sync_key');
        setError(res.error?.message || 'المفتاح غير صالح');
        return;
      }
      setAdminKey(key.trim());
    } catch (err: any) {
      localStorage.removeItem('admin_sync_key');
      setError(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background" dir="rtl">
      <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-border shadow-lg space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-accent text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
            S
          </div>
          <h1 className="text-2xl font-black text-foreground">لوحة الإدارة</h1>
          <p className="text-xs text-muted-foreground">أدخل مفتاح الأدمن للوصول إلى اللوحة</p>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>يُخزَّن المفتاح محلياً في المتصفح فقط — لا يُرسل لأي طرف ثالث.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">مفتاح الأدمن (X-Admin-Key)</label>
            <div className="relative">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="أدخل المفتاح..."
                className="w-full h-12 pr-4 pl-10 rounded-2xl bg-background border border-input text-foreground font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-ring/30"
                required
              />
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={verifying || !key.trim()}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-sm hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{verifying ? 'جاري التحقق...' : 'دخول اللوحة'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminKeyGate;
