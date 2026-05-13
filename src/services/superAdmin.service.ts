import { api } from '../lib/api';
import type { Tenant } from '../types';
import type { DbTenant } from '../types/api';

function toTenant(r: DbTenant): Tenant {
  return {
    id: r.id,
    name: r.name,
    rut: r.rut,
    plan: r.plan as Tenant['plan'],
    logo: r.logo ?? undefined,
    legalName: r.legal_name ?? undefined,
    email: r.email ?? undefined,
    phone: r.phone ?? undefined,
    address: r.address ?? undefined,
    city: r.city ?? undefined,
    region: r.region ?? undefined,
    createdAt: r.created_at,
    active: r.active,
  };
}

export interface CreateTenantInput {
  name: string;
  rut: string;
  plan: 'starter' | 'professional' | 'enterprise';
  legalName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  active?: boolean;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
  adminPhone?: string;
}

export interface CreateTenantAdminInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'admin' | 'operator';
}

export const superAdminService = {
  async getGlobalStats() {
    return api.get('/super-admin/stats');
  },

  async listTenants(): Promise<Tenant[]> {
    const data = await api.get<DbTenant[]>('/super-admin/tenants');
    return data.map(toTenant);
  },

  async getTenantWithUsers(id: string) {
    return api.get<{ users: any[] } & DbTenant>(`/super-admin/tenants/${id}`);
  },

  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    const data = await api.post<DbTenant>('/super-admin/tenants', {
      name: input.name,
      rut: input.rut,
      plan: input.plan,
      legal_name: input.legalName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      region: input.region,
      ...(input.adminName && { admin_name: input.adminName }),
      ...(input.adminEmail && { admin_email: input.adminEmail }),
      ...(input.adminPassword && { admin_password: input.adminPassword }),
      ...(input.adminPhone && { admin_phone: input.adminPhone }),
    });
    return toTenant(data);
  },

  async updateTenant(id: string, patch: Partial<CreateTenantInput>): Promise<Tenant> {
    const data = await api.patch<DbTenant>(`/super-admin/tenants/${id}`, {
      ...(patch.name && { name: patch.name }),
      ...(patch.rut && { rut: patch.rut }),
      ...(patch.plan && { plan: patch.plan }),
      ...(patch.legalName !== undefined && { legal_name: patch.legalName }),
      ...(patch.email !== undefined && { email: patch.email }),
      ...(patch.phone !== undefined && { phone: patch.phone }),
      ...(patch.address !== undefined && { address: patch.address }),
      ...(patch.city !== undefined && { city: patch.city }),
      ...(patch.region !== undefined && { region: patch.region }),
      ...(patch.active !== undefined && { active: patch.active }),
    });
    return toTenant(data);
  },

  async deleteTenant(id: string): Promise<boolean> {
    await api.del(`/super-admin/tenants/${id}`);
    return true;
  },

  async getAllUsers(tenantId?: string) {
    const url = tenantId ? `/super-admin/users?tenant_id=${tenantId}` : '/super-admin/users';
    return api.get<any[]>(url);
  },

  async createTenantAdmin(tenantId: string, input: CreateTenantAdminInput) {
    return api.post(`/super-admin/tenants/${tenantId}/admins`, input);
  },

  async updateUser(id: string, patch: { name?: string; email?: string; role?: string; phone?: string; active?: boolean }) {
    return api.patch(`/super-admin/users/${id}`, patch);
  },

  async deleteUser(id: string) {
    await api.del(`/super-admin/users/${id}`);
  },

  async resetUserPassword(userId: string, password: string) {
    return api.put(`/super-admin/users/${userId}/reset-password`, { password });
  },

  async changeMyPassword(currentPassword: string, newPassword: string) {
    return api.put('/super-admin/me/change-password', { currentPassword, newPassword });
  },
};
