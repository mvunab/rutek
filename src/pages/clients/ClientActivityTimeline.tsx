import {
  Mail,
  MessageSquare,
  Package,
  Phone,
  Target,
  Trash2,
  User,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { Badge, OrderStatusBadge } from '../../components/ui/Badge';
import type { ClientActivity, ClientActivityKind, OpportunityStatus } from '../../types/clientCrm';
import {
  CLIENT_ACTIVITY_KIND_LABELS,
  OPPORTUNITY_STATUS_LABELS,
} from '../../types/clientCrm';
import { formatDateOnly, formatWhen } from './clientDetailFormat';

export type TimelineFilter = 'all' | 'crm' | 'orders' | 'opportunities';

export type TimelineItem =
  | { type: 'activity'; id: string; at: string; activity: ClientActivity }
  | {
      type: 'order';
      id: string;
      at: string;
      code: string;
      status: string;
      destinationCity: string;
      bultos: number;
    };

const KIND_ICONS: Record<ClientActivityKind, typeof MessageSquare> = {
  note: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: User,
  opportunity: Target,
  task: Target,
};

const FILTER_TABS: readonly [TimelineFilter, string][] = [
  ['all', 'Todo'],
  ['crm', 'Interacciones'],
  ['opportunities', 'Oportunidades'],
  ['orders', 'Pedidos'],
];

export function ClientActivityTimeline({
  filter,
  onFilterChange,
  filteredTimeline,
  onDeleteActivity,
  onOpportunityStatus,
}: {
  filter: TimelineFilter;
  onFilterChange: (filter: TimelineFilter) => void;
  filteredTimeline: TimelineItem[];
  onDeleteActivity: (activity: ClientActivity) => void;
  onOpportunityStatus: (activity: ClientActivity, status: OpportunityStatus) => void;
}) {
  return (
    <div className="xl:col-span-2 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
          Actividad del cliente
        </h2>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar actividad">
          {FILTER_TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => onFilterChange(key)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                filter === key
                  ? 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-950/45 dark:text-primary-300 dark:border-primary-800'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm divide-y divide-stone-100 dark:divide-stone-800">
        {filteredTimeline.length === 0 ? (
          <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-12 px-4">
            Sin actividad en este filtro. Registra una nota u oportunidad.
          </p>
        ) : (
          filteredTimeline.map((item) => {
            if (item.type === 'order') {
              return (
                <div key={`order-${item.id}`} className="flex gap-4 p-4">
                  <div className="size-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Package size={16} aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono font-semibold text-stone-800 dark:text-stone-100">{item.code}</span>
                      <OrderStatusBadge status={item.status} />
                      <span className="text-[10px] uppercase tracking-wide text-stone-400">Pedido</span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {item.destinationCity || 'Sin destino'} · {item.bultos} bulto{item.bultos === 1 ? '' : 's'}
                    </p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">{formatWhen(item.at)}</p>
                  </div>
                </div>
              );
            }

            const { activity } = item;
            const Icon = KIND_ICONS[activity.kind];
            const isOpportunity = activity.kind === 'opportunity';
            const oppStatus = activity.status ?? (activity.stage === 'won' ? 'won' : activity.stage === 'lost' ? 'lost' : 'open');

            return (
              <div key={activity.id} className="flex gap-4 p-4 group">
                <div className={clsx(
                  'size-9 rounded-lg flex items-center justify-center shrink-0',
                  isOpportunity
                    ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300',
                )}>
                  <Icon size={16} aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-100">
                      {activity.title}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-stone-400">
                      {CLIENT_ACTIVITY_KIND_LABELS[activity.kind]}
                    </span>
                    {isOpportunity && (
                      <Badge variant={oppStatus === 'won' ? 'success' : oppStatus === 'lost' ? 'slate' : 'warning'}>
                        {OPPORTUNITY_STATUS_LABELS[oppStatus as keyof typeof OPPORTUNITY_STATUS_LABELS] ?? 'Abierta'}
                      </Badge>
                    )}
                  </div>
                  {activity.body ? (
                    <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap">{activity.body}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-stone-400 dark:text-stone-500">
                    <span>{formatWhen(activity.occurredAt)}</span>
                    {activity.createdByName && <span>· {activity.createdByName}</span>}
                    {activity.amount != null && activity.amount > 0 && (
                      <span className="font-medium text-stone-600 dark:text-stone-300">
                        · ${activity.amount.toLocaleString('es-CL')} CLP
                      </span>
                    )}
                    {activity.dueDate && (
                      <span>· Cierre {formatDateOnly(activity.dueDate)}</span>
                    )}
                  </div>
                  {isOpportunity && oppStatus === 'open' && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        type="button"
                        size="xs"
                        variant="success"
                        onClick={() => void onOpportunityStatus(activity, 'won')}
                      >
                        Marcar ganada
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => void onOpportunityStatus(activity, 'lost')}
                      >
                        Marcar perdida
                      </Button>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shrink-0"
                  onClick={() => onDeleteActivity(activity)}
                  icon={<Trash2 size={14} aria-hidden />}
                  aria-label="Eliminar actividad"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
