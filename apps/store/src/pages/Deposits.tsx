import React from 'react';
import { History } from 'lucide-react';

export const Deposits: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4" dir="rtl">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto">
        <History className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold">دفعاتي وسجل الشحن</h1>
      <p className="text-muted-foreground text-sm">قادم في مرحلة H-x</p>
    </div>
  );
};

export default Deposits;
