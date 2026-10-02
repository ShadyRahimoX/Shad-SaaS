import React from 'react';
import { AdminKeyProvider, useAdminKey } from './lib/adminKey';
import { AdminKeyGate } from './components/AdminKeyGate';

const AdminApp: React.FC = () => {
  const { adminKey, isReady, clearAdminKey } = useAdminKey();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground font-bold">جاري التحميل...</span>
      </div>
    );
  }

  if (!adminKey) {
    return <AdminKeyGate />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">لوحة الإدارة</h1>
          <button
            type="button"
            onClick={clearAdminKey}
            className="px-4 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold transition-colors cursor-pointer"
          >
            تسجيل الخروج
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          ✅ تم قبول المفتاح بنجاح. سيتم بناء الـ Layout والـ Dashboard الكاملة في المرحلة I-a-2.
        </p>
        <div className="p-6 rounded-2xl bg-card border border-border space-y-2">
          <p className="text-xs text-muted-foreground">
            المفتاح المخزّن: <span className="font-mono font-bold text-foreground" dir="ltr">{adminKey.slice(0, 8)}...</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => (
  <AdminKeyProvider>
    <AdminApp />
  </AdminKeyProvider>
);

export default App;
