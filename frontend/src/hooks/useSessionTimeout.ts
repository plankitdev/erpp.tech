import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function useSessionTimeout() {
  const { token, logout } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTimeout = useCallback(() => {
    if (!token) return;
    toast.error('تم تسجيل الخروج تلقائياً بسبب عدم النشاط');
    logout();
  }, [token, logout]);

  const resetTimer = useCallback(() => {
    if (!token) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleTimeout, SESSION_TIMEOUT);
  }, [token, handleTimeout]);

  useEffect(() => {
    if (!token) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach(e => document.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [token, resetTimer]);
}
