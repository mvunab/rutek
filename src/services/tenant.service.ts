import { api } from '../lib/api';
import type { Tenant } from '../types';
import type { DbTenant } from '../types/api';

export type { Tenant };

function mapTenantFromDB(t: DbTenant): Tenant {
  return {
    id: t.id,
    name: t.name,
    rut: t.rut,
    plan: t.plan as Tenant['plan'],
    legalName: t.legal_name ?? undefined,
    email: t.email ?? undefined,
    phone: t.phone ?? undefined,
    address: t.address ?? undefined,
    city: t.city ?? undefined,
    region: t.region ?? undefined,
    createdAt: t.created_at,
    active: t.active,
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
}

export const tenantService = {
  async listAll(): Promise<Tenant[]> {
    try {
      const rows = await api.get<DbTenant[]>('/super-admin/tenants');
      return rows.map(mapTenantFromDB);
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<Tenant | null> {
    try {
      const t = await api.get<DbTenant>(`/super-admin/tenants/${id}`);
      return mapTenantFromDB(t);
    } catch {
      return null;
    }
  },

  async create(input: CreateTenantInput): Promise<Tenant | null> {
    try {
      const t = await api.post<DbTenant>('/super-admin/tenants', {
        name: input.name,
        rut: input.rut,
        plan: input.plan,
        legal_name: input.legalName ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        region: input.region ?? null,
      });
      return mapTenantFromDB(t);
    } catch {
      return null;
    }
  },

  async update(
    id: string,
    patch: Partial<CreateTenantInput>,
  ): Promise<Tenant | null> {
    try {
      const t = await api.patch<DbTenant>(`/super-admin/tenants/${id}`, {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.rut !== undefined && { rut: patch.rut }),
        ...(patch.plan !== undefined && { plan: patch.plan }),
        ...(patch.legalName !== undefined && { legal_name: patch.legalName }),
        ...(patch.email !== undefined && { email: patch.email }),
        ...(patch.phone !== undefined && { phone: patch.phone }),
        ...(patch.address !== undefined && { address: patch.address }),
        ...(patch.city !== undefined && { city: patch.city }),
        ...(patch.region !== undefined && { region: patch.region }),
      });
      return mapTenantFromDB(t);
    } catch {
      return null;
    }
  },

  async toggleActive(id: string, active: boolean): Promise<Tenant | null> {
    try {
      const t = await api.patch<DbTenant>(`/super-admin/tenants/${id}`, {
        active,
      });
      return mapTenantFromDB(t);
    } catch {
      return null;
    }
  },

  async remove(id: string): Promise<boolean> {
    try {
      await api.del(`/super-admin/tenants/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
