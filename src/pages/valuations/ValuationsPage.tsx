import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Calculator,
  Filter,
  GitBranch,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  VALUATION_UNDER_CONSTRUCTION_MESSAGE,
  isValuationModuleEnabled,
} from '../../lib/valuationModule';
import { clsx } from 'clsx';
import { Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { api, ApiError } from '../../lib/api';
import { formatCLP, normalizeValuationLedger } from '../../lib/pricingProfile';
import { resolveOrderStatusLabel } from '../../lib/orderStatusLabels';
import { isUuid } from '../../lib/uuid';
import { useAuthStore } from '../../store/useAuthStore';
import { useClientStore } from '../../store/useClientStore';
import { useUserStore } from '../../store/useUserStore';
import type { ValuationLedger, ValuationLedgerItem } from '../../types/pricing';
import type { BillingFlowTemplate, ClientBillingAssignment } from '../../types/billingFlow';
import { normalizeGraph } from '../../types/billingFlow';
import { PricingProfileSection } from '../../components/pricing/PricingProfileSection';
import { useTenantRealtime } from '../../lib/useTenantRealtime';

type DateRange = '7d' | '30d' | '90d' | 'all';
type StatusFilter = 'all' | 'delivered' | 'rejected' | 'in_transit' | 'pending';

function cutoffForRange(range: DateRange): string | undefined {
  if (range === 'all') return undefined;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatRouteDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function mapTemplate(raw: Record<string, unknown>): BillingFlowTemplate {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenant_id ?? ''),
    name: String(raw.name ?? ''),
    description: (raw.description as string | null) ?? null,
    version: Number(raw.version ?? 1),
    isSystemDefault: Boolean(raw.is_system_default),
    graph: normalizeGraph(raw.graph),
    status: String(raw.status ?? 'draft'),
    createdAt: String(raw.created_at ?? ''),
    updatedAt: String(raw.updated_at ?? ''),
  };
}

function mapAssignment(raw: Record<string, unknown>): ClientBillingAssignment {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenant_id ?? ''),
    clientId: String(raw.client_id ?? raw.clientId ?? ''),
    clientName: (raw.client_name as string) ?? null,
    sourceTemplateId: (raw.source_template_id as string) ?? null,
    sourceTemplateVersion: (raw.source_template_version as number) ?? null,
    name: (raw.name as string) ?? null,
    graph: normalizeGraph(raw.graph),
    createdAt: String(raw.created_at ?? ''),
    updatedAt: String(raw.updated_at ?? ''),
    recomputedRoutes: Number(raw.recomputed_routes ?? raw.recomputedRoutes ?? 0),
  };
}

