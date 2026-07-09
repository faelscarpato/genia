import { useState, useCallback, useEffect } from 'react';
import useApp from './useApp';
import { useDebounce } from './useDebounce';
import type { SearchResults } from '../types';

const RESULTADOS_VAZIOS: SearchResults = {
  persons: [],
  events: [],
  documents: [],
  sources: [],
  total: 0,
};

/**
 * Hook para busca global com debounce na base de dados local (IndexedDB).
 *
 * Utiliza o hook `useDebounce` existente para evitar chamadas excessivas
 * ao banco durante a digitação.
 *
 * @param delay - Tempo de debounce em milissegundos (padrão: 300ms)
 *
 * @example
 * const { query, setQuery, results, isLoading } = useSearch();
 */
export function useSearch(delay = 300) {
  const { db, dbReady } = useApp();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aplica debounce na query para não sobrecarregar o banco
  const queryDebounced = useDebounce(query, delay);

  useEffect(() => {
    // Não busca se o banco não estiver pronto ou query for muito curta
    if (!dbReady || !db || queryDebounced.trim().length < 2) {
      setResults(queryDebounced.trim().length === 0 ? null : RESULTADOS_VAZIOS);
      return;
    }

    let cancelado = false;

    const executarBusca = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await db.search(queryDebounced);
        if (!cancelado) {
          setResults(res);
        }
      } catch (err) {
        if (!cancelado) {
          setError('Erro ao realizar a busca. Tente novamente.');
          setResults(RESULTADOS_VAZIOS);
        }
      } finally {
        if (!cancelado) {
          setIsLoading(false);
        }
      }
    };

    executarBusca();

    return () => {
      cancelado = true;
    };
  }, [queryDebounced, db, dbReady]);

  /** Limpa a busca e os resultados */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch,
  };
}

export default useSearch;
