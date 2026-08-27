import { ApiError } from '../../lib/api';

export type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  active: boolean;
};

export type EditForm = {
  name: string;
  email: string;
  role: string;
  phone: string;
};

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'operator', label: 'Operativo' },
  { value: 'driver', label: 'Chofer' },
] as const;

export function getApiMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.body) as { message?: string | string[] };
      if (Array.isArray(parsed.message)) return parsed.message.join('. ');
      if (parsed.message) return parsed.message;
    } catch {
      // body no es JSON, devolvemos texto crudo si tiene sentido
    }
    if (err.status === 409) return 'Ese email ya está registrado.';
    if (err.status === 400) return err.body || 'Datos inválidos.';
    return `Error ${err.status}`;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}
