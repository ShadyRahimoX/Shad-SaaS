import React from 'react';
import { Route, Switch } from 'wouter';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { SettingsProvider } from './lib/settings';
import { CartProvider } from './lib/cart';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CategoryPage } from './pages/Category';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { About } from './pages/About';
import { Wallet } from './pages/Wallet';
import { Deposits } from './pages/Deposits';
import { Deposit } from './pages/Deposit';
import { DepositInvoice } from './pages/DepositInvoice';
import { Profile } from './pages/Profile';
import { ProfileEdit } from './pages/ProfileEdit';
import { Referrals } from './pages/Referrals';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <Switch>
                {/* Standalone pages without Layout header/footer */}
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />

                {/* Main App routes wrapped in Layout */}
                <Route>
                  <Layout>
                    <Switch>
                      <Route path="/" component={Home} />
                      <Route path="/category/:slug" component={CategoryPage} />
                      <Route path="/product/:slug" component={ProductDetail} />
                      <Route path="/cart" component={Cart} />
                      <Route path="/checkout" component={Checkout} />
                      <Route path="/orders" component={Orders} />
                      <Route path="/orders/:id" component={OrderDetail} />
                      <Route path="/about" component={About} />
                      <Route path="/wallet" component={Wallet} />
                      <Route path="/wallet/deposits" component={Deposits} />
                      <Route path="/wallet/deposit/invoice/:id" component={DepositInvoice} />
                      <Route path="/wallet/deposit/:code" component={Deposit} />
                      <Route path="/profile" component={Profile} />
                      <Route path="/profile/edit" component={ProfileEdit} />
                      <Route path="/referrals" component={Referrals} />
                      <Route component={NotFound} />
                    </Switch>
                  </Layout>
                </Route>
              </Switch>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
};

export default App;
