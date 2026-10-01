import React from 'react';
import { Link } from 'wouter';
import { useSettings } from '../lib/settings';
import { Mail, Phone, Send, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings } = useSettings();
  const currentYear = new Date().getFullYear();

  const copyrightText = settings.branding_copyright
    ? settings.branding_copyright.replace('{year}', String(currentYear)).replace('{site_name}', settings.site_name || 'Shad Store')
    : `© ${currentYear} ${settings.site_name || 'Shad Store'}. جميع الحقوق محفوظة.`;

  return (
    <footer className="hidden md:block bg-muted/60 border-t border-border mt-auto transition-colors" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          {/* Col 1: About & Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-sm">
                S
              </div>
              <span className="font-extrabold text-base">{settings.site_name || 'Shad Store'}</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">
              {settings.site_description || 'منصة متكاملة لتقديم البطاقات الرقمية والخدمات الفورية بأعلى مستويات الموثوقية والأمان.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-primary font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>دفع آمن ومعاملات مشفرة 100%</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-sm">روابط سريعة</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">من نحن</Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-primary transition-colors">طلباتي</Link>
              </li>
              <li>
                <Link href="/protection" className="hover:text-primary transition-colors">سياسة الخصوصية والأمان</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Support */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-sm">تواصل معنا</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {settings.support_email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <a href={`mailto:${settings.support_email}`} className="hover:underline" dir="ltr">
                    {settings.support_email}
                  </a>
                </li>
              )}
              {settings.branding_contact_phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span dir="ltr">{settings.branding_contact_phone}</span>
                </li>
              )}
              {settings.branding_telegram_url && (
                <li className="flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-primary" />
                  <a href={settings.branding_telegram_url} target="_blank" rel="noreferrer" className="hover:underline">
                    قناة تلغرام
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>{copyrightText}</p>
          <p className="flex items-center gap-1 text-[11px]">
            <span>صُنع بـ</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>لخدمتكم دائماً</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
