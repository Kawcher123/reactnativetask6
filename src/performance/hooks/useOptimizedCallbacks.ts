import { useCallback, useRef } from 'react';

export const useOptimizedCallbacks = () => {
  const callbacksRef = useRef<Map<string, any>>(new Map());

  const createOptimizedCallback = useCallback(<T extends (...args: any[]) => any>(
    key: string,
    callback: T,
    deps: any[] = []
  ): T => {
    const existingCallback = callbacksRef.current.get(key);
    
    // Check if dependencies have changed
    const depsChanged = !existingCallback || 
      JSON.stringify(deps) !== JSON.stringify(callbacksRef.current.get(`${key}_deps`));
    
    if (depsChanged) {
      const optimizedCallback = useCallback(callback, deps);
      callbacksRef.current.set(key, optimizedCallback);
      callbacksRef.current.set(`${key}_deps`, deps);
      return optimizedCallback;
    }
    
    return existingCallback as T;
  }, []);

  const clearCallbacks = useCallback(() => {
    callbacksRef.current.clear();
  }, []);

  return {
    createOptimizedCallback,
    clearCallbacks,
  };
};

// Specialized hooks for common patterns
export const useOptimizedPressHandler = (handler: (id: string) => void, id: string) => {
  return useCallback(() => handler(id), [handler, id]);
};

export const useOptimizedToggleHandler = (handler: (id: string, value: boolean) => void, id: string, currentValue: boolean) => {
  return useCallback(() => handler(id, !currentValue), [handler, id, currentValue]);
};

export const useOptimizedSearchHandler = (handler: (query: string) => void) => {
  return useCallback((query: string) => {
    // Debounce search input
    const timeoutId = setTimeout(() => {
      handler(query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [handler]);
};
