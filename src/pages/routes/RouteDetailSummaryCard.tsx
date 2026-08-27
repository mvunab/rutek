import { AlertTriangle, Box, Check, CheckCircle2, Copy, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { formatRouteSequence } from '../../lib/routeSequence';
import {
  containerCard,
  formatRouteDayElegant,
  summarizeRouteVehicles,
} from './routesShared';
import { RouteModalStat, RoutePriorityChip } from './RouteModalStat';
import type { RouteDetailPanelState } from './useRouteDetailSidePanel';

export function RouteDetailSummaryCard(s: RouteDetailPanelState) {
  const {
    route,
    assigned,
    totals,
    fechaSrc,
    deliveredCount,
    rejectedCount,
    terminalCount,
    deliveryProgressPct,
    routeClientLabel,
    routeDriversLabel,
    routePeonetasLabel,
    codeCopied,
    copyRouteCode,
  } = s;

  return (
    <div className={clsx(containerCard, 'p-3')}>
              <div className="flex gap-2.5">
                <div
                  className="size-10 shrink-0 rounded-lg bg-primary-50 border border-primary-200/80 dark:bg-stone-800 dark:border-stone-700 flex items-center justify-center"
                  aria-hidden
                >
                  <Box size={20} className="text-primary-600 dark:text-amber-500/90" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span translate="no" className="font-mono text-sm font-bold text-stone-900 dark:text-white truncate">
                          N° {formatRouteSequence(route)}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copyRouteCode()}
                          className="p-0.5 rounded text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                          aria-label={codeCopied ? 'N° copiado' : 'Copiar n° de ruta'}
                        >
                          {codeCopied ? (
                            <Check size={12} className="text-emerald-400" aria-hidden />
                          ) : (
                            <Copy size={12} aria-hidden />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate leading-tight">{route.name}</p>
                    </div>
                    <RoutePriorityChip status={route.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2.5 pt-2.5 border-t border-stone-200 dark:border-stone-800">
                <RouteModalStat label="Cuenta">{routeClientLabel}</RouteModalStat>
                <RouteModalStat label="Fecha">{formatRouteDayElegant(fechaSrc)}</RouteModalStat>
                <RouteModalStat label="Choferes">
                  <span title="Asignación por pedido en esta ruta">
                    {routeDriversLabel || '—'}
                  </span>
                  {routePeonetasLabel ? (
                    <span
                      className="block text-[10px] font-normal text-stone-400 dark:text-stone-500 mt-0.5 leading-snug"
                      title="Peoneta por pedido"
                    >
                      Peoneta: {routePeonetasLabel}
                    </span>
                  ) : null}
                </RouteModalStat>
                <RouteModalStat label="Vehículos">
                  <span title="Patente por pedido en esta ruta">
                    {summarizeRouteVehicles(assigned, route.vehiclePlate) || '—'}
                  </span>
                </RouteModalStat>
              </div>

              <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400 tabular-nums flex flex-wrap gap-x-3 gap-y-0.5">
                <span>
                  <span className="text-stone-500">Pedidos </span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{totals.pedidos}</span>
                </span>
                <span>
                  <span className="text-stone-500">Bultos </span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{totals.bultos}</span>
                </span>
                <span>
                  <span className="text-stone-500">Entregados </span>
                  <span
                    className={clsx(
                      'font-semibold tabular-nums inline-flex items-center gap-1',
                      deliveredCount > 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-stone-800 dark:text-stone-200',
                    )}
                  >
                    {deliveredCount > 0 ? <CheckCircle2 size={12} aria-hidden /> : null}
                    {deliveredCount}/{assigned.length}
                  </span>
                </span>
                {rejectedCount > 0 ? (
                  <span>
                    <span className="text-stone-500">Rechazados </span>
                    <span className="font-semibold text-red-700 dark:text-red-300 tabular-nums inline-flex items-center gap-1">
                      <AlertTriangle size={12} aria-hidden />
                      {rejectedCount}
                      <span className="font-normal text-red-600/80 dark:text-red-200/80">· requieren acción</span>
                    </span>
                  </span>
                ) : null}
              </p>

              {rejectedCount > 0 && route.status === 'completed' ? (
                <div className="mt-2 rounded-lg border border-red-300/90 bg-red-50/80 px-2.5 py-2 dark:border-red-900/60 dark:bg-red-950/40">
                  <p className="text-[11px] text-red-900 dark:text-red-100 leading-snug">
                    Ruta completada para el repartidor, con {rejectedCount} pedido
                    {rejectedCount !== 1 ? 's' : ''} en limbo. Reprograma, reasigna o quita de la ruta.
                  </p>
                </div>
              ) : null}

              {assigned.length > 0 ? (
                <div
                  className="mt-2 h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={deliveryProgressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progreso de ruta: ${terminalCount} de ${assigned.length} pedidos resueltos`}
                >
                  <div
                    className={clsx(
                      'h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none',
                      rejectedCount > 0 ? 'bg-red-500' : 'bg-emerald-500',
                    )}
                    style={{ width: `${deliveryProgressPct}%` }}
                  />
                </div>
              ) : null}

              {route.notes?.trim() ? (
                <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-2 flex gap-1.5 dark:bg-amber-950/40 dark:border-amber-800/50">
                  <MapPin size={12} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" aria-hidden />
                  <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 leading-snug line-clamp-3">
                    {route.notes.trim()}
                  </p>
                </div>
              ) : null}
    </div>
  );
}
