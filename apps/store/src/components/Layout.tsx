import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors" dir="rtl">
      {/* 1. Header with menu trigger */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* 2. Slide-out Drawer Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 3. Main Content Container (pb-20 on mobile when BottomNav is active) */}
      <main className={`flex-1 ${user ? 'pb-20 md:pb-0' : ''}`}>
        {children}
      </main>

      {/* 4. Desktop Footer */}
      <Footer />

      {/* 5. Mobile Bottom Navigation (Only for logged-in users) */}
      {user && <BottomNav />}
    </div>
  );
};
