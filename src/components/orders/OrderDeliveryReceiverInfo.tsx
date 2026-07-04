import { IdCard, UserRound } from 'lucide-react';
import { clsx } from 'clsx';

export function OrderDeliveryReceiverInfo({
  name,
  rut,
  className,
}: {
  name?: string | null;
  rut?: string | null;
  className?: string;
}) {
  const displayName = name?.trim();
  const displayRut = rut?.trim();
  if (!displayName && !displayRut) return null;

  return (
    <div
      className={clsx(
        'rounded-lg border border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-2.5 py-2 space-y-1',
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
        Recibido por
      </p>
      {displayName ? (
        <p className="text-sm font-medium text-stone-900 dark:text-stone-50 flex items-center gap-1.5 min-w-0">
          <UserRound size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden />
          <span className="truncate">{displayName}</span>
        </p>
      ) : null}
      {displayRut ? (
        <p className="text-xs text-stone-600 dark:text-stone-300 flex items-center gap-1.5 min-w-0">
          <IdCard size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden />
          <span translate="no" className="tabular-nums">
            RUT {displayRut}
          </span>
        </p>
      ) : null}
    </div>
  );
}
