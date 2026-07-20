import {
  api,
  ApiError,
  setAccessToken,
  clearAccessToken,
  getAccessToken,
  isHttpError,
} from '../lib/api';
import { isAccessTokenExpired } from '../lib/jwt';
import type { User, Tenant } from '../types';
import type { DbTenant } from '../types/api';

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

function mapTenantFromDb(raw: DbTenant): Tenant {
  const customRaw = raw.custom_order_statuses;
  const customOrderStatuses = Array.isArray(customRaw)
    ? (customRaw as { slug?: string; label?: string }[])
        .filter(
          (row) =>
            row &&
            typeof row.slug === 'string' &&
            typeof row.label === 'string',
        )
        .map((row) => ({
          slug: row.slug!.trim(),
          label: row.label!.trim(),
        }))
        .filter((row) => row.slug && row.label)
    : undefined;
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
    ...(customOrderStatuses?.length
      ? { customOrderStatuses }
      : {}),
    ...(raw.feature_flags &&
    typeof raw.feature_flags === 'object' &&
    !Array.isArray(raw.feature_flags)
      ? { featureFlags: raw.feature_flags as Record<string, unknown> }
      : {}),
  };
}

async function loadTenantSafely(): Promise<Tenant | null> {
  try {
    const data = await api.get<DbTenant>('/tenant/profile');
    return mapTenantFromDb(data);
  } catch (err) {
    if (isHttpError(err) && (err.status === 403 || err.status === 404)) {
      return null;
    }
    throw err;
  }
}

/** Catálogo de estados extra (solo usuario con tenant); no fallar el login si no hay permiso. */
async function enrichTenantOrderCatalog(tenant: Tenant | null): Promise<Tenant | null> {
  if (!tenant) return null;
  try {
    const catalog = await api.get<{
      builtin: string[];
      custom_order_statuses: { slug: string; label: string }[];
    }>('/tenant/order-statuses');
    return {
      ...tenant,
      customOrderStatuses: catalog.custom_order_statuses ?? [],
    };
  } catch {
    return tenant;
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
      const tenantId = res.user.tenantId || null;

      let tenant: Tenant | null = null;
      if (tenantId) {
        tenant = await loadTenantSafely();
        tenant = await enrichTenantOrderCatalog(tenant);
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
    const token = getAccessToken();
    if (!token || isAccessTokenExpired(token)) {
      clearAccessToken();
      return null;
    }

    try {
      const me = await api.get<LoginResponseUser>('/auth/me');
      const isSuperAdmin = me.role === 'super_admin';
      const tenantId = me.tenantId || null;

      let tenant: Tenant | null = null;
      if (tenantId) {
        tenant = await loadTenantSafely();
        tenant = await enrichTenantOrderCatalog(tenant);
      }

      return {
        user: mapUserFromLogin(me, tenantId),
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

  async getTenant(): Promise<Tenant | null> {
    const tenant = await loadTenantSafely();
    return enrichTenantOrderCatalog(tenant);
  },

  async changeMyPassword(currentPassword: string, newPassword: string) {
    return api.post('/auth/change-password', { currentPassword, newPassword });
  },
};
