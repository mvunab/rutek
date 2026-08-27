import type { KeyboardEvent } from 'react';
import { Building2, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { Select } from '../../components/ui/Input';
import { loadScoreTooltip, tenantHealthLabel } from '../../lib/observability';
import type { ApiObservabilityDashboard, ObservabilityTenant } from '../../types/observability';
import { LOAD_THRESHOLDS } from '../../types/observability';
import { StatusDot } from './ObservabilityShared';
import { formatRelative, tenantHealthTone } from './observabilityFormat';

type TenantFilter = 'all' | ObservabilityTenant['healthStatus'];

export function ObservabilityTenantsTable({
  data,
  filteredTenants,
  tenantFilter,
  onTenantFilterChange,
  onTenantClick,
}: {
  data: ApiObservabilityDashboard;
  filteredTenants: ObservabilityTenant[];
  tenantFilter: TenantFilter;
  onTenantFilterChange: (value: TenantFilter) => void;
  onTenantClick: (tenantId: string) => void;
}) {
  return (
    <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-violet-600" aria-hidden />
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Observabilidad por tenant</h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {data.summary.activeTenants}/{data.summary.tenantCount} activos · {data.summary.highLoadTenants} alta carga
            · Score = operacional (máx. 70) + estrés API (máx. 30)
          </p>
        </div>
        <Select
          label="Filtrar estado"
          value={tenantFilter}
          onChange={(e) => onTenantFilterChange(e.target.value as TenantFilter)}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'healthy', label: 'Saludable' },
            { value: 'moderate', label: 'Carga moderada' },
            { value: 'high_load', label: 'Alta carga' },
            { value: 'dormant', label: 'Sin actividad' },
            { value: 'inactive', label: 'Inactivo' },
          ]}
          containerClassName="w-48"
          autoComplete="off"
        />
      </div>
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500 bg-stone-50 dark:bg-stone-900/80">
              <th className="px-3 py-2">Tenant</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right tabular-nums">
                Carga
                <span className="block text-[9px] font-normal normal-case tracking-normal text-stone-400">
                  ≥{LOAD_THRESHOLDS.high} alta · ≥{LOAD_THRESHOLDS.moderate} moderada
                </span>
              </th>
              <th className="px-3 py-2 text-right tabular-nums">Ped. 7d</th>
              <th className="px-3 py-2 text-right tabular-nums">Rutas 7d</th>
              <th className="px-3 py-2 text-right tabular-nums">API 15m</th>
              <th className="px-3 py-2 text-right tabular-nums">Avg API</th>
              <th className="px-3 py-2 text-right tabular-nums">Err. 15m</th>
              <th className="px-3 py-2 text-right tabular-nums">Pedidos</th>
              <th className="px-3 py-2">Última actividad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-stone-500">Sin tenants en este filtro</td>
              </tr>
            ) : (
              filteredTenants.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-stone-50/80 dark:hover:bg-stone-800/30 cursor-pointer"
                  tabIndex={0}
                  onClick={() => onTenantClick(t.id)}
                  onKeyDown={(e: KeyboardEvent<HTMLTableRowElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onTenantClick(t.id);
                    }
                  }}
                >
                  <td className="px-3 py-2">
                    <p className="font-medium text-stone-900 dark:text-stone-100">{t.name}</p>
                    <p className="text-[10px] text-stone-400 capitalize">{t.plan}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <StatusDot tone={tenantHealthTone(t.healthStatus)} />
                      {tenantHealthLabel(t.healthStatus)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div
                      className="flex items-center justify-end gap-2"
                      title={loadScoreTooltip(t.loadBreakdown)}
                    >
                      <div className="w-16 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full',
                            t.loadScore >= LOAD_THRESHOLDS.high
                              ? 'bg-red-500'
                              : t.loadScore >= LOAD_THRESHOLDS.moderate
                                ? 'bg-amber-500'
                                : 'bg-emerald-500',
                          )}
                          style={{ width: `${t.loadScore}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums font-medium w-6">{t.loadScore}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.ordersLast7d}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.routesLast7d}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.apiRequests15m}</td>
                  <td
                    className={clsx(
                      'px-3 py-2 text-right tabular-nums',
                      t.apiAvgMs >= 600 && 'text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {t.apiAvgMs > 0 ? `${t.apiAvgMs} ms` : '—'}
                  </td>
                  <td
                    className={clsx(
                      'px-3 py-2 text-right tabular-nums',
                      t.apiErrors15m > 0 && 'text-red-600 dark:text-red-400 font-medium',
                    )}
                  >
                    {t.apiErrors15m}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.orderCount}</td>
                  <td className="px-3 py-2 text-xs text-stone-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} aria-hidden />
                      {formatRelative(t.lastActivityAt)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
