import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Gauge,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { superAdminService } from '../../services/superAdmin.service';
import { ApiError } from '../../lib/api';
import { normalizeObservabilityDashboard } from '../../lib/observability';
import type { ApiObservabilityDashboard, ObservabilityTenant } from '../../types/observability';
import { ObservabilityMetricCards } from './ObservabilityMetricCards';
import { ObservabilityModulesTable } from './ObservabilityModulesTable';
import { ObservabilitySlowEndpointsTable } from './ObservabilitySlowEndpointsTable';
import { ObservabilityTenantsTable } from './ObservabilityTenantsTable';

const REFRESH_MS = 30_000;

export function ObservabilityPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ApiObservabilityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tenantFilter, setTenantFilter] = useState<'all' | ObservabilityTenant['healthStatus']>('all');

  const loadData = useCallback(async () => {
    try {
      const raw = await superAdminService.getObservability();
      setData(normalizeObservabilityDashboard(raw));
      setError('');
    } catch (err) {
      setData(null);
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la observabilidad.');
    }
  }, []);

  const load = useCallback(async (silent = false) => {
    if (silent) {
      await loadData();
      return;
    }
    setLoading(true);
    try {
      await loadData();
    } finally {
      setLoading(false);
    }
  }, [loadData]);

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

      <ObservabilityMetricCards data={data} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ObservabilityModulesTable data={data} />
        <ObservabilitySlowEndpointsTable data={data} />
      </div>

      <ObservabilityTenantsTable
        data={data}
        filteredTenants={filteredTenants}
        tenantFilter={tenantFilter}
        onTenantFilterChange={setTenantFilter}
        onTenantClick={(tenantId) => navigate(`/super-admin/tenants/${tenantId}`)}
      />

      <p className="text-[10px] text-stone-400 text-center">
        Actualizado {new Date(data.generatedAt).toLocaleTimeString('es-CL')} · auto-refresh cada 30s
      </p>
    </div>
  );
}
