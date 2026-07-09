import { useState, useEffect, useCallback } from 'react';
import useApp from './useApp';
import DocumentService from '../services/DocumentService';
import type { DocumentCreateInput } from '../services/DocumentService';
import type { GenealogyDocument } from '../types';

/**
 * Hook reativo para gerenciar documentos da família atual.
 *
 * @param familyId - Identificador da família. Quando null, retorna lista vazia.
 *
 * @example
 * const { documents, isLoading, uploadDocument, deleteDocument } = useDocuments(family?.id);
 */
export function useDocuments(familyId: string | null | undefined) {
  const { db } = useApp();

  const [documents, setDocuments] = useState<GenealogyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = db ? new DocumentService(db as any) : null;

  /** Recarrega todos os documentos da família */
  const refetch = useCallback(async () => {
    if (!service || !familyId) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lista = await service.getAll(familyId);
      setDocuments(lista);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao carregar documentos.');
    } finally {
      setIsLoading(false);
    }
  }, [db, familyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refetch();
  }, [refetch]);

  /**
   * Faz upload de um novo documento.
   */
  const uploadDocument = useCallback(
    async (data: DocumentCreateInput): Promise<GenealogyDocument> => {
      if (!service) throw new Error('Banco de dados não disponível.');
      const novo = await service.create(data);
      setDocuments((prev) => [novo, ...prev]);
      return novo;
    },
    [db] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /**
   * Remove um documento.
   */
  const deleteDocument = useCallback(
    async (id: string): Promise<void> => {
      if (!service) throw new Error('Banco de dados não disponível.');
      await service.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    },
    [db] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    documents,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    refetch,
  };
}

export default useDocuments;
