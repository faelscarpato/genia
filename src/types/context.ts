import type { AppState, AppAction, Notification } from '../types';
import type GenealogyDB from '../services/GenealogyDB';
import type AuthService from '../services/AuthService';
import type FamilyService from '../services/FamilyService';
import type { Dispatch } from 'react';

/**
 * Valor exposto pelo AppContext.
 * Inclui o estado global, dispatch e instâncias dos serviços.
 */
export interface AppContextValue {
  /** Estado global da aplicação */
  state: AppState;
  /** Dispatch para enviar ações ao reducer */
  dispatch: Dispatch<AppAction>;
  /** Instância do banco IndexedDB (null antes da inicialização) */
  db: GenealogyDB | null;
  /** Serviço de autenticação (null antes da inicialização) */
  authService: AuthService | null;
  /** Serviço de famílias (null antes da inicialização) */
  familyService: FamilyService | null;
  /** Indica se o banco e os serviços estão prontos para uso */
  dbReady: boolean;
}

export type { Notification };
