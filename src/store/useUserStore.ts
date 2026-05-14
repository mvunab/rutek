import { create } from 'zustand';
import type { User } from '../types';
import { api, isNetworkError } from '../lib/api';

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

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Exclude<User['role'], 'super_admin'>;
  phone?: string;
  active?: boolean;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Exclude<User['role'], 'super_admin'>;
  phone?: string;
  active?: boolean;
}

interface UserStore {
  users: User[];
  loading: boolean;
  loaded: boolean;
  fetchUsers: () => Promise<void>;
  createUser: (input: CreateUserInput) => Promise<User>;
  updateUser: (id: string, patch: UpdateUserInput) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetPassword: (id: string, password: string) => Promise<void>;
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

export const useUserStore = create<UserStore>((set, get) => ({
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

  createUser: async (input) => {
    const created = await api.post<DbUser>('/users', input);
    const user = toUser(created);
    set({ users: [user, ...get().users] });
    return user;
  },

  updateUser: async (id, patch) => {
    const updated = await api.patch<DbUser>(`/users/${id}`, patch);
    const user = toUser(updated);
    set({ users: get().users.map((u) => (u.id === id ? user : u)) });
  },

  deleteUser: async (id) => {
    await api.del(`/users/${id}`);
    set({ users: get().users.filter((u) => u.id !== id) });
  },

  resetPassword: async (id, password) => {
    await api.put(`/users/${id}/reset-password`, { password });
  },
}));
