import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import AppRoutes from './routes/AppRoutes';
import Toast from './components/ui/Toast';
import ErrorBoundary from './components/ui/ErrorBoundary';
import type { Toast as ToastType } from './types';

// ============================================================
// TIPOS
// ============================================================

interface AppToast {
  id: number;
  message: string;
  type: ToastType['type'];
}

// ============================================================
// APP
// ============================================================

const App: React.FC = () => {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  useEffect(() => {
    // Expoe helper global para componentes dispararem toasts sem prop drilling
    (window as any).showAppToast = (message: string, type: AppToast['type'] = 'info') => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      delete (window as any).showAppToast;
    };
  }, []);

  return (
    <Router>
      <AppProvider>
        <div className="bg-heritage-50 min-h-screen">
          <div id="app">
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </div>

          {/* Toast container */}
          <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
            {toasts.map((toast) => (
              <Toast
                key={toast.id}
                message={toast.message}
                type={toast.type}
                onClose={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
              />
            ))}
          </div>
        </div>
      </AppProvider>
    </Router>
  );
};

export default App;
