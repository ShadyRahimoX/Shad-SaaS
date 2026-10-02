import React from 'react';
import { Route, Switch } from 'wouter';
import { AdminKeyProvider, useAdminKey } from './lib/adminKey';
import { AdminKeyGate } from './components/AdminKeyGate';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import * as PH from './pages/_placeholders';

const AdminApp: React.FC = () => {
  const { adminKey, isReady } = useAdminKey();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-sm font-bold text-muted-foreground">جاري التحميل...</span>
      </div>
    );
  }

  if (!adminKey) {
    return <AdminKeyGate />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/orders/:id" component={OrderDetail} />
        <Route path="/disputes" component={PH.AdminDisputes} />
        <Route path="/categories" component={PH.AdminCategories} />
        <Route path="/products/add" component={PH.AdminProductsAdd} />
        <Route path="/products" component={PH.AdminProducts} />
        <Route path="/inventory" component={PH.AdminInventory} />
        <Route path="/payment-methods" component={PH.AdminPaymentMethods} />
        <Route path="/shipping-requests" component={PH.AdminShippingRequests} />
        <Route path="/store-cards" component={PH.AdminStoreCards} />
        <Route path="/vip-profit" component={PH.AdminVipProfit} />
        <Route path="/currencies" component={PH.AdminCurrencies} />
        <Route path="/profit-log" component={PH.AdminProfitLog} />
        <Route path="/users" component={PH.AdminUsers} />
        <Route path="/debts" component={PH.AdminDebts} />
        <Route path="/top-spenders" component={PH.AdminTopSpenders} />
        <Route path="/agents" component={PH.AdminAgents} />
        <Route path="/referrals" component={PH.AdminReferrals} />
        <Route path="/vip-members" component={PH.AdminVipMembers} />
        <Route path="/send-notification" component={PH.AdminSendNotification} />
        <Route path="/providers" component={PH.AdminProviders} />
        <Route path="/product-import" component={PH.AdminProductImport} />
        <Route path="/api-clients" component={PH.AdminApiClients} />
        <Route path="/design" component={PH.AdminDesign} />
        <Route path="/order-messages" component={PH.AdminOrderMessages} />
        <Route path="/sorting" component={PH.AdminSorting} />
        <Route path="/contact" component={PH.AdminContact} />
        <Route path="/accounts" component={PH.AdminAccounts} />
        <Route path="/2fa" component={PH.AdminTwoFA} />
        <Route component={PH.AdminOrders} />
      </Switch>
    </Layout>
  );
};

export const App: React.FC = () => (
  <AdminKeyProvider>
    <AdminApp />
  </AdminKeyProvider>
);

export default App;
