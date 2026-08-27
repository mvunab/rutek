import { useId } from 'react';
import { Filter } from 'lucide-react';
import { ACTION_LABELS } from './auditPageShared';

export function AuditFiltersPanel({
  actionFilter,
  targetTypeFilter,
  onActionFilterChange,
  onTargetTypeFilterChange,
}: {
  actionFilter: string;
  targetTypeFilter: string;
  onActionFilterChange: (value: string) => void;
  onTargetTypeFilterChange: (value: string) => void;
}) {
  const actionId = useId();
  const targetId = useId();

  return (
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
          onChange={(e) => onActionFilterChange(e.target.value)}
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
          onChange={(e) => onTargetTypeFilterChange(e.target.value)}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-700 dark:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <option value="all">Todos</option>
          <option value="user">Usuario</option>
          <option value="tenant">Tenant</option>
        </select>
      </div>
    </div>
  );
}
