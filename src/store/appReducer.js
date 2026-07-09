/**
 * Estado inicial da aplicação.
 * Contém todos os campos gerenciados globalmente pelo contexto.
 */
const initialState = {
  currentUser: null,
  currentFamily: null,
  currentRoute: '',
  sidebarOpen: true,
  isLoading: false,
  error: null,
  notifications: [],
};

/**
 * Reducer principal da aplicação.
 * Gerencia transições de estado de forma imutável.
 *
 * @param {object} state - Estado atual
 * @param {{ type: string, payload?: any }} action - Ação despachada
 * @returns {object} Novo estado
 */
const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return {
        ...state,
        currentUser: action.payload,
      };

    case 'SET_CURRENT_FAMILY':
      return {
        ...state,
        currentFamily: action.payload,
      };

    case 'SET_CURRENT_ROUTE':
      return {
        ...state,
        currentRoute: action.payload,
      };

    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        sidebarOpen: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

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
      // Reseta para o estado inicial ao fazer logout
      return { ...initialState };

    default:
      return state;
  }
};

export { initialState, appReducer };
