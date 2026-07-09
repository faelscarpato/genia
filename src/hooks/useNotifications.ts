import { useState, useEffect, useCallback, useRef } from 'react';
import useApp from './useApp';
import NotificationService from '../services/NotificationService';
import type { Notification } from '../types';

const POLLING_INTERVAL = 30_000; // 30 segundos

/**
 * Hook para gerenciar notificações do usuário.
 * Faz polling periódico a cada 30s para verificar novas notificações.
 *
 * @example
 * const { notifications, unreadCount, markAsRead } = useNotifications();
 */
export function useNotifications() {
  const { db, user } = useApp();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const service = db ? new NotificationService(db as any) : null;

  /** Total de notificações não lidas */
  const unreadCount = notifications.filter((n) => !n.lida).length;

  /** Carrega todas as notificações do usuário */
  const refetch = useCallback(async () => {
    if (!service || !user?.id) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    try {
      const lista = await service.getAll(user.id);
      setNotifications(lista);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setIsLoading(false);
    }
  }, [db, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Carrega ao montar e inicia polling
  useEffect(() => {
    refetch();

    pollingRef.current = setInterval(refetch, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [refetch]);

  /**
   * Marca uma notificação como lida.
   */
  const markAsRead = useCallback(
    async (id: string) => {
      if (!service) return;
      await service.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      );
    },
    [db] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /**
   * Marca todas as notificações como lidas.
   */
  const markAllAsRead = useCallback(async () => {
    if (!service || !user?.id) return;
    await service.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
  }, [db, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Remove uma notificação.
   */
  const deleteNotification = useCallback(
    async (id: string) => {
      if (!service) return;
      await service.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [db] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  };
}

export default useNotifications;
