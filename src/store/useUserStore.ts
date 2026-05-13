import { create } from 'zustand';
import type { User } from '../types';
import { api, isNetworkError } from '../lib/api';

interface UserStore {
  users: User[];
  loading: boolean;
  loaded: boolean;
  fetchUsers: () => Promise<void>;
}

interface DbUser {
  id: string;
  tenant_id?: string | null;
  tenantId?: string | null;
  name: string;
  email: string;
  role: User['role'];
  phone?: string | null;
  active: boolean;
  created_at?: string;
  createdAt?: string;
  avatar?: string | null;
}

function toUser(r: DbUser): User {
  return {
    id: r.id,
    tenantId: r.tenantId ?? r.tenant_id ?? '',
    name: r.name,
    email: r.email,
    role: r.role,
    phone: r.phone ?? undefined,
    active: r.active,
    createdAt: r.createdAt ?? r.created_at ?? '',
    avatar: r.avatar ?? undefined,
  };
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,
  loaded: false,

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const data = await api.get<DbUser[]>('/users');
      set({
        users: Array.isArray(data) ? data.map(toUser) : [],
        loaded: true,
      });
    } catch (err) {
      if (isNetworkError(err)) {
        set({ users: [] });
        return;
      }
      set({ users: [], loaded: true });
    } finally {
      set({ loading: false });
    }
  },
}));
