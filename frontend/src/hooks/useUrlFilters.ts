import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export function useUrlFilters(defaults: Record<string, string> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const getParam = useCallback(
    (key: string) => searchParams.get(key) || defaults[key] || '',
    [searchParams, defaults]
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (!value || value === (defaults[key] || '')) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        // Reset page when filters change
        if (key !== 'page') next.delete('page');
        return next;
      });
    },
    [setSearchParams, defaults]
  );

  const getPage = useCallback(
    () => parseInt(searchParams.get('page') || '1', 10),
    [searchParams]
  );

  const setPage = useCallback(
    (page: number) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (page <= 1) next.delete('page');
        else next.set('page', String(page));
        return next;
      });
    },
    [setSearchParams]
  );

  return { getParam, setParam, getPage, setPage };
}
