import { useState, useCallback, useEffect } from 'react';

interface UseDebounceOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function useDebounce<T>(
  value: T,
  delay: number,
  options: UseDebounceOptions = { leading: false, trailing: true }
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (options.trailing) {
      const timer = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [value, delay, options.trailing]);

  useEffect(() => {
    if (options.leading && debouncedValue !== value) {
      setDebouncedValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options.leading]);

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        callback(...args);
      }, delay);

      setTimeoutId(newTimeoutId);
    },
    [callback, delay, timeoutId]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}

export default useDebounce;