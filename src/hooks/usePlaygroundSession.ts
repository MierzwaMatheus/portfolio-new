import { useMemo } from 'react';

function generateUUID(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const SESSION_KEY = 'playground_session_id';

export function usePlaygroundSession(): string {
  return useMemo(() => {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }, []);
}
