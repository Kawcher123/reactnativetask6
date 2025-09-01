import React, { useCallback, useRef } from 'react';

export const useDebounced = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
};

export const useDebouncedSearch = (delay: number = 300) => {
  const [searchValue, setSearchValue] = React.useState('');
  const [debouncedValue, setDebouncedValue] = React.useState('');

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchValue, delay]);

  return [searchValue, debouncedValue, setSearchValue] as const;
};
