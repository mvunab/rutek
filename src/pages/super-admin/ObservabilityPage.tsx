import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Clock,
  Database,
  Gauge,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { superAdminService } from '../../services/superAdmin.service';
import { ApiError } from '../../lib/api';
import {
  formatUptime,
  loadScoreTooltip,
  normalizeObservabilityDashboard,
  severityLabel,
  tenantHealthLabel,
} from '../../lib/observability';
import type { ApiObservabilityDashboard, ObservabilityTenant } from '../../types/observability';
import { LOAD_THRESHOLDS } from '../../types/observability';

const REFRESH_MS = 30_000;

function StatusDot({ tone }: { tone: 'ok' | 'warning' | 'critical' | 'neutral' }) {
  return (
    <span
      className={clsx(
        'inline-block size-2 rounded-full shrink-0',
        tone === 'ok' && 'bg-emerald-500',
        tone === 'warning' && 'bg-amber-500',
        tone === 'critical' && 'bg-red-500',
        tone === 'neutral' && 'bg-stone-400',
      )}
      aria-hidden
    />
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: 'ok' | 'warning' | 'critical' | 'neutral';
}) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-stone-400 dark:text-stone-500" aria-hidden>{icon}</span>
        <StatusDot tone={tone} />
      </div>
      <p className="text-xl font-bold tabular-nums text-stone-900 dark:text-stone-50">{value}</p>
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-0.5">{label}</p>
      {hint ? <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">{hint}</p> : null}
    </div>
  );
}

function tenantHealthTone(status: ObservabilityTenant['healthStatus']): 'ok' | 'warning' | 'critical' | 'neutral' {
  if (status === 'high_load') return 'critical';
  if (status === 'moderate') return 'warning';
  if (status === 'healthy') return 'ok';
  return 'neutral';
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `hace ${days}d`;
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `hace ${hours}h`;
    const mins = Math.floor(diff / 60000);
    return mins > 0 ? `hace ${mins}m` : 'ahora';
  } catch {
    return iso.slice(0, 10);
  }
}

