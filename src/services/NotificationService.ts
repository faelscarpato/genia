import type GenealogyDB from './GenealogyDB';
import type { Notification } from '../types';
import { utils } from '../utils/utils';

/** Input para criação de notificação */
export type NotificationCreateInput = Omit<Notification, 'id' | 'criadaEm' | 'lida'>;

/**
 * Serviço responsável por gerenciar notificações do usuário.
 * As notificações são persistidas no store `notifications` do IndexedDB.
 */
export class NotificationService {
  constructor(private db: InstanceType<typeof GenealogyDB>) {}

  /**
   * Cria uma nova notificação.
   * @param data - Dados da notificação (sem id, criadaEm e lida)
   * @returns A notificação criada
   */
  async create(data: NotificationCreateInput): Promise<Notification> {
    const notification: Notification = {
      id: utils.generateId(),
      lida: false,
      criadaEm: new Date().toISOString(),
      ...data,
    };

    await this.db.add('notifications', notification);
    return notification;
  }

  /**
   * Busca todas as notificações de um usuário, ordenadas da mais recente.
   * @param userId - Identificador do usuário
   */
  async getAll(userId: string): Promise<Notification[]> {
    const notifications = await this.db.getByIndex('notifications', 'userId', userId) as Notification[];
    return notifications.sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
  }

  /**
   * Retorna apenas as notificações não lidas de um usuário.
   * @param userId - Identificador do usuário
   */
  async getUnread(userId: string): Promise<Notification[]> {
    const all = await this.getAll(userId);
    return all.filter((n) => !n.lida);
  }

  /**
   * Marca uma notificação como lida.
   * @param id - Identificador da notificação
   */
  async markAsRead(id: string): Promise<void> {
    const notification = await this.db.get('notifications', id) as Notification | undefined;
    if (notification) {
      await this.db.put('notifications', { ...notification, lida: true });
    }
  }

  /**
   * Marca todas as notificações de um usuário como lidas.
   * @param userId - Identificador do usuário
   */
  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getAll(userId);
    for (const n of notifications) {
      if (!n.lida) {
        await this.db.put('notifications', { ...n, lida: true });
      }
    }
  }

  /**
   * Remove uma notificação.
   * @param id - Identificador da notificação
   */
  async delete(id: string): Promise<void> {
    await this.db.delete('notifications', id);
  }

  // ─── Helpers para notificações automáticas ─────────────────────────

  /**
   * Notifica o usuário sobre a conclusão de uma importação GEDCOM.
   */
  async notifyImportComplete(userId: string, count: number): Promise<void> {
    await this.create({
      userId,
      tipo: 'sucesso',
      titulo: 'Importação concluída',
      mensagem: `${count} registros foram importados com sucesso para sua árvore genealógica.`,
      linkDestino: '/dashboard',
    });
  }

  /**
   * Notifica o usuário sobre a conclusão de uma transcrição por IA.
   */
  async notifyTranscriptionComplete(userId: string, documentName: string): Promise<void> {
    await this.create({
      userId,
      tipo: 'info',
      titulo: 'Transcrição finalizada',
      mensagem: `O documento "${documentName}" foi transcrito pela IA. Revise e confirme os dados.`,
      linkDestino: '/documents',
    });
  }

  /**
   * Notifica sobre um documento adicionado sem pessoa vinculada.
   */
  async notifyDocumentWithoutPerson(userId: string, documentName: string): Promise<void> {
    await this.create({
      userId,
      tipo: 'aviso',
      titulo: 'Documento sem pessoa vinculada',
      mensagem: `O documento "${documentName}" ainda não está associado a nenhuma pessoa.`,
      linkDestino: '/documents',
    });
  }
}

export default NotificationService;
