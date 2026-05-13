import { create } from 'zustand';
import type { Tenant } from '../types';
import { superAdminService, type CreateTenantInput } from '../services/superAdmin.service';

export interface TenantWithUsers extends Tenant {
  users: any[];
}

interface GlobalStats {
  total_tenants: number;
  active_tenants: number;
  inactive_tenants: number;
  total_users: number;
  total_clients: number;
  total_orders: number;
  total_routes: number;
  total_vehicles: number;
  orders_by_status: Record<string, number>;
  tenants_by_plan: Record<string, number>;
  recent_orders: any[];
  recent_tenants: any[];
}

interface SuperAdminStore {
  tenants: Tenant[];
  selectedTenant: TenantWithUsers | null;
  allUsers: any[];
  stats: GlobalStats | null;
  loading: boolean;
  error: string | null;

  fetchTenants: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchTenantDetail: (id: string) => Promise<void>;
  fetchAllUsers: (tenantId?: string) => Promise<void>;
  createTenant: (input: CreateTenantInput) => Promise<void>;
  updateTenant: (id: string, patch: Partial<CreateTenantInput>) => Promise<void>;
  toggleTenantActive: (id: string, active: boolean) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  createTenantAdmin: (tenantId: string, input: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  updateUser: (id: string, patch: { name?: string; email?: string; role?: string; active?: boolean }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetUserPassword: (userId: string, password: string) => Promise<void>;
  changeMyPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

export const useSuperAdminStore = create<SuperAdminStore>((set, get) => ({
  tenants: [],
  selectedTenant: null,
  allUsers: [],
  stats: null,
  loading: false,
  error: null,

  fetchTenants: async () => {
    set({ loading: true, error: null });
    try {
      const tenants = await superAdminService.listTenants();
      set({ tenants, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchStats: async () => {
    set({ loading: true });
    try {
      const stats = await superAdminService.getGlobalStats();
      set({ stats: stats as GlobalStats, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchTenantDetail: async (id) => {
    set({ loading: true });
    try {
      const tenant = await superAdminService.getTenantWithUsers(id);
      const mapped: TenantWithUsers = {
        id: tenant.id,
        name: tenant.name,
        rut: tenant.rut,
        plan: tenant.plan as Tenant['plan'],
        logo: tenant.logo ?? undefined,
        legalName: tenant.legal_name ?? undefined,
        email: tenant.email ?? undefined,
        phone: tenant.phone ?? undefined,
        address: tenant.address ?? undefined,
        city: tenant.city ?? undefined,
        region: tenant.region ?? undefined,
        createdAt: tenant.created_at,
        active: tenant.active,
        users: tenant.users,
      };
      set({ selectedTenant: mapped, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchAllUsers: async (tenantId) => {
    set({ loading: true });
    try {
      const users = await superAdminService.getAllUsers(tenantId);
      set({ allUsers: users, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createTenant: async (input) => {
    set({ loading: true, error: null });
    try {
      const tenant = await superAdminService.createTenant(input);
      set({ tenants: [tenant, ...get().tenants], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateTenant: async (id, patch) => {
    set({ loading: true, error: null });
    try {
      const tenant = await superAdminService.updateTenant(id, patch);
      set({
        tenants: get().tenants.map((t) => (t.id === id ? tenant : t)),
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  toggleTenantActive: async (id, active) => {
    set({ loading: true, error: null });
    try {
      const tenant = await superAdminService.updateTenant(id, { active });
      set({
        tenants: get().tenants.map((t) => (t.id === id ? tenant : t)),
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  deleteTenant: async (id) => {
    set({ loading: true, error: null });
    try {
      await superAdminService.deleteTenant(id);
      set({ tenants: get().tenants.filter((t) => t.id !== id), loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createTenantAdmin: async (tenantId, input) => {
    set({ loading: true, error: null });
    try {
      await superAdminService.createTenantAdmin(tenantId, input);
      await get().fetchTenantDetail(tenantId);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateUser: async (id, patch) => {
    set({ loading: true, error: null });
    try {
      await superAdminService.updateUser(id, patch);
      const selected = get().selectedTenant;
      if (selected) {
        set({
          selectedTenant: {
            ...selected,
            users: selected.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
          },
          loading: false,
        });
      } else {
        await get().fetchAllUsers();
        set({ loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      await superAdminService.deleteUser(id);
      const selected = get().selectedTenant;
      if (selected) {
        set({
          selectedTenant: {
            ...selected,
            users: selected.users.filter((u) => u.id !== id),
          },
          loading: false,
        });
      } else {
        await get().fetchAllUsers();
        set({ loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  resetUserPassword: async (userId, password) => {
    set({ loading: true, error: null });
    try {
      await superAdminService.resetUserPassword(userId, password);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  changeMyPassword: async (currentPassword, newPassword) => {
    set({ loading: true, error: null });
    try {
      await superAdminService.changeMyPassword(currentPassword, newPassword);
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },
}));
