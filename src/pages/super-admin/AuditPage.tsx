import { useEffect, useId, useMemo, useState } from 'react';
import { Activity, FileClock, RefreshCw, Filter } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';

interface AuditLogRow {
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

interface ListResponse {
  items: AuditLogRow[];
  next_cursor: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  'user.create': 'Usuario creado',
  'user.update': 'Usuario actualizado',
  'user.delete': 'Usuario eliminado',
  'user.reset_password': 'Contraseña reseteada',
  'tenant.create': 'Tenant creado',
  'tenant.update': 'Tenant actualizado',
  'tenant.delete': 'Tenant eliminado',
};

const ACTION_COLORS: Record<string, string> = {
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

function formatDate(iso: string) {
  try {
    return DATETIME_FORMATTER.format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '–';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function AuditPage() {
  const [items, setItems] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const actionId = useId();
  const targetId = useId();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (targetTypeFilter !== 'all') params.set('target_type', targetTypeFilter);
      params.set('limit', '50');
      const res = await api.get<ListResponse>(`/audit-logs?${params.toString()}`);
      setItems(res.items);
      setNextCursor(res.next_cursor);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`No se pudo cargar la auditoría (HTTP ${err.status}).`);
      } else {
        setError('No se pudo cargar la auditoría.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (targetTypeFilter !== 'all') params.set('target_type', targetTypeFilter);
      params.set('limit', '50');
      params.set('cursor', nextCursor);
      const res = await api.get<ListResponse>(`/audit-logs?${params.toString()}`);
      setItems((prev) => [...prev, ...res.items]);
      setNextCursor(res.next_cursor);
    } catch {
      setError('No se pudieron cargar más registros.');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, targetTypeFilter]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stats = useMemo(() => {
    const byAction: Record<string, number> = {};
    items.forEach((it) => {
      byAction[it.action] = (byAction[it.action] ?? 0) + 1;
    });
    return byAction;
  }, [items]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div aria-hidden="true" className="size-9 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
            <FileClock size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
              Auditoría
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Registro inmutable de cambios sobre tenants y usuarios.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void fetchData()}
          disabled={loading}
          aria-label="Recargar registros"
        >
          <RefreshCw size={14} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
          Recargar
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
          <p className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">Total</p>
          <p className="text-xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{items.length}</p>
        </div>
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
          <p className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">Usuarios creados</p>
          <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats['user.create'] ?? 0}</p>
        </div>
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
          <p className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">Actualizaciones</p>
          <p className="text-xl font-semibold text-sky-600 dark:text-sky-400 tabular-nums">{stats['user.update'] ?? 0}</p>
        </div>
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
          <p className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">Eliminaciones</p>
          <p className="text-xl font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
            {(stats['user.delete'] ?? 0) + (stats['tenant.delete'] ?? 0)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex items-end gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300 mr-2">
          <Filter size={14} aria-hidden="true" />
          <span className="text-sm font-medium">Filtros</span>
        </div>
        <div>
          <label htmlFor={actionId} className="block text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
            Acción
          </label>
          <select
            id={actionId}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-700 dark:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <option value="all">Todas</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={targetId} className="block text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
            Tipo
          </label>
          <select
            id={targetId}
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-700 dark:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <option value="all">Todos</option>
            <option value="user">Usuario</option>
            <option value="tenant">Tenant</option>
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 p-3 text-sm dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="p-10 flex items-center justify-center text-stone-500 dark:text-stone-400" aria-live="polite">
            <Activity size={20} className="animate-spin mr-2" aria-hidden="true" />
            <span className="text-sm">Cargando registros…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center" aria-live="polite">
            <FileClock size={28} className="text-stone-300 dark:text-stone-600 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-stone-500 dark:text-stone-400">Sin registros con los filtros actuales.</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {items.map((row) => {
              const isOpen = expanded.has(row.id);
              const hasDetail =
                (row.changes && Object.keys(row.changes).length > 0) ||
                row.before !== null ||
                row.after !== null;
              return (
                <li key={row.id} className="px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            ACTION_COLORS[row.action] ?? 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                          }`}
                        >
                          {ACTION_LABELS[row.action] ?? row.action}
                        </span>
                        <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                          {formatDate(row.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-stone-800 dark:text-stone-100 break-words">
                        <span className="font-medium">{row.actor_email ?? 'Sistema'}</span>
                        <span className="text-stone-500 dark:text-stone-400">{' → '}</span>
                        <span>{row.target_label ?? row.target_id ?? '–'}</span>
                      </p>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                        {row.target_type} · {row.actor_role ?? 'sin rol'}
                        {row.tenant_id ? ` · tenant ${row.tenant_id.slice(0, 8)}…` : ''}
                      </p>
                    </div>
                    {hasDetail && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(row.id)}
                        aria-expanded={isOpen}
                        aria-controls={`audit-detail-${row.id}`}
                        className="text-xs font-medium text-violet-700 dark:text-violet-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded px-1"
                      >
                        {isOpen ? 'Ocultar detalle' : 'Ver detalle'}
                      </button>
                    )}
                  </div>

                  {isOpen && hasDetail && (
                    <div id={`audit-detail-${row.id}`} className="mt-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 p-3 text-xs">
                      {row.changes && Object.keys(row.changes).length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                <th className="py-1 pr-3 font-medium">Campo</th>
                                <th className="py-1 pr-3 font-medium">Antes</th>
                                <th className="py-1 font-medium">Después</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(row.changes).map(([field, change]) => (
                                <tr key={field} className="border-t border-stone-100 dark:border-stone-700">
                                  <td className="py-1.5 pr-3 font-medium text-stone-700 dark:text-stone-200 align-top">{field}</td>
                                  <td className="py-1.5 pr-3 text-rose-600 dark:text-rose-400 break-all align-top">{formatValue(change.from)}</td>
                                  <td className="py-1.5 text-emerald-700 dark:text-emerald-400 break-all align-top">{formatValue(change.to)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : row.after ? (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">Después</p>
                          <pre className="text-[11px] text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words">
                            {JSON.stringify(row.after, null, 2)}
                          </pre>
                        </div>
                      ) : row.before ? (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">Antes</p>
                          <pre className="text-[11px] text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words">
                            {JSON.stringify(row.before, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-stone-500 dark:text-stone-400">Sin detalle adicional.</p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <Button type="button" variant="secondary" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? 'Cargando…' : 'Cargar más'}
          </Button>
        </div>
      )}
    </div>
  );
}
