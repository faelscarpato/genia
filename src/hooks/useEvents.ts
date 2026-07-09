import { useState, useEffect, useCallback } from 'react';
import useApp from './useApp';
import EventService from '../services/EventService';
import type { EventCreateInput } from '../services/EventService';
import type { GenealogyEvent } from '../types';

/**
 * Hook reativo para gerenciar eventos da família atual.
 *
 * @param familyId - Identificador da família. Quando null, retorna lista vazia.
 *
 * @example
 * const { events, isLoading, createEvent, deleteEvent } = useEvents(family?.id);
 */
export function useEvents(familyId: string | null | undefined) {
  const { db } = useApp();

  const [events, setEvents] = useState<GenealogyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = db ? new EventService(db as any) : null;

  /** Recarrega todos os eventos da família */
  const refetch = useCallback(async () => {
    if (!service || !familyId) {
      setEvents([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lista = await service.getAll(familyId);
      setEvents(lista);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao carregar eventos.');
    } finally {
      setIsLoading(false);
    }
  }, [db, familyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refetch();
  }, [refetch]);

  /**
   * Cria um novo evento e atualiza a lista reativa.
   */
  const createEvent = useCallback(
    async (data: EventCreateInput): Promise<GenealogyEvent> => {
      if (!service) throw new Error('Banco de dados não disponível.');
      const novo = await service.create(data);
      setEvents((prev) => [...prev, novo].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')));
      return novo;
    },
    [db] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /**
   * Atualiza um evento existente.
   */
  const updateEvent = useCallback(
    async (id: string, data: Partial<EventCreateInput>): Promise<GenealogyEvent> => {
      if (!service) throw new Error('Banco de dados não disponível.');
      const atualizado = await service.update(id, data);
      setEvents((prev) => prev.map((e) => (e.id === id ? atualizado : e)));
      return atualizado;
    },
    [db] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /**
   * Remove um evento da lista.
   */
  const deleteEvent = useCallback(
    async (id: string): Promise<void> => {
      if (!service) throw new Error('Banco de dados não disponível.');
      await service.delete(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    },
    [db] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch,
  };
}

export default useEvents;
