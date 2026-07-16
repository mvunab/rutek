import { MessageSquareWarning, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import type { RejectionInfo } from '../../lib/deliveryReceiver';

export function OrderRejectionInfo({
  info,
  className,
  onReactivate,
  reactivating = false,
}: {
  info: RejectionInfo;
  className?: string;
  /** Acción de back office: vuelve el pedido a pending para el repartidor. */
  onReactivate?: () => void;
  reactivating?: boolean;
}) {
  const motivo = info.motivo?.trim();
  const obs = info.obs?.trim();
  if (!motivo && !obs && !onReactivate) return null;

  return (
    <div
      className={clsx(
        'rounded-lg border border-red-300/90 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/40 px-2.5 py-2 space-y-1.5',
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-red-800 dark:text-red-300 flex items-center gap-1.5">
        <MessageSquareWarning size={13} aria-hidden />
        Rechazado · requiere acción
      </p>
      {motivo ? (
        <p className="text-sm font-medium text-stone-900 dark:text-stone-50 break-words">
          {motivo}
        </p>
      ) : null}
      {obs ? (
        <p className="text-xs text-stone-600 dark:text-stone-300 break-words line-clamp-2">
          {obs}
        </p>
      ) : null}
      <p className="text-[11px] text-red-800/90 dark:text-red-200/80 leading-snug">
        Limbo operativo: reactiva para el repartidor, o quita el pedido de la ruta.
      </p>
      {onReactivate ? (
        <button
          type="button"
          onClick={onReactivate}
          disabled={reactivating}
          className={clsx(
            'mt-0.5 inline-flex items-center justify-center gap-1.5 w-full min-h-8 rounded-lg px-2.5 py-1.5',
            'text-xs font-semibold text-red-950 bg-red-200/90 hover:bg-red-300/90',
            'border border-red-400/80 dark:text-red-50 dark:bg-red-900/70 dark:hover:bg-red-800/80 dark:border-red-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          )}
        >
          <RotateCcw size={13} className={reactivating ? 'animate-spin' : undefined} aria-hidden />
          {reactivating ? 'Reactivando…' : 'Reactivar para el repartidor'}
        </button>
      ) : null}
    </div>
  );
}
