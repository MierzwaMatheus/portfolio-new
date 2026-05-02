import { useState, useEffect, useCallback } from 'react';

const PREFIX = 'pg_';

export function usePlaygroundStorage<T>(key: string, defaultValue: T) {
  const storageKey = PREFIX + key;

  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const newVal = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      try {
        localStorage.setItem(storageKey, JSON.stringify(newVal));
      } catch {
        // ignore quota errors
      }
      return newVal;
    });
  }, [storageKey]);

  const clear = useCallback(() => {
    localStorage.removeItem(storageKey);
    setValue(defaultValue);
  }, [storageKey, defaultValue]);

  return [value, set, clear] as const;
}

export function usePlaygroundApiKey() {
  const [key, setKey] = useState<string>(() => sessionStorage.getItem('pg_openrouter_key') ?? '');

  const save = useCallback((k: string) => {
    setKey(k);
    if (k) sessionStorage.setItem('pg_openrouter_key', k);
    else sessionStorage.removeItem('pg_openrouter_key');
  }, []);

  useEffect(() => {
    const handleUnload = () => sessionStorage.removeItem('pg_openrouter_key');
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return [key, save] as const;
}
