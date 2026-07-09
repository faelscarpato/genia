import GenealogyDB from '../services/GenealogyDB';
import type { Notification } from '../types';

/**
 * Interface base para repositórios de dados.
 * Permite trocar a implementação (IndexedDB → Supabase) sem alterar os serviços.
 */
export interface IRepository<T, CreateInput, UpdateInput = Partial<CreateInput>> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Record<string, unknown>): Promise<T[]>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
  count(filter?: Record<string, unknown>): Promise<number>;
}

/**
 * Implementação de repositório de notificações para IndexedDB.
 * Quando migrar para Supabase, apenas esta classe precisa ser substituída.
 */
export class NotificationRepository {
  constructor(private db: InstanceType<typeof GenealogyDB>) {}

  async findById(id: string): Promise<Notification | null> {
    return (await this.db.get('notifications', id)) as Notification ?? null;
  }

  async findAll(): Promise<Notification[]> {
    return this.db.getAll('notifications') as Promise<Notification[]>;
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.db.getByIndex('notifications', 'userId', userId) as Promise<Notification[]>;
  }

  async findUnread(userId: string): Promise<Notification[]> {
    const all = await this.findByUser(userId);
    return all.filter((n) => !n.lida);
  }

  async create(data: Omit<Notification, 'id' | 'criadaEm' | 'lida'>): Promise<Notification> {
    const { utils } = await import('../utils/utils');
    const notif: Notification = {
      id: utils.generateId(),
      lida: false,
      criadaEm: new Date().toISOString(),
      ...data,
    };
    await this.db.add('notifications', notif);
    return notif;
  }

  async update(id: string, data: Partial<Notification>): Promise<Notification> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Notificação não encontrada.');
    const updated = { ...existing, ...data };
    await this.db.put('notifications', updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete('notifications', id);
  }

  async count(): Promise<number> {
    return this.db.count('notifications');
  }

  async markAllAsRead(userId: string): Promise<void> {
    const list = await this.findByUser(userId);
    for (const n of list) {
      if (!n.lida) await this.db.put('notifications', { ...n, lida: true });
    }
  }
}

/**
 * Factory que cria todos os repositórios.
 * Ponto central de criação — facilita a troca do backend no futuro.
 */
export function createRepositories(db: InstanceType<typeof GenealogyDB>) {
  return {
    notifications: new NotificationRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
