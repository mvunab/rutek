import { clsx } from 'clsx';
import { useAuthStore } from '../../store/useAuthStore';
import { resolveOrderStatusLabel } from '../../lib/orderStatusLabels';
import type { OrderPriority, RouteStatus } from '../../types';
import { normalizeRouteStatus, routeStatusLabel } from '../../lib/routeStatusLabels';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'slate';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-stone-100 text-stone-700 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-700',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900/50',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900/50',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900/50',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900/50',
  purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900/50',
  slate: 'bg-stone-100 text-stone-500 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:ring-stone-700',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-stone-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  purple: 'bg-violet-500',
  slate: 'bg-stone-400',
};

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
      variantClasses[variant],
      className
    )}>
      {dot && (
        <span className={clsx('h-1.5 w-1.5 rounded-full', dotClasses[variant])} />
      )}
      {children}
    </span>
  );
}

function variantForOrderSlug(slug: string): BadgeVariant {
  switch (slug) {
    case 'pending':
      return 'warning';
    case 'in_transit':
      return 'purple';
    case 'delivered':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'confirmed':
      return 'info';
    case 'cancelled':
    case 'returned':
      return 'slate';
    default:
      return 'slate';
  }
}

/** Muestra etiqueta legible (built-in, legado o definida por el tenant). */
export function OrderStatusBadge({ status }: { status: string }) {
  const tenant = useAuthStore((s) => s.tenant);
  const label = resolveOrderStatusLabel(status, tenant);
  const variant = variantForOrderSlug(status);
  return <Badge variant={variant} dot>{label}</Badge>;
}

const routeStatusBadgeVariants: Record<RouteStatus, BadgeVariant> = {
  not_started: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export function RouteStatusBadge({ status }: { status: RouteStatus | string }) {
  const normalized = normalizeRouteStatus(String(status));
  const label = routeStatusLabel(normalized);
  return <Badge variant={routeStatusBadgeVariants[normalized]} dot>{label}</Badge>;
}

const priorityBadgeConfig: Record<OrderPriority, { label: string; variant: BadgeVariant }> = {
  low: { label: 'Baja', variant: 'slate' },
  medium: { label: 'Media', variant: 'info' },
  high: { label: 'Alta', variant: 'warning' },
  urgent: { label: 'Urgente', variant: 'danger' },
};

export function PriorityBadge({ priority }: { priority: OrderPriority }) {
  const { label, variant } = priorityBadgeConfig[priority];
  return <Badge variant={variant}>{label}</Badge>;
}
