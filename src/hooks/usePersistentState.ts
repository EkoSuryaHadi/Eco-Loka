import { useEffect, useState } from 'react';

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue === null) {
        return initialValue;
      }

      return JSON.parse(storedValue) as T;
    } catch (error) {
      console.error(`Failed to parse localStorage key: ${key}`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save localStorage key: ${key}`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
