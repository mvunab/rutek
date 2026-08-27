import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Tenant } from '../types';
import { authService } from '../services/auth.service';
import { clearLegacyAccessTokenStorage, onAuthExpired } from '../lib/api';

try {
  const nextKey = 'rutek-auth:v1';
  const legacyKey = 'rutek-auth';
  if (!localStorage.getItem(nextKey)) {
    const legacy = localStorage.getItem(legacyKey);
    if (legacy) {
      localStorage.setItem(nextKey, legacy);
      localStorage.removeItem(legacyKey);
    }
  }
} catch {
  /* ignore */
}

interface AuthStore {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  sessionChecked: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateTenant: (patch: Partial<Tenant>) => void;
  clearAuth: () => void;
  changeMyPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

let restoreInflight: Promise<void> | null = null;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      isAuthenticated: false,
      isSuperAdmin: false,
      loading: false,
      sessionChecked: false,

      login: async (email: string, password: string) => {
        set({ loading: true });
        const result = await authService.signIn(email, password);
        if (!result) {
          set({ loading: false });
          return false;
        }
        set({
          user: result.user,
          tenant: result.tenant,
          isAuthenticated: true,
          isSuperAdmin: result.isSuperAdmin,
          loading: false,
          sessionChecked: true,
        });
        return true;
      },

      logout: async () => {
        await authService.signOut();
        set({
          user: null,
          tenant: null,
          isAuthenticated: false,
          isSuperAdmin: false,
          loading: false,
          sessionChecked: true,
        });
      },

      restoreSession: async () => {
        if (restoreInflight) return restoreInflight;

        restoreInflight = (async () => {
          set({ loading: true, sessionChecked: false });
          try {
            const result = await authService.getSession();
            if (result) {
              set({
                user: result.user,
                tenant: result.tenant,
                isAuthenticated: true,
                isSuperAdmin: result.isSuperAdmin,
              });
            } else {
              clearLegacyAccessTokenStorage();
              set({
                user: null,
                tenant: null,
                isAuthenticated: false,
                isSuperAdmin: false,
              });
            }
          } catch {
            clearLegacyAccessTokenStorage();
            set({
              user: null,
              tenant: null,
              isAuthenticated: false,
              isSuperAdmin: false,
            });
          } finally {
            set({ loading: false, sessionChecked: true });
            restoreInflight = null;
          }
        })();

        return restoreInflight;
      },

      updateTenant: (patch) => {
        const { tenant } = get();
        if (!tenant) {
          if (patch.id) set({ tenant: patch as Tenant });
          return;
        }
        set({ tenant: { ...tenant, ...patch } });
      },

      clearAuth: () => {
        clearLegacyAccessTokenStorage();
        set({
          user: null,
          tenant: null,
          isAuthenticated: false,
          isSuperAdmin: false,
          loading: false,
          sessionChecked: true,
        });
      },

      changeMyPassword: async (currentPassword, newPassword) => {
        set({ loading: true });
        try {
          await authService.changeMyPassword(currentPassword, newPassword);
          set({ loading: false });
          return true;
        } catch {
          set({ loading: false });
          return false;
        }
      },
    }),
    {
      name: 'rutek-auth:v1',
      version: 1,
      migrate: (persisted, version) => {
        if (version < 1 && persisted && typeof persisted === 'object') {
          const next = { ...(persisted as Record<string, unknown>) };
          delete next.isAuthenticated;
          delete next.sessionChecked;
          delete next.loading;
          return next;
        }
        return persisted;
      },
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        isSuperAdmin: state.isSuperAdmin,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = false;
          state.sessionChecked = false;
        }
      },
    },
  ),
);

onAuthExpired(() => {
  useAuthStore.getState().clearAuth();
});
