import { useSearchParams } from 'react-router-dom';
import { useCallback, useRef } from 'react';

export function useUrlFilters(defaults: Record<string, string> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;

  const getParam = useCallback(
    (key: string) => searchParams.get(key) || defaultsRef.current[key] || '',
    [searchParams]
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (!value || value === (defaultsRef.current[key] || '')) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        if (key !== 'page') next.delete('page');
        return next;
      }, { replace: true });
    },
    [setSearchParams]
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
      }, { replace: true });
    },
    [setSearchParams]
  );

  return { getParam, setParam, getPage, setPage };
}
