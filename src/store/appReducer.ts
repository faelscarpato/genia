import type { AppState, AppAction } from '../types';

// ============================================================
// ESTADO INICIAL
// ============================================================

export const initialState: AppState = {
  currentUser: null,
  currentFamily: null,
  currentRoute: '',
  sidebarOpen: true,
  isLoading: false,
  error: null,
  notifications: [],
};

// ============================================================
// REDUCER
// ============================================================

/**
 * Reducer principal da aplicação.
 * Gerencia transições de estado de forma imutável.
 *
 * @param state - Estado atual
 * @param action - Ação despachada
 * @returns Novo estado
 */
export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };

    case 'SET_CURRENT_FAMILY':
      return { ...state, currentFamily: action.payload };

    case 'SET_CURRENT_ROUTE':
      return { ...state, currentRoute: action.payload };

    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, lida: true } : n
        ),
      };

    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, lida: true })),
      };

    case 'LOGOUT':
      return { ...initialState };

    default:
      return state;
  }
};
