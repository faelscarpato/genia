import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// TIPOS
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // PBKDF2 hex
  passwordSalt: string; // hex
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  photoUrl?: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  expiresAt: number; // timestamp ms
}

export interface LoginResult {
  success: boolean;
  user?: Omit<User, 'passwordHash' | 'passwordSalt'>;
  error?: string;
}

// ============================================================
// CRYPTO HELPERS  — WebCrypto PBKDF2 (seguro, nativo do browser)
// ============================================================

const PBKDF2_ITERATIONS = 100_000;
const HASH_ALGO = 'SHA-256';
const KEY_LENGTH_BITS = 256;
const SESSION_KEY = 'genia_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

async function generateSalt(): Promise<string> {
  const buf = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const saltBuf = new Uint8Array(salt.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuf, iterations: PBKDF2_ITERATIONS, hash: HASH_ALGO },
    keyMaterial,
    KEY_LENGTH_BITS
  );
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
  const computed = await hashPassword(password, salt);
  return computed === storedHash;
}

// ============================================================
// AUTHSERVICE
// ============================================================

export class AuthService {
  private db: IDBPDatabase;

  constructor(db: IDBPDatabase) {
    this.db = db;
  }

  // --------------------------------------------------------
  // REGISTRO
  // --------------------------------------------------------
  async register(data: { email: string; password: string; name: string }): Promise<LoginResult> {
    try {
      const existing = await this.db.getFromIndex('users', 'by-email', data.email.toLowerCase());
      if (existing) return { success: false, error: 'Email já cadastrado.' };

      const salt = await generateSalt();
      const hash = await hashPassword(data.password, salt);
      const now = new Date().toISOString();

      const user: User = {
        id: uuidv4(),
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      };

      await this.db.add('users', user);
      this._saveSession(user);

      const { passwordHash: _, passwordSalt: __, ...safeUser } = user;
      return { success: true, user: safeUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao registrar.' };
    }
  }

  // --------------------------------------------------------
  // LOGIN
  // --------------------------------------------------------
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const user: User | undefined = await this.db.getFromIndex('users', 'by-email', email.toLowerCase());
      if (!user) return { success: false, error: 'Usuário não encontrado.' };
      if (!user.isActive) return { success: false, error: 'Conta desativada.' };

      // Suporte legado: senhas antigas com hash djb2 (prefixo 'h_')
      let valid = false;
      if (user.passwordHash.startsWith('h_') || !user.passwordSalt) {
        // Migrar para PBKDF2 na próxima oportunidade
        const legacyHash = this._legacyHash(password);
        valid = legacyHash === user.passwordHash;
        if (valid) await this._migrateLegacyPassword(user, password);
      } else {
        valid = await verifyPassword(password, user.passwordSalt, user.passwordHash);
      }

      if (!valid) return { success: false, error: 'Senha incorreta.' };

      this._saveSession(user);
      const { passwordHash: _, passwordSalt: __, ...safeUser } = user;
      return { success: true, user: safeUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao fazer login.' };
    }
  }

  // --------------------------------------------------------
  // SESSAO
  // --------------------------------------------------------
  getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session: AuthSession = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('currentUserId');
  }

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  // --------------------------------------------------------
  // ALTERAR SENHA
  // --------------------------------------------------------
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user: User | undefined = await this.db.get('users', userId);
      if (!user) return { success: false, error: 'Usuário não encontrado.' };

      const valid = await verifyPassword(currentPassword, user.passwordSalt, user.passwordHash);
      if (!valid) return { success: false, error: 'Senha atual incorreta.' };

      const salt = await generateSalt();
      const hash = await hashPassword(newPassword, salt);

      await this.db.put('users', {
        ...user,
        passwordHash: hash,
        passwordSalt: salt,
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao alterar senha.' };
    }
  }

  // --------------------------------------------------------
  // PRIVADOS
  // --------------------------------------------------------
  private _saveSession(user: User): void {
    const session: AuthSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem('currentUserId', user.id);
  }

  private _legacyHash(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
  }

  private async _migrateLegacyPassword(user: User, plainPassword: string): Promise<void> {
    try {
      const salt = await generateSalt();
      const hash = await hashPassword(plainPassword, salt);
      await this.db.put('users', {
        ...user,
        passwordHash: hash,
        passwordSalt: salt,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // migração silenciosa — não bloqueia login
    }
  }

  // --------------------------------------------------------
  // CRIAR USUARIO DEMO (para primeira execução)
  // --------------------------------------------------------
  async ensureDemoUser(): Promise<User> {
    const DEMO_EMAIL = 'demo@genealogiaia.com.br';
    const existing: User | undefined = await this.db.getFromIndex('users', 'by-email', DEMO_EMAIL);
    if (existing) return existing;

    const salt = await generateSalt();
    const hash = await hashPassword('demo123', salt);
    const now = new Date().toISOString();

    const demo: User = {
      id: uuidv4(),
      email: DEMO_EMAIL,
      name: 'Usuário Demo',
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    await this.db.add('users', demo);
    return demo;
  }
}

export default AuthService;
