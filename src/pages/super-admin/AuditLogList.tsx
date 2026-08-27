import { Activity, FileClock } from 'lucide-react';
import {
  ACTION_COLORS,
  ACTION_LABELS,
  formatAuditDate,
  formatAuditValue,
  type AuditLogRow,
} from './auditPageShared';

function AuditLogDetail({ row }: { row: AuditLogRow }) {
  if (row.changes && Object.keys(row.changes).length > 0) {
    return (
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
                <td className="py-1.5 pr-3 text-rose-600 dark:text-rose-400 break-all align-top">{formatAuditValue(change.from)}</td>
                <td className="py-1.5 text-emerald-700 dark:text-emerald-400 break-all align-top">{formatAuditValue(change.to)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (row.after) {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">Después</p>
        <pre className="text-[11px] text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words">
          {JSON.stringify(row.after, null, 2)}
        </pre>
      </div>
    );
  }

  if (row.before) {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">Antes</p>
        <pre className="text-[11px] text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words">
          {JSON.stringify(row.before, null, 2)}
        </pre>
      </div>
    );
  }

  return <p className="text-stone-500 dark:text-stone-400">Sin detalle adicional.</p>;
}

function AuditLogListItem({
  row,
  isOpen,
  onToggle,
}: {
  row: AuditLogRow;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasDetail =
    (row.changes && Object.keys(row.changes).length > 0) ||
    row.before !== null ||
    row.after !== null;

  return (
    <li className="px-4 py-3 sm:px-5 sm:py-4">
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
              {formatAuditDate(row.created_at)}
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
            onClick={onToggle}
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
          <AuditLogDetail row={row} />
        </div>
      )}
    </li>
  );
}

export function AuditLogList({
  items,
  loading,
  expanded,
  onToggleExpanded,
}: {
  items: AuditLogRow[];
  loading: boolean;
  expanded: Set<string>;
  onToggleExpanded: (id: string) => void;
}) {
  return (
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
          {items.map((row) => (
            <AuditLogListItem
              key={row.id}
              row={row}
              isOpen={expanded.has(row.id)}
              onToggle={() => onToggleExpanded(row.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
