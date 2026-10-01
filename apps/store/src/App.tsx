import React from 'react';
import { Route, Switch } from 'wouter';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { SettingsProvider } from './lib/settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CategoryPage } from './pages/Category';
import { ProductDetail } from './pages/ProductDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { About } from './pages/About';
import { Orders } from './pages/Orders';
import { Wallet } from './pages/Wallet';
import { Deposits } from './pages/Deposits';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeProvider>
          <AuthProvider>
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
                    <Route path="/about" component={About} />
                    <Route path="/orders" component={Orders} />
                    <Route path="/wallet" component={Wallet} />
                    <Route path="/wallet/deposits" component={Deposits} />
                    <Route path="/profile" component={Profile} />
                    <Route component={NotFound} />
                  </Switch>
                </Layout>
              </Route>
            </Switch>
          </AuthProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
};

export default App;
