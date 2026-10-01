import React from 'react';
import { Route, Switch, Link } from 'wouter';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { SettingsProvider } from './lib/settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const NotFound: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 text-center space-y-4" dir="rtl">
    <h1 className="text-6xl font-black text-primary">404</h1>
    <h2 className="text-2xl font-bold">الصفحة غير موجودة</h2>
    <p className="text-muted-foreground text-sm max-w-sm">
      عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.
    </p>
    <Link
      href="/"
      className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity"
    >
      العودة للرئيسية
    </Link>
  </div>
);

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeProvider>
          <AuthProvider>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              <Route component={NotFound} />
            </Switch>
          </AuthProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
};

export default App;
