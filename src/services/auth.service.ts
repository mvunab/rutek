import {
  api,
  ApiError,
  setAccessToken,
  clearAccessToken,
  getAccessToken,
  isHttpError,
} from '../lib/api';
import type { User, Tenant } from '../types';
import type { DbTenant, DbUser } from '../types/api';

export interface AuthResponse {
  user: User;
  tenant: Tenant | null;
  isSuperAdmin: boolean;
}

interface LoginResponseUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatar: string | null;
  active: boolean;
}

interface LoginResponse {
  access_token: string;
  user: LoginResponseUser;
}

function mapUserFromLogin(
  raw: LoginResponseUser,
  effectiveTenantId: string | null,
): User {
  return {
    id: raw.id,
    tenantId: effectiveTenantId ?? raw.tenantId ?? '',
    name: raw.name,
    email: raw.email,
    role: raw.role as User['role'],
    phone: raw.phone ?? undefined,
    active: raw.active,
    createdAt: '',
  };
}

function mapUserFromDb(raw: DbUser, effectiveTenantId: string | null): User {
  return {
    id: raw.id,
    tenantId: effectiveTenantId ?? raw.tenant_id ?? '',
    name: raw.name,
    email: raw.email,
    role: raw.role as User['role'],
    phone: raw.phone ?? undefined,
    active: raw.active,
    createdAt: raw.created_at,
  };
}

function mapTenantFromDb(raw: DbTenant): Tenant {
  return {
    id: raw.id,
    name: raw.name,
    rut: raw.rut,
    plan: raw.plan as Tenant['plan'],
    legalName: raw.legal_name ?? undefined,
    email: raw.email ?? undefined,
    phone: raw.phone ?? undefined,
    address: raw.address ?? undefined,
    city: raw.city ?? undefined,
    region: raw.region ?? undefined,
    createdAt: raw.created_at,
    active: raw.active,
  };
}

async function loadTenantSafely(tenantId: string): Promise<Tenant | null> {
  try {
    const data = await api.get<DbTenant>(`/super-admin/tenants/${tenantId}`);
    return mapTenantFromDb(data);
  } catch (err) {
    if (isHttpError(err) && (err.status === 403 || err.status === 404)) {
      return null;
    }
    throw err;
  }
}

export const authService = {
  async signIn(email: string, password: string): Promise<AuthResponse | null> {
    try {
      const res = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });
      setAccessToken(res.access_token);

      const isSuperAdmin = res.user.role === 'super_admin';
      const tenantId = isSuperAdmin ? null : res.user.tenantId;

      let tenant: Tenant | null = null;
      if (tenantId) {
        tenant = await loadTenantSafely(tenantId);
      }

      return {
        user: mapUserFromLogin(res.user, tenantId),
        tenant,
        isSuperAdmin,
      };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return null;
      }
      throw err;
    }
  },

  async signOut(): Promise<void> {
    clearAccessToken();
  },

  async getSession(): Promise<AuthResponse | null> {
    if (!getAccessToken()) return null;

    try {
      const me = await api.get<DbUser>('/auth/me');
      const isSuperAdmin = me.role === 'super_admin';
      const tenantId = isSuperAdmin ? null : me.tenant_id;

      let tenant: Tenant | null = null;
      if (tenantId) {
        tenant = await loadTenantSafely(tenantId);
      }

      return {
        user: mapUserFromDb(me, tenantId),
        tenant,
        isSuperAdmin,
      };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAccessToken();
        return null;
      }
      throw err;
    }
  },

  async getTenant(tenantId: string): Promise<Tenant | null> {
    return loadTenantSafely(tenantId);
  },

  async changeMyPassword(currentPassword: string, newPassword: string) {
    return api.post('/auth/change-password', { currentPassword, newPassword });
  },
};
