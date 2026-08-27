import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Calculator,
  Filter,
  GitBranch,
} from 'lucide-react';
import {
  VALUATION_UNDER_CONSTRUCTION_MESSAGE,
  isValuationModuleEnabled,
} from '../../lib/valuationModule';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { api, ApiError } from '../../lib/api';
import { normalizeValuationLedger } from '../../lib/pricingProfile';
import { isUuid } from '../../lib/uuid';
import { useAuthStore } from '../../store/useAuthStore';
import { useClientStore } from '../../store/useClientStore';
import { useUserStore } from '../../store/useUserStore';
import type { ValuationLedger } from '../../types/pricing';
import type { BillingFlowTemplate, ClientBillingAssignment } from '../../types/billingFlow';
import { PricingProfileSection } from '../../components/pricing/PricingProfileSection';
import { useTenantRealtime } from '../../lib/useTenantRealtime';
import { ClientTemplatesSection } from './ClientTemplatesSection';
import { FlowCoverageSection } from './FlowCoverageSection';
import { ValuationFiltersPanel } from './ValuationFiltersPanel';
import { ValuationRouteDetailSection } from './ValuationRouteDetailSection';
import { ValuationSummaryCards } from './ValuationSummaryCards';
import {
  buildRouteGroups,
  cutoffForRange,
  mapAssignment,
  mapTemplate,
  type DateRange,
  type StatusFilter,
} from './valuationUtils';

