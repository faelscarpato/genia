import { useState, useEffect, useCallback } from 'react';
import useApp from './useApp';
import PersonService from '../services/PersonService';
import type { Person } from '../types';
import type { PersonCreateInput, PersonInput } from '../utils/validation';

/**
 * Hook reativo para gerenciar pessoas da família atual.
 * Expõe estado (lista, loading, erro) e operações CRUD.
 *
 * @param familyId - Identificador da família. Quando null, retorna lista vazia.
 *
 * @example
 * const { persons, isLoading, createPerson, deletePerson } = usePersons(family?.id);
 */
export function usePersons(familyId: string | null | undefined) {
  const { db } = useApp();

  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Instância do serviço (memoizada enquanto db não mudar)
  const service = db ? new PersonService(db as any) : null;

  /** Carrega todas as pessoas da família */
  const refetch = useCallback(async () => {
    if (!service || !familyId) {
      setPersons([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lista = await service.getAll(familyId);
      setPersons(lista);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao carregar pessoas.');
    } finally {
      setIsLoading(false);
    }
  }, [db, familyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refetch();
  }, [refetch]);

  /**
   * Cria uma nova pessoa e atualiza a lista reativa.
   * @param data - Dados validados da pessoa
   * @returns A pessoa criada
   */
  const createPerson = useCallback(
    async (data: PersonCreateInput): Promise<Person> => {
      if (!service) throw new Error('Banco de dados não disponível.');
      const nova = await service.create(data);
      setPersons((prev) => [...prev, nova].sort((a, b) =>
        a.firstName.localeCompare(b.firstName, 'pt-BR')
      ));
      return nova;
    },
    [db] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /**
   * Atualiza uma pessoa existente e reflete na lista.
   */
  const updatePerson = useCallback(
    async (id: string, data: Partial<PersonInput & { photoUrl?: string }>): Promise<Person> => {
      if (!service) throw new Error('Banco de dados não disponível.');
      const atualizada = await service.update(id, data);
      setPersons((prev) =>
        prev.map((p) => (p.id === id ? atualizada : p))
      );
      return atualizada;
    },
    [db] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /**
   * Remove uma pessoa e seus relacionamentos da lista.
   */
  const deletePerson = useCallback(
    async (id: string): Promise<void> => {
      if (!service) throw new Error('Banco de dados não disponível.');
      await service.delete(id);
      setPersons((prev) => prev.filter((p) => p.id !== id));
    },
    [db] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    persons,
    isLoading,
    error,
    createPerson,
    updatePerson,
    deletePerson,
    refetch,
  };
}

export default usePersons;
