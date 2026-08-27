import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export function OrderCardAction({
  icon,
  label,
  onClick,
  active = false,
  loading = false,
  disabled = false,
  tone = 'default',
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  loading?: boolean;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      aria-pressed={active}
      title={
        disabled && !loading
          ? `${label} (no disponible mientras otra acción está en curso)`
          : active
            ? `${label} (abierta — pulsa de nuevo para cerrar)`
            : label
      }
      className={clsx(
        'glass-btn inline-flex flex-1 items-center justify-center gap-1.5 min-h-[2rem] rounded-lg px-2 py-1.5 text-xs font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950',
        tone === 'danger'
          ? 'glass-btn--danger focus-visible:ring-red-400'
          : active
            ? 'glass-btn--active focus-visible:ring-[#FF7B00]/50'
            : 'focus-visible:ring-[#FF7B00]/45',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span className="shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span>{loading ? '…' : label}</span>
    </button>
  );
}
