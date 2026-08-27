import { clearLegacyAccessTokenStorage } from './api';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/auth.service';

const SESSION_WATCH_MS = 60_000;

/** Limpia restos legacy de JWT en storage (la sesión real está en cookie HttpOnly). */
export function purgeExpiredSessionSync(): void {
  clearLegacyAccessTokenStorage();
}

async function enforceSessionPolicy(): Promise<void> {
  try {
    const session = await authService.getSession();
    if (!session) {
      useAuthStore.getState().clearAuth();
    }
  } catch {
    /* red caída: no forzar logout */
  }
}

/** Revalida la sesión al volver a la pestaña y periódicamente mientras la app está abierta. */
export function startSessionWatch(): () => void {
  const onVisible = () => {
    if (document.visibilityState === 'visible') void enforceSessionPolicy();
  };
  document.addEventListener('visibilitychange', onVisible);
  const intervalId = window.setInterval(() => {
    void enforceSessionPolicy();
  }, SESSION_WATCH_MS);
  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    window.clearInterval(intervalId);
  };
}
