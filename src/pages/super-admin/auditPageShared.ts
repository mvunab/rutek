export interface AuditLogRow {
  id: string;
  tenant_id: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  target_label: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditListResponse {
  items: AuditLogRow[];
  next_cursor: string | null;
}

export const ACTION_LABELS: Record<string, string> = {
  'user.create': 'Usuario creado',
  'user.update': 'Usuario actualizado',
  'user.delete': 'Usuario eliminado',
  'user.reset_password': 'Contraseña reseteada',
  'tenant.create': 'Tenant creado',
  'tenant.update': 'Tenant actualizado',
  'tenant.delete': 'Tenant eliminado',
};

export const ACTION_COLORS: Record<string, string> = {
  'user.create': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  'user.update': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  'user.delete': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  'user.reset_password': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  'tenant.create': 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
  'tenant.update': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  'tenant.delete': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
};

const DATETIME_FORMATTER = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export function formatAuditDate(iso: string) {
  try {
    return DATETIME_FORMATTER.format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatAuditValue(v: unknown): string {
  if (v === null || v === undefined) return '–';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
