/**
 * Real-time notification stream.
 *
 * SSE (Server-Sent Events) is intentionally DISABLED on this deployment: the
 * app runs on php-fpm, where holding a request open for the stream's lifetime
 * ties up a worker and returned repeated 500s. Notifications instead refresh
 * via the short polling interval in `useNotifications` (see useUnreadCount),
 * which keeps the bell up to date without any long-lived connection.
 *
 * Kept as a no-op hook so the call site (Layout) needs no changes, and so we
 * can re-enable a real-time transport (e.g. Reverb/WebSockets) later in one place.
 */
export function useNotificationStream(_enabled: boolean): void {
  // no-op — polling handles updates
}
