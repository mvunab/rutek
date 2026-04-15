import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Tenant, UserRole } from '../types';
import { mockUsers, mockTenant } from '../data/mockData';

interface AuthStore {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      isAuthenticated: false,

      login: async (email: string, _password: string) => {
        const user = mockUsers.find(u => u.email === email);
        if (user) {
          set({ user, tenant: mockTenant, isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ user: null, tenant: null, isAuthenticated: false });
      },

      switchRole: (role: UserRole) => {
        const { user } = get();
        const targetUser = mockUsers.find(u => u.role === role);
        if (targetUser && user) {
          set({ user: targetUser });
        }
      },
    }),
    {
      name: 'rutek-auth',
    }
  )
);
