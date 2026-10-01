import React from 'react';
import { Link, useRoute } from 'wouter';
import { useAuth } from '../lib/auth';
import { ShieldCheck, CreditCard, Home, History, ShoppingBag } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const [isHome] = useRoute('/');
  const [isDeposit] = useRoute('/wallet/deposit');
  const [isDeposits] = useRoute('/wallet/deposits');
  const [isOrders] = useRoute('/orders');
  const [isProtection] = useRoute('/protection');

  // Strict requirement: logged-out -> NO BottomNav
  if (!user) {
    return null;
  }

  return (
    <nav
      data-bottom-nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-gradient-to-r from-primary to-accent text-white shadow-2xl flex items-center justify-around px-2 border-t border-white/10"
      dir="rtl"
    >
      {/* 1. الحماية */}
      <Link
        href="/protection"
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-opacity ${
          isProtection ? 'opacity-100 font-bold' : 'opacity-75 hover:opacity-100'
        }`}
      >
        <ShieldCheck className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">الحماية</span>
      </Link>

      {/* 2. إضافة رصيد */}
      <Link
        href="/wallet/deposit"
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-opacity ${
          isDeposit ? 'opacity-100 font-bold' : 'opacity-75 hover:opacity-100'
        }`}
      >
        <CreditCard className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">شحن</span>
      </Link>

      {/* 3. الرئيسية (مميز - أكبر وأعلى قليلاً) */}
      <Link
        href="/"
        className="flex flex-col items-center justify-center flex-1 -mt-6 group"
      >
        <div
          className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg border-3 border-card transition-transform group-hover:scale-105 ${
            isHome
              ? 'bg-white text-primary ring-4 ring-primary/30'
              : 'bg-primary text-white'
          }`}
        >
          <Home className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold mt-1 text-white">الرئيسية</span>
      </Link>

      {/* 4. دفعاتي */}
      <Link
        href="/wallet/deposits"
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-opacity ${
          isDeposits ? 'opacity-100 font-bold' : 'opacity-75 hover:opacity-100'
        }`}
      >
        <History className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">دفعاتي</span>
      </Link>

      {/* 5. طلباتي */}
      <Link
        href="/orders"
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-opacity ${
          isOrders ? 'opacity-100 font-bold' : 'opacity-75 hover:opacity-100'
        }`}
      >
        <ShoppingBag className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">طلباتي</span>
      </Link>
    </nav>
  );
};
