import React from 'react';

const Placeholder = ({ title, description }: { title: string; description?: string }) => (
  <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-3 shadow-xs">
    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl font-black">
      {title.slice(0, 1)}
    </div>
    <h1 className="text-2xl font-black text-foreground">{title}</h1>
    <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
      {description || 'هذه الصفحة قيد الإعداد وسيتم بناؤها بالكامل في المراحل القادمة (I-b → I-g).'}
    </p>
  </div>
);

export const AdminOrders = () => <Placeholder title="إدارة الطلبات" />;
export const AdminDisputes = () => <Placeholder title="طلبات الاعتراض" />;
export const AdminCategories = () => <Placeholder title="الأقسام" />;
export const AdminProductsAdd = () => <Placeholder title="إضافة منتج" />;
export const AdminProducts = () => <Placeholder title="إدارة المنتجات" />;
export const AdminInventory = () => <Placeholder title="منتجات المخزون" />;
export const AdminPaymentMethods = () => <Placeholder title="طرق الدفع" />;
export const AdminShippingRequests = () => <Placeholder title="طلبات الشحن" />;
export const AdminStoreCards = () => <Placeholder title="بطاقات المتجر" />;
export const AdminVipProfit = () => <Placeholder title="نسبة ربح VIP" />;
export const AdminCurrencies = () => <Placeholder title="العملات" />;
export const AdminProfitLog = () => <Placeholder title="سجل الأرباح" />;
export const AdminUsers = () => <Placeholder title="إدارة المستخدمين" />;
export const AdminDebts = () => <Placeholder title="الرصيد المدين" />;
export const AdminTopSpenders = () => <Placeholder title="الأكثر صرفاً" />;
export const AdminAgents = () => <Placeholder title="الوكلاء" />;
export const AdminReferrals = () => <Placeholder title="الإحالات" />;
export const AdminVipMembers = () => <Placeholder title="عضويات VIP" />;
export const AdminSendNotification = () => <Placeholder title="إرسال إشعار" />;
export const AdminProviders = () => <Placeholder title="إدارة المزودين" />;
export const AdminProductImport = () => <Placeholder title="استيراد منتجات" />;
export const AdminApiClients = () => <Placeholder title="عملاء API" />;
export const AdminDesign = () => <Placeholder title="التصميم" />;
export const AdminOrderMessages = () => <Placeholder title="رسائل الطلب" />;
export const AdminSorting = () => <Placeholder title="إدارة الترتيب" />;
export const AdminContact = () => <Placeholder title="وسائل التواصل" />;
export const AdminAccounts = () => <Placeholder title="حسابات الإدارة" />;
export const AdminTwoFA = () => <Placeholder title="التحقق بخطوتين" />;
