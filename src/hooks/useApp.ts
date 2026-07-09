import { useContext, useCallback } from 'react';
import AppContext from '../store/AppContext';
import type { User, Family, Notification } from '../types';
import type GenealogyDB from '../services/GenealogyDB';
import type AuthService from '../services/AuthService';
import type FamilyService from '../services/FamilyService';

/**
 * Hook principal de acesso ao estado global da aplicação.
 * Deve ser utilizado dentro de um componente descendente de AppProvider.
 *
 * @example
 * const { user, isAuthenticated, logout } = useApp();
 */
export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }

  const { state, dispatch, db, authService, familyService, dbReady } = context;

  /** Define o usuário atual no estado global */
  const setCurrentUser = useCallback(
    (user: User | null) => {
      dispatch({ type: 'SET_CURRENT_USER', payload: user });
    },
    [dispatch]
  );

  /** Define a família atual no estado global */
  const setCurrentFamily = useCallback(
    (family: Family | null) => {
      dispatch({ type: 'SET_CURRENT_FAMILY', payload: family });
    },
    [dispatch]
  );

  /** Abre ou fecha o sidebar */
  const setSidebarOpen = useCallback(
    (isOpen: boolean) => {
      dispatch({ type: 'SET_SIDEBAR_OPEN', payload: isOpen });
    },
    [dispatch]
  );

  /** Alterna o estado do sidebar */
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: !state.sidebarOpen });
  }, [dispatch, state.sidebarOpen]);

  /** Define o estado de loading global */
  const setLoading = useCallback(
    (isLoading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: isLoading });
    },
    [dispatch]
  );

  /** Define uma mensagem de erro global */
  const setError = useCallback(
    (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    },
    [dispatch]
  );

  /** Adiciona uma nova notificação à lista */
  const addNotification = useCallback(
    (notification: Notification) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    },
    [dispatch]
  );

  /** Marca uma notificação como lida pelo id */
  const markNotificationRead = useCallback(
    (id: string) => {
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
    },
    [dispatch]
  );

  /** Marca todas as notificações como lidas */
  const markAllNotificationsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
  }, [dispatch]);

  /** Encerra a sessão do usuário e redireciona para a raiz */
  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem('currentUserId');
    window.location.href = '/';
  }, [dispatch]);

  return {
    // Estado
    user: state.currentUser,
    family: state.currentFamily,
    isSidebarOpen: state.sidebarOpen,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated: !!state.currentUser,
    notifications: state.notifications,

    // Serviços e banco de dados
    db: db as GenealogyDB | null,
    authService: authService as AuthService | null,
    familyService: familyService as FamilyService | null,
    dbReady,

    // Ações
    setCurrentUser,
    setCurrentFamily,
    setSidebarOpen,
    toggleSidebar,
    setLoading,
    setError,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    logout,

    // Acesso direto ao dispatch para ações customizadas
    dispatch,
  };
}

export default useApp;
