import { Building2, PersonStanding, Shield, Truck, Users } from 'lucide-react';
import { ApiError } from '../../lib/api';
import type { UserRole } from '../../types';

export type ManagedRole = Exclude<UserRole, 'super_admin'>;

export const roleConfig: Record<UserRole, { label: string; color: string; card: string; icon: React.ReactNode; description: string }> = {
  super_admin: {
    label: 'Super Admin',
    color: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/45 dark:text-red-300 dark:border-red-800',
    card: 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800',
    icon: <Shield size={14} />,
    description: 'Acceso total al sistema multi-tenant',
  },
  admin: {
    label: 'Administrador',
    color: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/45 dark:text-blue-300 dark:border-blue-800',
    card: 'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800',
    icon: <Shield size={14} />,
    description: 'Acceso total al sistema',
  },
  operator: {
    label: 'Operador Logístico',
    color: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/45 dark:text-violet-300 dark:border-violet-800',
    card: 'bg-violet-50 border-violet-200 dark:bg-violet-950/50 dark:border-violet-800',
    icon: <Building2 size={14} />,
    description: 'Gestiona pedidos y rutas',
  },
  driver: {
    label: 'Repartidor',
    color: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/45 dark:text-emerald-300 dark:border-emerald-800',
    card: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800',
    icon: <Truck size={14} />,
    description: 'Ejecuta entregas',
  },
  peoneta: {
    label: 'Peoneta',
    color: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/45 dark:text-orange-300 dark:border-orange-800',
    card: 'bg-orange-50 border-orange-200 dark:bg-orange-950/50 dark:border-orange-800',
    icon: <PersonStanding size={14} />,
    description: 'Asiste en entregas (app móvil)',
  },
  client: {
    label: 'Cliente',
    color: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/45 dark:text-amber-300 dark:border-amber-800',
    card: 'bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800',
    icon: <Users size={14} />,
    description: 'Consulta sus pedidos',
  },
};

export const MANAGED_ROLES: { value: ManagedRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'operator', label: 'Operador Logístico' },
  { value: 'driver', label: 'Repartidor' },
  { value: 'peoneta', label: 'Peoneta' },
  { value: 'client', label: 'Cliente' },
];

export type CreateForm = {
  name: string;
  email: string;
  password: string;
  role: ManagedRole;
  phone: string;
};

export type EditForm = {
  name: string;
  email: string;
  role: ManagedRole;
  phone: string;
};

export function generatePassword(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pass = '';
  for (let i = 0; i < length; i += 1) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export function getApiMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.body) as { message?: string | string[] };
      if (Array.isArray(parsed.message)) return parsed.message.join('. ');
      if (parsed.message) return parsed.message;
    } catch {
      // body no es JSON
    }
    if (err.status === 409) return 'Ese email ya está registrado.';
    if (err.status === 403) return 'No tienes permisos para esta acción.';
    if (err.status === 400) return err.body || 'Datos inválidos.';
    return `Error ${err.status}`;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
