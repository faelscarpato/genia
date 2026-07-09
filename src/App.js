import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Toast from './components/ui/Toast';
import ErrorBoundary from './components/ui/ErrorBoundary';

const App = () => {
  const [toasts, setToasts] = useState([]);

  // Show toast helper (exposed via window for components to use)
  useEffect(() => {
    window.showAppToast = (message, type = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
    return () => { delete window.showAppToast; };
  }, []);

  return (
    <Router>
      <div className="bg-heritage-50 min-h-screen">
        <div id="app">
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </div>

        {/* Toast container */}
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </div>
      </div>
    </Router>
  );
};

export default App;