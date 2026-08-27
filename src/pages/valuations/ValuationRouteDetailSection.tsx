import { AlertTriangle, Calculator, GitBranch } from 'lucide-react';
import { clsx } from 'clsx';
import { EmptyState } from '../../components/ui/EmptyState';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { formatCLP } from '../../lib/pricingProfile';
import {
  billingSourceLabel,
  formatRouteDate,
  type RouteGroup,
} from './valuationUtils';

export function ValuationRouteDetailSection({
  loading,
  error,
  routeGroups,
  orderCount,
}: {
  loading: boolean;
  error: string;
  routeGroups: RouteGroup[];
  orderCount: number;
}) {
  if (error) {
    return (
      <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2" role="alert">
        <AlertTriangle size={16} className="shrink-0" aria-hidden />
        {error}
      </p>
    );
  }

  if (loading && routeGroups.length === 0) {
    return (
      <p className="text-sm text-stone-600 dark:text-stone-400 py-4 text-center" role="status">
        Cargando detalle por pedido…
      </p>
    );
  }

  if (routeGroups.length === 0) {
    return (
      <EmptyState
        icon={<Calculator size={32} aria-hidden />}
        title="Sin pedidos valorizados"
        description="No hay pedidos en ruta que coincidan con los filtros. Asocia plantillas arriba; el detalle aparece cuando haya rutas en el período."
      />
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            Detalle por ruta
          </h2>
          <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
            Cada ruta se valoriza con el flujo del cliente mandante; el cobro se reparte a
            sus pedidos.
          </p>
        </div>
        <span className="text-xs text-stone-600 dark:text-stone-400 tabular-nums shrink-0">
          {routeGroups.length} ruta{routeGroups.length !== 1 ? 's' : ''} ·{' '}
          {orderCount} pedido{orderCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="divide-y divide-stone-200 dark:divide-stone-800">
        {routeGroups.map((group) => (
          <div key={group.routeId || group.routeCode} className="bg-surface dark:bg-stone-900">
            <div className="px-4 py-3 bg-stone-50/90 dark:bg-stone-900/80 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-stone-800 dark:text-stone-100">
                    {group.routeCode}
                  </span>
                  {group.routeName ? (
                    <span className="text-xs text-stone-600 dark:text-stone-400 truncate max-w-[220px]">
                      {group.routeName}
                    </span>
                  ) : null}
                  <span className="text-[11px] text-stone-500">
                    {formatRouteDate(group.routeCreatedAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="text-stone-700 dark:text-stone-300">
                    Mandante:{' '}
                    <strong className="font-semibold">
                      {group.billingClientName ?? 'Sin cliente'}
                    </strong>
                  </span>
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium border',
                      group.billingSource === 'assignment'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-100 dark:border-emerald-800'
                        : 'bg-amber-100 text-amber-950 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800',
                    )}
                    title={billingSourceLabel(group.billingSource)}
                  >
                    <GitBranch size={11} aria-hidden />
                    {group.flowName ?? 'Sin flujo'} · {billingSourceLabel(group.billingSource)}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Cobro ruta
                </p>
                <p className="text-base font-semibold tabular-nums text-primary-700 dark:text-primary-300">
                  {formatCLP(group.routeClientCharge || group.orderChargeSum)}
                </p>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 tabular-nums">
                  {group.orders.length} pedido{group.orders.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    <th className="px-3 py-2">Pedido</th>
                    <th className="px-3 py-2">Destino</th>
                    <th className="px-3 py-2">Chofer</th>
                    <th className="px-3 py-2">Peoneta</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2 text-right tabular-nums">Bultos</th>
                    <th className="px-3 py-2 text-right tabular-nums">Cobro</th>
                    <th className="px-3 py-2 text-right tabular-nums">Pago chofer</th>
                    <th className="px-3 py-2 text-right tabular-nums">Pago peoneta</th>
                    <th className="px-3 py-2 text-right tabular-nums">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {group.orders.map((row) => (
                    <tr
                      key={row.orderId}
                      className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors duration-200"
                    >
                      <td className="px-3 py-2">
                        <span className="font-mono font-semibold text-stone-800 dark:text-stone-100">
                          {row.orderCode}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-[160px]">
                        <span
                          className="truncate block text-stone-700 dark:text-stone-300"
                          title={row.clientName}
                        >
                          {row.clientName}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-[120px]">
                        <span className="truncate block text-stone-600 dark:text-stone-400">
                          {row.driverName ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-[120px]">
                        <span className="truncate block text-stone-600 dark:text-stone-400">
                          {row.peonetaName ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <OrderStatusBadge status={row.orderStatus} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-stone-600 dark:text-stone-300">
                        {row.bultos}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium text-primary-700 dark:text-primary-300">
                        {formatCLP(row.clientCharge)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-stone-700 dark:text-stone-300">
                        {formatCLP(row.driverPay)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-stone-700 dark:text-stone-300">
                        {formatCLP(row.peonetaPay)}
                      </td>
                      <td
                        className={clsx(
                          'px-3 py-2 text-right tabular-nums font-medium',
                          row.margin >= 0
                            ? 'text-emerald-800 dark:text-emerald-300'
                            : 'text-red-700 dark:text-red-400',
                        )}
                      >
                        {formatCLP(row.margin)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-50/60 dark:bg-stone-900/50 text-xs font-semibold text-stone-700 dark:text-stone-200">
                    <td className="px-3 py-2" colSpan={5}>
                      Subtotal ruta
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">—</td>
                    <td className="px-3 py-2 text-right tabular-nums text-primary-700 dark:text-primary-300">
                      {formatCLP(group.orderChargeSum)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCLP(group.driverPay)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCLP(group.peonetaPay)}
                    </td>
                    <td
                      className={clsx(
                        'px-3 py-2 text-right tabular-nums',
                        group.margin >= 0
                          ? 'text-emerald-800 dark:text-emerald-300'
                          : 'text-red-700 dark:text-red-400',
                      )}
                    >
                      {formatCLP(group.margin)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
