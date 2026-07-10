import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { GenealogyDB } from '../services/GenealogyDB';
import { AuthService } from '../services/AuthService';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// TIPOS
// ============================================================

export interface AppUser {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  createdAt: string;
  isActive: boolean;
}

export interface AppFamily {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadaEm: string;
  linkDestino?: string;
}

export interface AppState {
  currentUser: AppUser | null;
  currentFamily: AppFamily | null;
  families: AppFamily[];
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  darkMode: boolean;
}

export type AppAction =
  | { type: 'SET_USER'; payload: AppUser | null }
  | { type: 'SET_FAMILY'; payload: AppFamily | null }
  | { type: 'SET_FAMILIES'; payload: AppFamily[] }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'LOGOUT' };

// ============================================================
// REDUCER
// ============================================================

const savedDark = localStorage.getItem('darkMode') === 'true';

const initialState: AppState = {
  currentUser: null,
  currentFamily: null,
  families: [],
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: null,
  darkMode: savedDark,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_FAMILY':
      return { ...state, currentFamily: action.payload };
    case 'SET_FAMILIES':
      return { ...state, families: action.payload };
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter((n) => !n.lida).length,
      };
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + (action.payload.lida ? 0 : 1),
      };
    case 'MARK_NOTIFICATION_READ': {
      const updated = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, lida: true } : n
      );
      return {
        ...state,
        notifications: updated,
        unreadCount: updated.filter((n) => !n.lida).length,
      };
    }
    case 'MARK_ALL_READ': {
      const allRead = state.notifications.map((n) => ({ ...n, lida: true }));
      return { ...state, notifications: allRead, unreadCount: 0 };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'TOGGLE_DARK_MODE': {
      const next = !state.darkMode;
      localStorage.setItem('darkMode', String(next));
      return { ...state, darkMode: next };
    }
    case 'LOGOUT':
      return {
        ...initialState,
        loading: false,
        darkMode: state.darkMode,
      };
    default:
      return state;
  }
}

// ============================================================
// CONTEXTO
// ============================================================

export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  db: GenealogyDB | null;
  authService: AuthService | null;
  dbReady: boolean;
  logout: () => void;
  addNotification: (n: Omit<Notification, 'id' | 'criadaEm' | 'lida'>) => Promise<void>;
  switchFamily: (family: AppFamily) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ============================================================
// PROVIDER
// ============================================================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [db, setDb] = useState<GenealogyDB | null>(null);
  const [authService, setAuthService] = useState<AuthService | null>(null);
  const [dbReady, setDbReady] = useState(false);

  // Apply dark mode class to html element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
  }, [state.darkMode]);

  // Initialize DB and restore session
  useEffect(() => {
    const init = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        const genealogyDB = new GenealogyDB();
        await genealogyDB.init();

        const auth = new AuthService(genealogyDB as any);

        // Restore session from localStorage
        const session = auth.getSession();

        if (session) {
          const userRecord = await genealogyDB.get('users', session.userId);
          if (userRecord) {
            const { passwordHash: _h, passwordSalt: _s, ...safeUser } = userRecord;
            dispatch({ type: 'SET_USER', payload: safeUser });

            const families = await genealogyDB.getFamiliesForUser(session.userId);
            dispatch({ type: 'SET_FAMILIES', payload: families });
            if (families.length > 0) {
              dispatch({ type: 'SET_FAMILY', payload: families[0] });
            }

            // Load notifications
            const notifs = await genealogyDB.getUnreadNotifications(session.userId);
            dispatch({ type: 'SET_NOTIFICATIONS', payload: notifs });
          } else {
            auth.logout();
          }
        } else {
          // Create demo user on first run
          const demo = await auth.ensureDemoUser();
          const { passwordHash: _h, passwordSalt: _s, ...safeDemo } = demo;
          dispatch({ type: 'SET_USER', payload: safeDemo });

          let families = await genealogyDB.getFamiliesForUser(demo.id);
          if (families.length === 0) {
            const fam: AppFamily = {
              id: uuidv4(),
              ownerId: demo.id,
              name: 'Minha Familia',
              description: 'Familia de demonstracao',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await genealogyDB.add('families', fam);
            families = [fam];
          }
          dispatch({ type: 'SET_FAMILIES', payload: families });
          dispatch({ type: 'SET_FAMILY', payload: families[0] });

          // Save demo session
          auth['_saveSession'](demo);
        }

        setDb(genealogyDB);
        setAuthService(auth);
        setDbReady(true);
      } catch (err: any) {
        console.error('[AppContext] init error:', err);
        dispatch({ type: 'SET_ERROR', payload: 'Falha ao inicializar o banco de dados.' });
        setDbReady(true);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    init();
  }, []);

  const logout = useCallback(() => {
    authService?.logout();
    dispatch({ type: 'LOGOUT' });
  }, [authService]);

  const addNotification = useCallback(async (
    data: Omit<Notification, 'id' | 'criadaEm' | 'lida'>
  ) => {
    if (!db || !state.currentUser) return;
    const notif: Notification = {
      ...data,
      id: uuidv4(),
      lida: false,
      criadaEm: new Date().toISOString(),
    };
    await db.add('notifications', notif);
    dispatch({ type: 'ADD_NOTIFICATION', payload: notif });
  }, [db, state.currentUser]);

  const switchFamily = useCallback((family: AppFamily) => {
    dispatch({ type: 'SET_FAMILY', payload: family });
  }, []);

  const value: AppContextValue = {
    state,
    dispatch,
    db,
    authService,
    dbReady,
    logout,
    addNotification,
    switchFamily,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ============================================================
// HOOK
// ============================================================

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext deve ser usado dentro de <AppProvider>');
  return ctx;
}

export default AppContext;
