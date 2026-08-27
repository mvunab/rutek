export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-stone-500 dark:text-stone-400">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{value}</p>
    </div>
  );
}
