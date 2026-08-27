export function DashboardWelcome({ userName }: { userName: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
          Buen día, {userName} 👋
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
          Aquí tienes el resumen operacional de hoy
        </p>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg">
        <span aria-hidden="true" className="size-2 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Operación activa</span>
      </div>
    </div>
  );
}
