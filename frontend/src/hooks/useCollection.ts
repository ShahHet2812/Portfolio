import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';

export type FetchStatus = 'loading' | 'ready' | 'error';

/** Fetches a list endpoint once on mount, aborting if the component unmounts first. */
export function useCollection<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<FetchStatus>('loading');

  useEffect(() => {
    const controller = new AbortController();

    fetch(apiUrl(path), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(Array.isArray(json) ? json : []);
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error(`Failed to load ${path}:`, err);
        setStatus('error');
      });

    return () => controller.abort();
  }, [path]);

  return { data, status };
}
