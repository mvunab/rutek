import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Filter,
  RefreshCw,
  Settings,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { api, ApiError } from '../../lib/api';
import { formatCLP, normalizeValuationLedger } from '../../lib/pricingProfile';
import { resolveOrderStatusLabel } from '../../lib/orderStatusLabels';
import { useAuthStore } from '../../store/useAuthStore';
import { useClientStore } from '../../store/useClientStore';
import { useUserStore } from '../../store/useUserStore';
import type { ValuationLedger } from '../../types/pricing';

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

function SummaryCard({
  label,
  amount,
  icon,
  tone,
}: {
  label: string;
  amount: number;
  icon: React.ReactNode;
  tone: 'client' | 'worker' | 'margin' | 'negative';
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border px-4 py-3 flex items-start gap-3',
        tone === 'client' && 'bg-blue-50/70 dark:bg-blue-950/25 border-blue-100 dark:border-blue-900/50',
        tone === 'worker' && 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-700',
        tone === 'margin' && 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-100 dark:border-emerald-900/50',
        tone === 'negative' && 'bg-red-50/70 dark:bg-red-950/25 border-red-100 dark:border-red-900/50',
      )}
    >
      <span
        className={clsx(
          'size-9 rounded-lg flex items-center justify-center shrink-0',
          tone === 'client' && 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
          tone === 'worker' && 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300',
          tone === 'margin' && 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
          tone === 'negative' && 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
        )}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</p>
        <p className="text-lg font-bold tabular-nums text-stone-900 dark:text-stone-50">
          {formatCLP(amount)}
        </p>
      </div>
    </div>
  );
}

export function ValuationsPage() {
  const navigate = useNavigate();
  const { tenant } = useAuthStore();
  const { clients, fetchClients } = useClientStore();
  const { users, fetchUsers } = useUserStore();

  const [ledger, setLedger] = useState<ValuationLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const [filterDriverId, setFilterDriverId] = useState('all');
  const [filterPeonetaId, setFilterPeonetaId] = useState('all');
  const [filterClientId, setFilterClientId] = useState('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [filterDateRange, setFilterDateRange] = useState<DateRange>('30d');

  useEffect(() => {
    void fetchClients();
    void fetchUsers();
  }, [fetchClients, fetchUsers]);

  const drivers = useMemo(
    () => users.filter((u) => u.role === 'driver' && u.active),
    [users],
  );
  const peonetas = useMemo(
    () => users.filter((u) => u.role === 'peoneta' && u.active),
    [users],
  );

  const loadLedger = useCallback(async () => {
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
  }, [filterDriverId, filterPeonetaId, filterClientId, filterStatus, filterDateRange]);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

  const hasActiveFilters =
    filterDriverId !== 'all' ||
    filterPeonetaId !== 'all' ||
    filterClientId !== 'all' ||
    filterStatus !== 'all' ||
    filterDateRange !== '30d';

  const clearFilters = () => {
    setFilterDriverId('all');
    setFilterPeonetaId('all');
    setFilterClientId('all');
    setFilterStatus('all');
    setFilterDateRange('30d');
  };

  if (loading && !ledger) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400 py-8 text-center" role="status">
        Cargando valorización…
      </p>
    );
  }

  if (ledger && !ledger.enabled) {
    return (
      <EmptyState
        icon={<Calculator size={32} aria-hidden />}
        title="Valorización desactivada"
        description="Activa el perfil de cobro y pago en Configuración para ver montos por pedido."
        action={{
          label: 'Ir a Configuración',
          onClick: () => navigate('/configuracion'),
          icon: <Settings size={16} aria-hidden />,
        }}
      />
    );
  }

  const summary = ledger?.summary ?? {
    orderCount: 0,
    clientCharge: 0,
    driverPay: 0,
    peonetaPay: 0,
    workerPayTotal: 0,
    margin: 0,
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Perfil v{ledger?.profileVersion ?? 1} · Montos estimados según reglas activas
          </p>
        </div>
        <div className="flex items-center gap-2">
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
              <span className="ml-1 size-1.5 rounded-full bg-violet-500" aria-hidden />
            ) : null}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} aria-hidden />}
            loading={loading}
            onClick={() => void loadLedger()}
          >
            Actualizar
          </Button>
        </div>
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <SummaryCard
          label="Cobro a cliente"
          amount={summary.clientCharge}
          icon={<Wallet size={18} />}
          tone="client"
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
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && (ledger?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Calculator size={32} aria-hidden />}
          title="Sin pedidos valorizados"
          description="No hay pedidos en ruta que coincidan con los filtros seleccionados."
        />
      ) : (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              Detalle por pedido
            </h2>
            <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
              {summary.orderCount} pedido{summary.orderCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-900/80 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <th className="px-3 py-2.5">Pedido</th>
                  <th className="px-3 py-2.5">Ruta</th>
                  <th className="px-3 py-2.5">Cuenta</th>
                  <th className="px-3 py-2.5">Chofer</th>
                  <th className="px-3 py-2.5">Peoneta</th>
                  <th className="px-3 py-2.5">Estado</th>
                  <th className="px-3 py-2.5 text-right tabular-nums">Bultos</th>
                  <th className="px-3 py-2.5 text-right tabular-nums">Cobro</th>
                  <th className="px-3 py-2.5 text-right tabular-nums">Pago chofer</th>
                  <th className="px-3 py-2.5 text-right tabular-nums">Pago peoneta</th>
                  <th className="px-3 py-2.5 text-right tabular-nums">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {ledger?.items.map((row) => (
                  <tr
                    key={row.orderId}
                    className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <span className="font-mono font-semibold text-stone-800 dark:text-stone-100">
                        {row.orderCode}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 min-w-0">
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-stone-600 dark:text-stone-300 block">
                          {row.routeCode}
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate block max-w-[140px]">
                          {formatRouteDate(row.routeCreatedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 max-w-[140px]">
                      <span className="truncate block text-stone-700 dark:text-stone-300" title={row.clientName}>
                        {row.clientName}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[120px]">
                      <span className="truncate block text-stone-600 dark:text-stone-400">
                        {row.driverName ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[120px]">
                      <span className="truncate block text-stone-600 dark:text-stone-400">
                        {row.peonetaName ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <OrderStatusBadge status={row.orderStatus} />
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-stone-600 dark:text-stone-300">
                      {row.bultos}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium text-blue-700 dark:text-blue-300">
                      {formatCLP(row.clientCharge)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-stone-700 dark:text-stone-300">
                      {formatCLP(row.driverPay)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-stone-700 dark:text-stone-300">
                      {formatCLP(row.peonetaPay)}
                    </td>
                    <td
                      className={clsx(
                        'px-3 py-2.5 text-right tabular-nums font-medium',
                        row.margin >= 0
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-red-600 dark:text-red-400',
                      )}
                    >
                      {formatCLP(row.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {(ledger?.items.length ?? 0) > 0 ? (
                <tfoot>
                  <tr className="bg-stone-50 dark:bg-stone-900/80 font-semibold text-stone-800 dark:text-stone-100">
                    <td className="px-3 py-2.5" colSpan={6}>
                      Totales
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">—</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-blue-700 dark:text-blue-300">
                      {formatCLP(summary.clientCharge)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatCLP(summary.driverPay)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatCLP(summary.peonetaPay)}
                    </td>
                    <td
                      className={clsx(
                        'px-3 py-2.5 text-right tabular-nums',
                        summary.margin >= 0
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-red-600 dark:text-red-400',
                      )}
                    >
                      {formatCLP(summary.margin)}
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
