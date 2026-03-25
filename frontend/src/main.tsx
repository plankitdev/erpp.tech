import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { useAuthStore } from './store/authStore';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,        // 30s — data considered fresh
      gcTime: 10 * 60 * 1000,   // 10min — keep in cache after inactive
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,  // refetch when internet comes back
    },
  },
});

// Hydrate auth state from localStorage, then refresh from server
useAuthStore.getState().hydrate();
if (localStorage.getItem('token')) {
  useAuthStore.getState().fetchUser();
}

// Re-fetch user permissions when browser tab gets focus
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && localStorage.getItem('token')) {
    useAuthStore.getState().fetchUser();
  }
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
        <Toaster
          position="top-left"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
