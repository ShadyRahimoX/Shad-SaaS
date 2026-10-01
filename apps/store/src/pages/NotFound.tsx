import React from 'react';
import { Link } from 'wouter';
import { Home, AlertCircle } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-5" dir="rtl">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
        <AlertCircle className="w-10 h-10" />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-extrabold tracking-tight">404 - الصفحة غير موجودة</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          عذراً، الرابط الذي حاولت الوصول إليه غير صحيح أو تم نقل الصفحة أو حذفها.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-95 shadow-md transition-all cursor-pointer"
      >
        <Home className="w-4 h-4" />
        <span>العودة للرئيسية</span>
      </Link>
    </div>
  );
};

export default NotFound;
