import { ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import {
  formatComplianceHint,
  type VehicleComplianceSummary,
} from '../../lib/vehicleCompliance';
import type { SortDir, SortKey } from './vehicleForm';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active || dir === 'none') {
    return <ChevronsUpDown size={12} className="text-stone-300 dark:text-stone-600 ml-1" aria-hidden />;
  }
  return dir === 'asc' ? (
    <ChevronUp size={12} className="text-primary-600 ml-1" aria-hidden />
  ) : (
    <ChevronDown size={12} className="text-primary-600 ml-1" aria-hidden />
  );
}

interface ColProps {
  colKey: SortKey;
  label: string;
  className?: string;
  sortCol: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}

export function VehiclesSortCol({ colKey, label, className, sortCol, sortDir, onSort }: ColProps) {
  return (
    <th
      scope="col"
      className={clsx(
        'p-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(colKey)}
        className="inline-flex items-center cursor-pointer select-none hover:text-stone-700 dark:hover:text-stone-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-0.5"
      >
        {label}
        <SortIcon active={sortCol === colKey} dir={sortDir} />
      </button>
    </th>
  );
}

export function VehicleComplianceBadges({ summary }: { summary: VehicleComplianceSummary }) {
  if (summary.alertCount === 0) {
    return <span className="text-xs text-stone-400 dark:text-stone-500">Al día</span>;
  }
  return (
    <ul className="space-y-1 min-w-[140px]">
      {summary.items.map((item) => (
        <li key={item.kind}>
          <span
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border max-w-full',
              item.status === 'expired'
                ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900'
                : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900',
            )}
            title={formatComplianceHint(item)}
          >
            <AlertTriangle size={10} className="shrink-0" aria-hidden />
            <span className="truncate">{formatComplianceHint(item)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
