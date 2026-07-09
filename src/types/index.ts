// ============================================================
// Tipos de Usuário
// ============================================================
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// ============================================================
// Tipos de Família
// ============================================================
export interface Family {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Tipos de Pessoa
// ============================================================
export interface Person {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  occupation?: string;
  notes?: string;
  /** Base64 da foto ou URL */
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Tipos de Relacionamento
// ============================================================
export type RelationshipType =
  | 'father'
  | 'mother'
  | 'son'
  | 'daughter'
  | 'spouse'
  | 'sibling'
  | 'grandfather'
  | 'grandmother'
  | 'grandson'
  | 'granddaughter'
  | 'uncle'
  | 'aunt'
  | 'nephew'
  | 'niece'
  | 'cousin';

export interface Relationship {
  id: string;
  familyId: string;
  fromPersonId: string;
  toPersonId: string;
  type: RelationshipType;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Tipos de Evento
// ============================================================
export type EventType = 'birth' | 'death' | 'marriage' | 'divorce' | 'adoption' | 'immigration' | 'other';

/** Renomeado para GenealogyEvent para evitar conflito com a API nativa Event */
export interface GenealogyEvent {
  id: string;
  familyId: string;
  personId?: string;
  type: EventType;
  date?: string;
  place?: string;
  description?: string;
  sources?: string[];
  createdAt: string;
  updatedAt: string;
}

// Mantém alias Event para compatibilidade com código legado
export type Event = GenealogyEvent;

// ============================================================
// Tipos de Documento
// ============================================================
export type DocumentType =
  | 'birth_certificate'
  | 'death_certificate'
  | 'marriage_certificate'
  | 'photo'
  | 'letter'
  | 'other';

export interface GenealogyDocument {
  id: string;
  familyId: string;
  personId?: string;
  type: DocumentType;
  title: string;
  description?: string;
  /** Base64 do arquivo armazenado no IndexedDB */
  fileData?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

// Mantém alias Document para compatibilidade
export type Document = GenealogyDocument;

// ============================================================
// Tipos de Fonte
// ============================================================
export interface Source {
  id: string;
  familyId: string;
  personId?: string;
  documentId?: string;
  title: string;
  author?: string;
  publication?: string;
  repository?: string;
  citation?: string;
  reliability?: 'high' | 'medium' | 'low';
  /** Texto transcrito pela IA */
  transcribedText?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Tipos de Notificação
// ============================================================
export interface Notification {
  /** Identificador único da notificação */
  id: string;
  /** Identificador do usuário dono da notificação */
  userId?: string;
  /** Tipo visual da notificação */
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
  /** Título curto da notificação */
  titulo: string;
  /** Mensagem descritiva */
  mensagem: string;
  /** Se a notificação já foi lida */
  lida: boolean;
  /** ISO string do momento de criação */
  criadaEm: string;
  /** Rota opcional para onde o usuário deve ser direcionado ao clicar */
  linkDestino?: string;
}

// ============================================================
// Tipos de Resultado de Busca
// ============================================================
export interface SearchResults {
  persons: Person[];
  events: GenealogyEvent[];
  documents: GenealogyDocument[];
  sources: Source[];
  total: number;
}

// ============================================================
// Tipos de Transcrição por IA
// ============================================================
export interface TranscriptionResult {
  textoCompleto: string;
  nomeIdentificado?: string;
  datasIdentificadas?: string[];
  locaisIdentificados?: string[];
  tipoDocumento?: string;
  confianca?: number;
}

// ============================================================
// Estado da Aplicação
// ============================================================
export interface AppState {
  currentUser: User | null;
  currentFamily: Family | null;
  currentRoute: string;
  sidebarOpen: boolean;
  isLoading: boolean;
  error: string | null;
  notifications: Notification[];
}

// ============================================================
// Actions do Reducer
// ============================================================
export type AppAction =
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_CURRENT_FAMILY'; payload: Family | null }
  | { type: 'SET_CURRENT_ROUTE'; payload: string }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'LOGOUT' };

// ============================================================
// Tipos de Toast/Snackbar
// ============================================================
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// ============================================================
// Tipos de Validação de Formulário
// ============================================================
export interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: Record<string, string>;
  data?: T;
}

// ============================================================
// Tipos de API
// ============================================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================
// Tipos de Navegação
// ============================================================
export interface NavItem {
  path: string;
  label: string;
  icon?: string;
  children?: NavItem[];
}

// ============================================================
// Tipos de Banco de Dados
// ============================================================
export interface IndexedDBConfig {
  name: string;
  version: number;
  stores: StoreDefinition[];
}

export interface StoreDefinition {
  name: string;
  keyPath: string;
  indexes: IndexDefinition[];
}

export interface IndexDefinition {
  name: string;
  keyPath: string;
  options?: IDBIndexParameters;
}

// ============================================================
// Tipos de Importação/Exportação GEDCOM
// ============================================================
export interface ParsedGedcom {
  pessoas: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>[];
  relacionamentos: Array<{ fromRef: string; toRef: string; type: RelationshipType }>;
  eventos: Omit<GenealogyEvent, 'id' | 'createdAt' | 'updatedAt'>[];
  fontes: Omit<Source, 'id' | 'createdAt' | 'updatedAt'>[];
  totalPessoas: number;
  totalFamilias: number;
  totalEventos: number;
}
