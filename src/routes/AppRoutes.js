import React, { useContext, useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AppContext from '../store/AppContext';

// Lazy load das páginas
const LandingPage    = React.lazy(() => import('../components/features/LandingPage'));
const AuthPage       = React.lazy(() => import('../components/features/AuthPage'));
const Dashboard      = React.lazy(() => import('../components/features/Dashboard'));
const FamilyTree     = React.lazy(() => import('../components/features/FamilyTree'));
const Profile        = React.lazy(() => import('../components/features/Profile'));
const Settings       = React.lazy(() => import('../components/features/Settings'));
const DocumentsPage  = React.lazy(() => import('../components/features/DocumentsPage'));

/**
 * Indicador de carregamento exibido enquanto os chunks lazy são carregados
 * ou enquanto o banco de dados está sendo inicializado.
 */
const LoadingFallback = ({ error = false }) => (
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

/**
 * Rota protegida: aguarda o banco estar pronto (com timeout de 10s),
 * redireciona para /auth se não houver usuário autenticado.
 */
const ProtectedRoute = ({ children }) => {
  const { state, dbReady } = useContext(AppContext);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!dbReady) {
      // Inicia o contador de 10 segundos apenas se o banco ainda não estiver pronto
      timerRef.current = setTimeout(() => setTimedOut(true), 10_000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dbReady]);

  // Banco pronto e usuário autenticado → cancela timer e renderiza normalmente
  if (dbReady) {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!state.currentUser) {
      return <Navigate to="/auth" replace />;
    }
    return children;
  }

  // Banco ainda inicializando → exibe loading ou mensagem de erro de timeout
  return <LoadingFallback error={timedOut} />;
};

/**
 * Redireciona usuários já autenticados para o dashboard.
 */
const RedirectIfLoggedIn = ({ children }) => {
  const { state, dbReady } = useContext(AppContext);

  if (dbReady && state.currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Rotas públicas — redireciona se já autenticado */}
        <Route path="/" element={<RedirectIfLoggedIn><LandingPage /></RedirectIfLoggedIn>} />
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/family/:familyId" element={<FamilyTree />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/person/:personId" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/documents" element={<DocumentsPage />} />
        </Route>

        {/* Fallback: redireciona para a raiz */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default AppRoutes;
