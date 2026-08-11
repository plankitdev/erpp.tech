import { useEffect } from 'react';

/**
 * Warns the user before they close/refresh the tab (or leave via an external
 * link) while a form has unsaved changes. Pass the form's dirty state.
 *
 * Note: this uses the browser `beforeunload` event, so it covers tab close,
 * refresh, and back/forward — it does NOT block in-app React Router
 * navigation (that fires no unload). Programmatic navigate() after a
 * successful save is therefore never blocked.
 */
export function useUnsavedChanges(when: boolean) {
  useEffect(() => {
    if (!when) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when]);
}
