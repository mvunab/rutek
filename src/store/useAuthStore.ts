import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Tenant } from '../types';
import { authService } from '../services/auth.service';
import { clearAccessToken } from '../lib/api';

interface AuthStore {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateTenant: (patch: Partial<Tenant>) => void;
  clearAuth: () => void;
  changeMyPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      isAuthenticated: false,
      isSuperAdmin: false,
      loading: false,

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
        });
      },

      restoreSession: async () => {
        set({ loading: true });
        const result = await authService.getSession();
        if (result) {
          set({
            user: result.user,
            tenant: result.tenant,
            isAuthenticated: true,
            isSuperAdmin: result.isSuperAdmin,
            loading: false,
          });
        } else {
          set({ loading: false });
        }
      },

      updateTenant: (patch) => {
        const { tenant } = get();
        if (!tenant) return;
        set({ tenant: { ...tenant, ...patch } });
      },

      clearAuth: () => {
        clearAccessToken();
        set({
          user: null,
          tenant: null,
          isAuthenticated: false,
          isSuperAdmin: false,
          loading: false,
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
      name: 'rutek-auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
        isSuperAdmin: state.isSuperAdmin,
      }),
    }
  )
);
