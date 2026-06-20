import { clearAccessToken, getAccessToken } from './api';
import { isAccessTokenExpired } from './jwt';
import { useAuthStore } from '../store/useAuthStore';

const AUTH_STORAGE_KEY = 'rutek-auth';
const SESSION_WATCH_MS = 60_000;

/** Limpia token y estado persistido si la sesión ya no es válida (sync, antes del render). */
export function purgeExpiredSessionSync(): void {
  const token = getAccessToken();
  if (token && !isAccessTokenExpired(token)) return;

  clearAccessToken();
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    if (!parsed.state) return;
    delete parsed.state.isAuthenticated;
    delete parsed.state.sessionChecked;
    delete parsed.state.loading;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
}

function enforceSessionPolicy(): void {
  const token = getAccessToken();
  if (!token || isAccessTokenExpired(token)) {
    useAuthStore.getState().clearAuth();
  }
}

/** Revalida la sesión al volver a la pestaña y periódicamente mientras la app está abierta. */
export function startSessionWatch(): () => void {
  const onVisible = () => {
    if (document.visibilityState === 'visible') enforceSessionPolicy();
  };
  document.addEventListener('visibilitychange', onVisible);
  const intervalId = window.setInterval(enforceSessionPolicy, SESSION_WATCH_MS);
  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    window.clearInterval(intervalId);
  };
}
