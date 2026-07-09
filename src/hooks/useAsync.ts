import { useState, useCallback, useEffect, useRef } from 'react';

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
}

interface UseAsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions = { immediate: true }
): {
  execute: () => Promise<T | undefined>;
  reset: () => void;
  state: AsyncState<T>;
} {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
    isError: false,
    isIdle: !options.immediate,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isIdle: false,
    }));

    try {
      const response = await asyncFunction();
      
      if (mountedRef.current) {
        setState({
          data: response,
          isLoading: false,
          error: null,
          isSuccess: true,
          isError: false,
          isIdle: false,
        });
        
        if (options.onSuccess) {
          options.onSuccess(response);
        }
      }
      
      return response;
    } catch (error) {
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        
        setState({
          data: null,
          isLoading: false,
          error: errorMessage,
          isSuccess: false,
          isError: true,
          isIdle: false,
        });
        
        if (options.onError && error instanceof Error) {
          options.onError(error);
        }
      }
    }
  }, [asyncFunction, options]);

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
      isSuccess: false,
      isError: false,
      isIdle: true,
    });
  }, []);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.immediate]);

  return { execute, reset, state };
}

export default useAsync;