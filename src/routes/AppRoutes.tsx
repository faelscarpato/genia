import React, { useContext, useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';

// ============================================================
// LAZY LOAD DAS PÁGINAS
// ============================================================

const LandingPage   = React.lazy(() => import('../components/features/LandingPage'));
const AuthPage      = React.lazy(() => import('../components/features/AuthPage'));
const Dashboard     = React.lazy(() => import('../components/features/Dashboard'));
const FamilyTree    = React.lazy(() => import('../components/features/FamilyTree'));
const Profile       = React.lazy(() => import('../components/features/Profile'));
const Settings      = React.lazy(() => import('../components/features/Settings'));
const DocumentsPage = React.lazy(() => import('../components/features/DocumentsPage'));

// ============================================================
// LOADING FALLBACK
// ============================================================

interface LoadingFallbackProps {
  error?: boolean;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ error = false }) => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background">
    {error ? (
      <>
        <span className="material-symbols-outlined text-error text-5xl">error_outline</span>
        <p className="text-on-surface-variant font-body-md text-center max-w-xs">
          Tempo limite de inicialização excedido. Recarregue a página para tentar novamente.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-2 bg-secondary text-on-secondary rounded-lg font-label-md hover:bg-secondary/90 transition-colors"
        >
          Recarregar
        </button>
      </>
    ) : (
      <>
        <div className="w-12 h-12 rounded-full border-4 border-surface-container-high border-t-secondary animate-spin" />
        <p className="text-on-surface-variant font-body-md">Carregando…</p>
      </>
    )}
  </div>
);

// ============================================================
// ROTAS PROTEGIDAS
// ============================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Aguarda o banco estar pronto (com timeout de 10s) e redireciona
 * para /auth se não houver usuário autenticado.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state, dbReady } = useAppContext();
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dbReady) {
      timerRef.current = setTimeout(() => setTimedOut(true), 10_000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dbReady]);

  if (dbReady) {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!state.currentUser) {
      return <Navigate to="/auth" replace />;
    }
    return <>{children}</>;
  }

  return <LoadingFallback error={timedOut} />;
};

// ============================================================
// REDIRECT SE JA LOGADO
// ============================================================

interface RedirectIfLoggedInProps {
  children: React.ReactNode;
}

const RedirectIfLoggedIn: React.FC<RedirectIfLoggedInProps> = ({ children }) => {
  const { state, dbReady } = useAppContext();
  if (dbReady && state.currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// ============================================================
// APP ROUTES
// ============================================================

const AppRoutes: React.FC = () => {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/"        element={<RedirectIfLoggedIn><LandingPage /></RedirectIfLoggedIn>} />
        <Route path="/landing" element={<RedirectIfLoggedIn><LandingPage /></RedirectIfLoggedIn>} />
        <Route path="/auth/*" element={<AuthPage />} />

        {/* Rotas protegidas */}
        <Route
          element={
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard"          element={<Dashboard />} />
          <Route path="/family/:familyId"   element={<FamilyTree />} />
          <Route path="/profile"            element={<Profile />} />
          <Route path="/person/:personId"   element={<Profile />} />
          <Route path="/settings"           element={<Settings />} />
          <Route path="/documents"          element={<DocumentsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default AppRoutes;