export function ValuationsPage() {
  const navigate = useNavigate();
  const { tenant } = useAuthStore();
  const valuationEnabled = isValuationModuleEnabled(tenant);
  const { clients, fetchClients } = useClientStore();
  const { users, fetchUsers } = useUserStore();

  const [ledger, setLedger] = useState<ValuationLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const [templates, setTemplates] = useState<BillingFlowTemplate[]>([]);
  const [assignments, setAssignments] = useState<ClientBillingAssignment[]>([]);
  const [pickByClient, setPickByClient] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignMsg, setAssignMsg] = useState('');

  const [filterDriverId, setFilterDriverId] = useState('all');
  const [filterPeonetaId, setFilterPeonetaId] = useState('all');
  const [filterClientId, setFilterClientId] = useState('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [filterDateRange, setFilterDateRange] = useState<DateRange>('all');

  useEffect(() => {
    void fetchClients();
    void fetchUsers();
  }, [fetchClients, fetchUsers]);

  const drivers = useMemo(
    () => users.filter((u) => u.role === 'driver' && u.active && isUuid(u.id)),
    [users],
  );
  const peonetas = useMemo(
    () => users.filter((u) => u.role === 'peoneta' && u.active && isUuid(u.id)),
    [users],
  );

  const assignmentByClient = useMemo(() => {
    const map = new Map<string, ClientBillingAssignment>();
    for (const a of assignments) map.set(a.clientId, a);
    return map;
  }, [assignments]);

  const activeClients = useMemo(
    () => clients.filter((c) => c.active).sort((a, b) => a.companyName.localeCompare(b.companyName, 'es')),
    [clients],
  );

  const loadBillingSetup = useCallback(async () => {
    if (!valuationEnabled) return;
    try {
      const [tRaw, aRaw] = await Promise.all([
        api.get<Record<string, unknown>[]>('/billing/flow-templates'),
        api.get<Record<string, unknown>[]>('/billing/client-flows'),
      ]);
      setTemplates((tRaw ?? []).map(mapTemplate));
      setAssignments((aRaw ?? []).map(mapAssignment));
    } catch {
      /* el listado de clientes sigue visible */
    }
  }, [valuationEnabled]);

  const loadLedger = useCallback(async () => {
    if (!valuationEnabled) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterDriverId !== 'all') params.set('driver_id', filterDriverId);
      if (filterPeonetaId !== 'all') params.set('peoneta_id', filterPeonetaId);
      if (filterClientId !== 'all') params.set('client_id', filterClientId);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      const from = cutoffForRange(filterDateRange);
      if (from) params.set('from', from);

      const qs = params.toString();
      const data = await api.get<Record<string, unknown>>(
        `/valuations/ledger${qs ? `?${qs}` : ''}`,
      );
      setLedger(normalizeValuationLedger(data));
    } catch (err) {
      setLedger(null);
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la valorización.');
    } finally {
      setLoading(false);
    }
  }, [
    filterDriverId,
    filterPeonetaId,
    filterClientId,
    filterStatus,
    filterDateRange,
    valuationEnabled,
  ]);

  useEffect(() => {
    if (!valuationEnabled) {
      setLoading(false);
      return;
    }
    void loadBillingSetup();
    void loadLedger();
  }, [loadBillingSetup, loadLedger, valuationEnabled]);

  useTenantRealtime(valuationEnabled, () => {
    void loadLedger();
  });

  const assignTemplate = async (clientId: string) => {
    const templateId = pickByClient[clientId];
    if (!templateId) return;
    setAssigningId(clientId);
    setAssignMsg('');
    try {
      const raw = await api.post<Record<string, unknown>>(
        `/billing/clients/${clientId}/flow`,
        { template_id: templateId },
      );
      const mapped = mapAssignment(raw);
      setAssignments((prev) => {
        const rest = prev.filter((a) => a.clientId !== clientId);
        return [mapped, ...rest];
      });
      const n = mapped.recomputedRoutes ?? 0;
      setAssignMsg(
        n > 0
          ? `Plantilla asignada. ${n} ruta${n !== 1 ? 's' : ''} completed recalculada${n !== 1 ? 's' : ''}.`
          : 'Plantilla clonada y asignada al cliente.',
      );
      void loadLedger();
    } catch (err) {
      setAssignMsg(err instanceof ApiError ? err.message : 'No se pudo asignar la plantilla.');
    } finally {
      setAssigningId(null);
    }
  };

  if (!valuationEnabled) {
    return (
      <EmptyState
        icon={<Calculator size={32} aria-hidden />}
        title="Valorización"
        description={VALUATION_UNDER_CONSTRUCTION_MESSAGE}
      />
    );
  }

  const hasActiveFilters =
    filterDriverId !== 'all' ||
    filterPeonetaId !== 'all' ||
    filterClientId !== 'all' ||
    filterStatus !== 'all' ||
    filterDateRange !== 'all';

  const clearFilters = () => {
    setFilterDriverId('all');
    setFilterPeonetaId('all');
    setFilterClientId('all');
    setFilterStatus('all');
    setFilterDateRange('all');
  };

  const summary = ledger?.summary ?? {
    orderCount: 0,
    clientCharge: 0,
    driverPay: 0,
    peonetaPay: 0,
    workerPayTotal: 0,
    margin: 0,
  };

  const ledgerEnabled = ledger?.enabled !== false;
  const withFlow = activeClients.filter((c) => assignmentByClient.has(c.id)).length;
  const routeGroups = buildRouteGroups(ledger?.items ?? []);
  const coveragePct =
    activeClients.length > 0 ? Math.round((withFlow / activeClients.length) * 100) : 0;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Configura pagos a chofer/peoneta, asocia flujos de cobro por cliente y revisa el
            detalle por ruta.
          </p>
          <p className="inline-flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
            <Activity
              size={12}
              className="text-emerald-600 dark:text-emerald-400 motion-safe:animate-pulse"
              aria-hidden
            />
            Actualización en vivo al cerrar rutas o entregas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<GitBranch size={14} aria-hidden />}
            onClick={() => navigate('/valorizacion/flujos')}
          >
            Flujos de cobro
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Filter size={14} aria-hidden />}
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
          >
            Filtros
            {hasActiveFilters ? (
              <span
                className="ml-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary-600 text-[10px] font-semibold text-white tabular-nums"
                aria-label="Filtros activos"
              >
                !
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      {ledgerEnabled ? <ValuationSummaryCards summary={summary} /> : null}

      <FlowCoverageSection
        withFlow={withFlow}
        activeClientsCount={activeClients.length}
        coveragePct={coveragePct}
      />

      <PricingProfileSection onSaved={() => void loadLedger()} />

      <ClientTemplatesSection
        activeClients={activeClients}
        templates={templates}
        assignmentByClient={assignmentByClient}
        pickByClient={pickByClient}
        assigningId={assigningId}
        assignMsg={assignMsg}
        withFlow={withFlow}
        onPickChange={(clientId, templateId) =>
          setPickByClient((prev) => ({ ...prev, [clientId]: templateId }))
        }
        onAssign={(clientId) => void assignTemplate(clientId)}
        onNavigate={navigate}
      />

      {showFilters ? (
        <ValuationFiltersPanel
          tenant={tenant}
          drivers={drivers}
          peonetas={peonetas}
          clients={clients}
          filterDriverId={filterDriverId}
          filterPeonetaId={filterPeonetaId}
          filterClientId={filterClientId}
          filterStatus={filterStatus}
          filterDateRange={filterDateRange}
          hasActiveFilters={hasActiveFilters}
          onDriverChange={setFilterDriverId}
          onPeonetaChange={setFilterPeonetaId}
          onClientChange={setFilterClientId}
          onStatusChange={setFilterStatus}
          onDateRangeChange={setFilterDateRange}
          onClear={clearFilters}
        />
      ) : null}

      {!ledgerEnabled ? (
        <div
          className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3"
          role="status"
        >
          <p className="text-sm text-amber-950 dark:text-amber-100 flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden />
            <span>
              El detalle por pedido aparece al activar las tarifas del tenant (arriba) o al asignar
              al menos un flujo a un cliente.
            </span>
          </p>
        </div>
      ) : (
        <ValuationRouteDetailSection
          loading={loading}
          error={error}
          routeGroups={routeGroups}
          orderCount={summary.orderCount}
        />
      )}
    </div>
  );
}