export function ObservabilityPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ApiObservabilityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tenantFilter, setTenantFilter] = useState<'all' | ObservabilityTenant['healthStatus']>('all');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const raw = await superAdminService.getObservability();
      setData(normalizeObservabilityDashboard(raw));
    } catch (err) {
      setData(null);
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la observabilidad.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(true), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const filteredTenants = useMemo(() => {
    if (!data) return [];
    if (tenantFilter === 'all') return data.tenants;
    return data.tenants.filter((t) => t.healthStatus === tenantFilter);
  }, [data, tenantFilter]);

  if (loading && !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]" role="status">
        <Activity size={20} className="animate-spin text-violet-600 mr-2" aria-hidden />
        <span className="text-sm text-stone-500">Cargando observabilidad…</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <EmptyState
          icon={<AlertTriangle size={32} aria-hidden />}
          title="Error al cargar"
          description={error}
          action={{ label: 'Reintentar', onClick: () => void load() }}
        />
      </div>
    );
  }

  if (!data) return null;

  const dbTone =
    data.platform.database.status === 'ok'
      ? 'ok'
      : data.platform.database.status === 'degraded'
        ? 'warning'
        : 'critical';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin')} icon={<ArrowLeft size={14} aria-hidden />}>
              Panel
            </Button>
            <Gauge size={22} className="text-violet-600 dark:text-violet-400" aria-hidden />
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Observabilidad</h1>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Performance de módulos y carga por tenant · ventana {data.requestTotals.windowMinutes} min
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} aria-hidden />}
          loading={loading}
          onClick={() => void load()}
        >
          Actualizar
        </Button>
      </div>

      {data.summary.bottleneckCount > 0 ? (
        <div
          className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3 flex items-start gap-3"
          role="status"
        >
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {data.summary.bottleneckCount} módulo{data.summary.bottleneckCount !== 1 ? 's' : ''} con posible cuello de botella
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Revisa latencia p95 y tasa de error. Datos desde reinicio del proceso API.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <MetricCard
          label="Requests (ventana)"
          value={String(data.requestTotals.totalRequests)}
          hint={`p95 ${data.requestTotals.p95Ms} ms`}
          icon={<Zap size={18} />}
          tone={data.requestTotals.p95Ms > 800 ? 'warning' : 'ok'}
        />
        <MetricCard
          label="Latencia media API"
          value={`${data.requestTotals.avgMs} ms`}
          icon={<Activity size={18} />}
          tone={data.requestTotals.avgMs > 500 ? 'warning' : 'ok'}
        />
        <MetricCard
          label="Errores HTTP"
          value={String(data.requestTotals.totalErrors)}
          icon={<AlertTriangle size={18} />}
          tone={data.requestTotals.totalErrors > 0 ? 'warning' : 'ok'}
        />
        <MetricCard
          label="Base de datos"
          value={`${data.platform.database.latencyMs} ms`}
          hint={data.platform.database.status}
          icon={<Database size={18} />}
          tone={dbTone}
        />
        <MetricCard
          label="Uptime API"
          value={formatUptime(data.platform.uptimeSeconds)}
          hint={data.platform.nodeVersion}
          icon={<Server size={18} />}
        />
        <MetricCard
          label="Memoria heap"
          value={`${data.platform.memoryMb.heapUsed} MB`}
          hint={`RSS ${data.platform.memoryMb.rss} MB`}
          icon={<Gauge size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Performance por módulo</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {data.summary.moduleCount} módulos · {data.summary.criticalModules} críticos
            </p>
          </div>
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500 bg-stone-50 dark:bg-stone-900/80">
                  <th className="px-3 py-2">Módulo</th>
                  <th className="px-3 py-2 text-right tabular-nums">Req.</th>
                  <th className="px-3 py-2 text-right tabular-nums">Avg</th>
                  <th className="px-3 py-2 text-right tabular-nums">p95</th>
                  <th className="px-3 py-2 text-right tabular-nums">Max</th>
                  <th className="px-3 py-2 text-right tabular-nums">Err%</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {data.modules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-stone-500 text-sm">
                      Sin tráfico registrado aún. Navega la app para generar métricas.
                    </td>
                  </tr>
                ) : (
                  data.modules.map((m) => (
                    <tr
                      key={m.module}
                      className={clsx(
                        m.isBottleneck && 'bg-amber-50/50 dark:bg-amber-950/10',
                      )}
                    >
                      <td className="px-3 py-2 font-medium text-stone-800 dark:text-stone-100">
                        {m.label}
                        {m.isBottleneck ? (
                          <span className="ml-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
                            bottleneck
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-stone-600 dark:text-stone-300">{m.requestCount}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{m.avgMs} ms</td>
                      <td
                        className={clsx(
                          'px-3 py-2 text-right tabular-nums font-medium',
                          m.p95Ms >= 1500 && 'text-red-600 dark:text-red-400',
                          m.p95Ms >= 700 && m.p95Ms < 1500 && 'text-amber-600 dark:text-amber-400',
                        )}
                      >
                        {m.p95Ms} ms
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-stone-500">{m.maxMs} ms</td>
                      <td className="px-3 py-2 text-right tabular-nums">{m.errorRate}%</td>
                      <td className="px-3 py-2">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1.5 text-xs font-medium',
                            m.severity === 'critical' && 'text-red-600 dark:text-red-400',
                            m.severity === 'warning' && 'text-amber-600 dark:text-amber-400',
                            m.severity === 'ok' && 'text-emerald-600 dark:text-emerald-400',
                          )}
                        >
                          <StatusDot
                            tone={
                              m.severity === 'critical'
                                ? 'critical'
                                : m.severity === 'warning'
                                  ? 'warning'
                                  : 'ok'
                            }
                          />
                          {severityLabel(m.severity)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Endpoints más lentos</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Por módulo y método HTTP</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500 bg-stone-50 dark:bg-stone-900/80">
                  <th className="px-3 py-2">Endpoint</th>
                  <th className="px-3 py-2 text-right tabular-nums">Req.</th>
                  <th className="px-3 py-2 text-right tabular-nums">p95</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {data.slowEndpoints.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-stone-500 text-sm">
                      Sin datos suficientes
                    </td>
                  </tr>
                ) : (
                  data.slowEndpoints.map((row) => (
                    <tr key={`${row.method}-${row.module}`}>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs text-violet-700 dark:text-violet-300">{row.method}</span>
                        <span className="text-stone-700 dark:text-stone-200 ml-2">{row.label}</span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.requestCount}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-amber-700 dark:text-amber-300">
                        {row.p95Ms} ms
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

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
            onChange={(e) => setTenantFilter(e.target.value as typeof tenantFilter)}
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
                    onClick={() => navigate(`/super-admin/tenants/${t.id}`)}
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

      <p className="text-[10px] text-stone-400 text-center">
        Actualizado {new Date(data.generatedAt).toLocaleTimeString('es-CL')} · auto-refresh cada 30s
      </p>
    </div>
  );
}