function SummaryCard({
  label,
  amount,
  icon,
  tone,
  hint,
}: {
  label: string;
  amount: number;
  icon: React.ReactNode;
  tone: 'client' | 'worker' | 'margin' | 'negative';
  hint?: string;
}) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl border px-4 py-3 flex items-start gap-3',
        tone === 'client' && 'bg-primary-50/80 dark:bg-primary-950/25 border-primary-100 dark:border-primary-900/50',
        tone === 'worker' && 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-700',
        tone === 'margin' && 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-100 dark:border-emerald-900/50',
        tone === 'negative' && 'bg-red-50/70 dark:bg-red-950/25 border-red-100 dark:border-red-900/50',
      )}
    >
      <div
        className={clsx(
          'absolute inset-y-0 left-0 w-1',
          tone === 'client' && 'bg-primary-500',
          tone === 'worker' && 'bg-stone-400',
          tone === 'margin' && 'bg-emerald-500',
          tone === 'negative' && 'bg-red-500',
        )}
        aria-hidden
      />
      <span
        className={clsx(
          'size-9 rounded-lg flex items-center justify-center shrink-0 ml-1',
          tone === 'client' && 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300',
          tone === 'worker' && 'bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
          tone === 'margin' && 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
          tone === 'negative' && 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
        )}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-600 dark:text-stone-400">{label}</p>
        <p className="text-lg font-bold tabular-nums text-stone-900 dark:text-stone-50">
          {formatCLP(amount)}
        </p>
        {hint ? (
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

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

  type RouteGroup = {
    routeId: string;
    routeCode: string;
    routeName: string;
    routeCreatedAt: string;
    billingClientId: string | null;
    billingClientName: string | null;
    billingSource: ValuationLedgerItem['billingSource'];
    flowName: string | null;
    routeClientCharge: number;
    orders: ValuationLedgerItem[];
    orderChargeSum: number;
    driverPay: number;
    peonetaPay: number;
    margin: number;
  };

  const routeGroups: RouteGroup[] = (() => {
    const items = ledger?.items ?? [];
    const map = new Map<string, RouteGroup>();

    for (const row of items) {
      const key = row.routeId || row.orderId;
      let group = map.get(key);
      if (!group) {
        group = {
          routeId: row.routeId,
          routeCode: row.routeCode,
          routeName: row.routeName,
          routeCreatedAt: row.routeCreatedAt,
          billingClientId: row.billingClientId,
          billingClientName: row.billingClientName,
          billingSource: row.billingSource,
          flowName: row.flowName,
          routeClientCharge: row.routeClientCharge,
          orders: [],
          orderChargeSum: 0,
          driverPay: 0,
          peonetaPay: 0,
          margin: 0,
        };
        map.set(key, group);
      }
      group.orders.push(row);
      group.orderChargeSum += row.clientCharge;
      group.driverPay += row.driverPay;
      group.peonetaPay += row.peonetaPay;
      group.margin += row.margin;
    }

    return [...map.values()];
  })();

  const billingSourceLabel = (source: ValuationLedgerItem['billingSource']) => {
    if (source === 'assignment') return 'Flujo del cliente';
    if (source === 'template') return 'Plantilla';
    return 'Perfil tenant';
  };

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

      {ledgerEnabled ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <SummaryCard
            label="Cobro a cliente"
            amount={summary.clientCharge}
            icon={<Wallet size={18} />}
            tone="client"
            hint={`${summary.orderCount} pedido${summary.orderCount !== 1 ? 's' : ''} en vista`}
          />
          <SummaryCard
            label="Pago choferes"
            amount={summary.driverPay}
            icon={<TrendingDown size={18} />}
            tone="worker"
          />
          <SummaryCard
            label="Pago peonetas"
            amount={summary.peonetaPay}
            icon={<TrendingDown size={18} />}
            tone="worker"
          />
          <SummaryCard
            label="Margen"
            amount={summary.margin}
            icon={<TrendingUp size={18} />}
            tone={summary.margin >= 0 ? 'margin' : 'negative'}
            hint={summary.margin >= 0 ? 'Positivo' : 'Negativo'}
          />
        </div>
      ) : null}

      <section
        className="rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900 px-4 py-3"
        aria-labelledby="flow-coverage-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-stone-500" aria-hidden />
            <h2 id="flow-coverage-heading" className="text-xs font-semibold text-stone-800 dark:text-stone-100">
              Cobertura de flujos
            </h2>
          </div>
          <span className="text-xs text-stone-600 dark:text-stone-400 tabular-nums">
            {withFlow}/{activeClients.length} clientes · {coveragePct}%
          </span>
        </div>
        <div
          className="h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden"
          role="progressbar"
          aria-valuenow={coveragePct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Porcentaje de clientes con flujo de cobro"
        >
          <div
            className={clsx(
              'h-full rounded-full transition-[width] duration-300',
              coveragePct >= 80 ? 'bg-emerald-500' : coveragePct >= 40 ? 'bg-primary-500' : 'bg-amber-500',
            )}
            style={{ width: `${coveragePct}%` }}
          />
        </div>
      </section>

      <PricingProfileSection onSaved={() => void loadLedger()} />

      {/* Clientes → plantillas */}
      <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-stone-500" aria-hidden />
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              Clientes y plantillas de cobro
            </h2>
          </div>
          <span className="text-xs text-stone-600 dark:text-stone-400 tabular-nums">
            {withFlow}/{activeClients.length} con flujo
          </span>
        </div>

        {activeClients.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<GitBranch size={28} aria-hidden />}
              title="Sin clientes"
              description="Crea clientes en la sección Clientes para poder asociarles una plantilla de cobro."
              action={{
                label: 'Ir a clientes',
                onClick: () => navigate('/clientes'),
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-900/80 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  <th className="px-3 py-2.5">Cliente</th>
                  <th className="px-3 py-2.5">RUT</th>
                  <th className="px-3 py-2.5">Flujo actual</th>
                  <th className="px-3 py-2.5">Asignar plantilla</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {activeClients.map((client) => {
                  const assignment = assignmentByClient.get(client.id);
                  const pick = pickByClient[client.id] ?? '';
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors duration-200"
                    >
                      <td className="px-3 py-2.5">
                        <Link
                          to={`/clientes/${client.id}`}
                          className="font-medium text-stone-800 dark:text-stone-100 hover:underline cursor-pointer"
                        >
                          {client.companyName}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-stone-600 dark:text-stone-400 font-mono text-xs">
                        {client.rut || '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        {assignment ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800">
                            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                            {assignment.name || 'Flujo propio'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                            <span className="size-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden />
                            Sin flujo — usa perfil tenant
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="min-w-[160px] max-w-[220px] rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-2 py-1.5 text-xs text-stone-800 dark:text-stone-100"
                            value={pick}
                            onChange={(e) =>
                              setPickByClient((prev) => ({
                                ...prev,
                                [client.id]: e.target.value,
                              }))
                            }
                            aria-label={`Plantilla para ${client.companyName}`}
                          >
                            <option value="">
                              {templates.length ? 'Seleccionar…' : 'Sin plantillas'}
                            </option>
                            {templates.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} (v{t.version})
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={!pick || assigningId === client.id || templates.length === 0}
                            onClick={() => void assignTemplate(client.id)}
                          >
                            {assigningId === client.id ? '…' : 'Asignar'}
                          </Button>
                          {assignment ? (
                            <Link
                              to={`/clientes/${client.id}`}
                              className="text-xs text-primary-700 dark:text-primary-300 underline cursor-pointer"
                            >
                              Editar
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {assignMsg ? (
          <p
            className="px-4 py-2 text-xs text-stone-600 dark:text-stone-400 border-t border-stone-200 dark:border-stone-800"
            role="status"
            aria-live="polite"
          >
            {assignMsg}
          </p>
        ) : null}
        {templates.length === 0 && activeClients.length > 0 ? (
          <p className="px-4 py-2 text-xs text-stone-600 border-t border-stone-200 dark:border-stone-800">
            Aún no hay plantillas.{' '}
            <button
              type="button"
              className="underline text-primary-700 dark:text-primary-300 cursor-pointer"
              onClick={() => navigate('/valorizacion/flujos/nuevo')}
            >
              Crear una plantilla
            </button>{' '}
            para poder asociarla a clientes.
          </p>
        ) : null}
      </section>

      {showFilters ? (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Select
            label="Chofer"
            value={filterDriverId}
            onChange={(e) => setFilterDriverId(e.target.value)}
            options={[
              { value: 'all', label: 'Todos los choferes' },
              ...drivers.map((d) => ({ value: d.id, label: d.name })),
            ]}
            autoComplete="off"
          />
          <Select
            label="Peoneta"
            value={filterPeonetaId}
            onChange={(e) => setFilterPeonetaId(e.target.value)}
            options={[
              { value: 'all', label: 'Todas las peonetas' },
              ...peonetas.map((p) => ({ value: p.id, label: p.name })),
            ]}
            autoComplete="off"
          />
          <Select
            label="Cuenta (mandante)"
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
            options={[
              { value: 'all', label: 'Todas las cuentas' },
              ...clients.map((c) => ({ value: c.id, label: c.companyName })),
            ]}
            autoComplete="off"
          />
          <Select
            label="Estado del pedido"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'delivered', label: resolveOrderStatusLabel('delivered', tenant) },
              { value: 'rejected', label: resolveOrderStatusLabel('rejected', tenant) },
              { value: 'in_transit', label: resolveOrderStatusLabel('in_transit', tenant) },
              { value: 'pending', label: resolveOrderStatusLabel('pending', tenant) },
            ]}
            autoComplete="off"
          />
          <Select
            label="Período (fecha ruta)"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value as DateRange)}
            options={[
              { value: '7d', label: 'Últimos 7 días' },
              { value: '30d', label: 'Últimos 30 días' },
              { value: '90d', label: 'Últimos 90 días' },
              { value: 'all', label: 'Todo el historial' },
            ]}
            autoComplete="off"
          />
          {hasActiveFilters ? (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5 flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          ) : null}
        </div>
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
        <>
          {error ? (
            <p
              className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2"
              role="alert"
            >
              <AlertTriangle size={16} className="shrink-0" aria-hidden />
              {error}
            </p>
          ) : null}

          {loading && !ledger ? (
            <p className="text-sm text-stone-600 dark:text-stone-400 py-4 text-center" role="status">
              Cargando detalle por pedido…
            </p>
          ) : (ledger?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Calculator size={32} aria-hidden />}
              title="Sin pedidos valorizados"
              description="No hay pedidos en ruta que coincidan con los filtros. Asocia plantillas arriba; el detalle aparece cuando haya rutas en el período."
            />
          ) : (
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
                  {summary.orderCount} pedido{summary.orderCount !== 1 ? 's' : ''}
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
          )}
        </>
      )}
    </div>
  );
}
