import { create } from 'zustand';
import { pingBackend, onNetworkError, clearAccessToken } from '../lib/api';
import { useAuthStore } from './useAuthStore';

type HealthStatus = 'unknown' | 'checking' | 'online' | 'offline';

interface HealthStore {
  status: HealthStatus;
  lastCheckedAt: number | null;
  check: () => Promise<boolean>;
  markOffline: () => void;
}

let inflight: Promise<boolean> | null = null;

function clearLocalSession() {
  useAuthStore.getState().clearAuth();
  clearAccessToken();
}

export const useHealthStore = create<HealthStore>((set, get) => ({
  status: 'unknown',
  lastCheckedAt: null,

  check: async () => {
    if (inflight) return inflight;
    set({ status: 'checking' });
    inflight = (async () => {
      const ok = await pingBackend();
      if (ok) {
        set({ status: 'online', lastCheckedAt: Date.now() });
      } else {
        get().markOffline();
      }
      return ok;
    })();
    try {
      return await inflight;
    } finally {
      inflight = null;
    }
  },

  markOffline: () => {
    const wasOffline = get().status === 'offline';
    set({ status: 'offline', lastCheckedAt: Date.now() });
    if (!wasOffline) {
      clearLocalSession();
    }
  },
}));

onNetworkError(() => {
  useHealthStore.getState().markOffline();
});
