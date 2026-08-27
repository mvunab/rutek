import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-sm">
      <div className={clsx('absolute inset-y-0 left-0 w-1', accent)} aria-hidden />
      <div className="flex items-center gap-2 mb-2 text-stone-600 dark:text-stone-400 pl-1.5">
        {icon}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums pl-1.5">
        {value}
      </p>
    </div>
  );
}

export function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-3 border-b border-stone-100 dark:border-stone-800 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-600 dark:text-stone-400">
        {label}
      </dt>
      <dd className="text-sm text-stone-900 dark:text-stone-100 min-w-0">{children}</dd>
    </div>
  );
}
