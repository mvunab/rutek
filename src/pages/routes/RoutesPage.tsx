import { useEffect, useState, useMemo, type ReactNode } from 'react';
import {
  Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown,
  Download, RefreshCw, SlidersHorizontal, Package, UserCircle, Route as RouteIcon, Truck,
  Pencil, Trash2, X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RouteStatusBadge } from '../../components/ui/Badge';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRouteStore } from '../../store/useRouteStore';
import type { Route, RouteStatus, Order } from '../../types';
import { routeStatusLabel } from '../../lib/routeStatusLabels';
import { clsx } from 'clsx';
import { ApiError } from '../../lib/api';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useClientStore } from '../../store/useClientStore';
import { useUserStore } from '../../store/useUserStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { OrderForm, type OrderFormData } from '../../components/orders/OrderForm';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';

/** Fecha legible para cabecera de ruta (planificación / inicio). */
function formatRouteDay(isoLike: string | undefined): string {
  if (!isoLike?.trim()) return '—';
  try {
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(d);
  } catch {
    return '—';
  }
}

/** Fecha estilo tarjeta del modal de ruta (ej. 20 - 05 - 2026). */
function formatRouteDayElegant(isoLike: string | undefined): string {
  if (!isoLike?.trim()) return '—';
  try {
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd} - ${mm} - ${d.getFullYear()}`;
  } catch {
    return '—';
  }
}

function RouteModalStat({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="text-[13px] font-semibold text-stone-900 dark:text-stone-50 tabular-nums">
        {children}
      </div>
    </div>
  );
}

function OrderCardAction({
  icon,
  label,
  onClick,
  active = false,
  loading = false,
  disabled = false,
  tone = 'violet',
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  loading?: boolean;
  disabled?: boolean;
  tone?: 'violet' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 min-w-[4.75rem] rounded-lg px-3 py-2 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        tone === 'danger'
          ? 'bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-400 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60'
          : active
            ? 'bg-violet-200 text-violet-900 focus-visible:ring-violet-500 dark:bg-violet-900/60 dark:text-violet-100'
            : 'bg-violet-100/90 text-violet-800 hover:bg-violet-200/90 focus-visible:ring-violet-400 dark:bg-violet-950/50 dark:text-violet-200 dark:hover:bg-violet-900/50',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{loading ? '…' : label}</span>
    </button>
  );
}

/** Resumen de patentes en pedidos de una ruta (varios vehículos posibles). */
function summarizeRouteVehicles(
  routeOrders: Order[],
  legacyRoutePlate?: string,
): string {
  const plates = [
    ...new Set(
      routeOrders
        .map((o) => o.vehiclePlate?.trim())
        .filter((p): p is string => Boolean(p)),
    ),
  ];
  if (plates.length === 1) return plates[0]!;
  if (plates.length > 1) return `${plates.length} patentes`;
  return legacyRoutePlate?.trim() ?? '';
}

// ─── Sort icon ────────────────────────────────────────────────────────────────
type SortDir = 'asc' | 'desc' | null;

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc')  return <ChevronUp size={12} className="text-primary-600 dark:text-primary-400" />;
  if (dir === 'desc') return <ChevronDown size={12} className="text-primary-600 dark:text-primary-400" />;
  return <ChevronsUpDown size={12} className="text-stone-300 dark:text-stone-600 group-hover:text-stone-400 dark:group-hover:text-stone-500" />;
}

type RouteSortKey = 'code' | 'name' | 'status' | 'pedidos' | 'bultos' | 'fecha' | 'driverName' | 'vehiclePlate';

const ROUTE_STATUSES: RouteStatus[] = ['not_started', 'in_progress', 'completed', 'cancelled'];

const routeStatusDot: Record<RouteStatus, string> = {
  not_started: 'bg-stone-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};

// ─── Column header ────────────────────────────────────────────────────────────
function RouteColHeader({
  label, col, sortCol, sortDir, onSort, className,
}: {
  label: string;
  col: RouteSortKey;
  sortCol: RouteSortKey | null;
  sortDir: SortDir;
  onSort: (col: RouteSortKey) => void;
  className?: string;
}) {
  return (
    <th
      onClick={() => onSort(col)}
      className={clsx(
        'group px-3 py-2.5 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide',
        'cursor-pointer select-none hover:text-stone-700 dark:hover:text-stone-200 whitespace-nowrap border-b border-stone-200 dark:border-stone-700',
        className
      )}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon dir={sortCol === col ? sortDir : null} />
      </div>
    </th>
  );
}

// ─── Route Form (create/edit) ─────────────────────────────────────────────────
interface RouteFormData {
  code: string;
  name: string;
  notes: string;
  clientId: string;
}

function RouteForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  error,
}: {
  initial?: Partial<RouteFormData>;
  onSubmit: (data: RouteFormData) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  error?: string | null;
}) {
  const { clients, fetchClients } = useClientStore();
  const [form, setForm] = useState<RouteFormData>({
    code: '',
    name: '',
    notes: '',
    clientId: '',
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const f = (field: keyof RouteFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const clientOptions = [
    { value: '', label: 'Sin cliente (se asigna al primer pedido)…' },
    ...clients
      .filter((c) => c.active)
      .toSorted((a, b) => a.companyName.localeCompare(b.companyName, 'es'))
      .map((c) => ({ value: c.id, label: c.companyName })),
  ];

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        code: form.code.trim(),
        name: form.name.trim(),
        notes: form.notes.trim(),
        clientId: form.clientId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <Select
        label="Cliente"
        value={form.clientId}
        onChange={f('clientId')}
        options={clientOptions}
        autoComplete="off"
        hint="Todos los pedidos de la ruta deben pertenecer al mismo cliente. Si no lo seleccionás ahora, se inferirá del primer pedido que agregues."
      />
      <Input
        label="Nombre de la ruta"
        placeholder="Ej: Santiago Norte"
        value={form.name}
        onChange={f('name')}
        name="route_name"
      />
      <Input
        label="Código / folio interno"
        placeholder="Opcional — se genera automáticamente si lo dejás vacío"
        value={form.code}
        onChange={f('code')}
        name="route_code"
        autoComplete="off"
        spellCheck={false}
        hint="Folio de uso interno. No es necesario completarlo."
      />
      <Textarea
        label="Notas"
        placeholder="Instrucciones opcionales…"
        value={form.notes}
        onChange={f('notes')}
        rows={3}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => void handleSubmit()} loading={saving} disabled={!form.name.trim()}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}


/** Detalle administrativo: crear y consultar pedidos en el contexto de esta ruta. */
function RoutePedidosModal({ route, onClose }: { route: Route; onClose: () => void }) {
  const { user } = useAuthStore();
  const canManage = user?.role === 'admin' || user?.role === 'operator';
  const { orders, assignToRoute, detachOrderFromRoute, fetchOrders, addOrder, updateOrder } = useOrderStore();
  const { fetchRoutes, addOrderToRoute, assignDriverToOrders } = useRouteStore();
  const { clients, fetchClients } = useClientStore();
  const { users, fetchUsers } = useUserStore();
  const { vehicles, fetchVehicles } = useVehicleStore();

  useEffect(() => {
    void fetchClients();
    void fetchUsers();
    void fetchVehicles();
  }, [fetchClients, fetchUsers, fetchVehicles]);

  const [pickOrderId, setPickOrderId] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  // Asignación por pedido individual
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDraftDriver, setOrderDraftDriver] = useState('');
  const [orderDraftPeoneta, setOrderDraftPeoneta] = useState('');
  const [orderDraftVehicle, setOrderDraftVehicle] = useState('');
  const [orderApplyToAll, setOrderApplyToAll] = useState(false);
  const [orderAssignBusy, setOrderAssignBusy] = useState<string | null>(null);
  const [orderAssignSaved, setOrderAssignSaved] = useState<string | null>(null);
  const [sameVehicleConfirm, setSameVehicleConfirm] = useState<{
    orderId: string;
    plate: string;
    otherCodes: string[];
  } | null>(null);

  const assigned = useMemo(
    () =>
      orders
        .filter((o) => o.routeId === route.id)
        .toSorted((a, b) => a.code.localeCompare(b.code, 'es')),
    [orders, route.id],
  );

  const orphanOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          !o.routeId &&
          o.status !== 'delivered' &&
          o.status !== 'cancelled',
      ),
    [orders],
  );

  const totals = useMemo(() => {
    const bultos = assigned.reduce((s, o) => s + (Number(o.bultos) || 0), 0);
    return { pedidos: assigned.length, bultos };
  }, [assigned]);

  const orphanOptions = useMemo(() => {
    const opts = orphanOrders.toSorted((a, b) => a.code.localeCompare(b.code, 'es'));
    return [
      { value: '', label: 'Seleccionar pedido sin ruta (legacy)…' },
      ...opts.map((o) => ({
        value: o.id,
        label: `${o.code} · ${o.clientName?.trim() || 'Sin cliente'} · ${o.destination.city} · ${o.bultos} bultos`,
      })),
    ];
  }, [orphanOrders]);

  const driversList = useMemo(
    () =>
      users
        .filter((u) => u.role === 'driver' && u.active)
        .toSorted((a, b) => a.name.localeCompare(b.name, 'es')),
    [users],
  );

  const peonetasList = useMemo(
    () =>
      users
        .filter((u) => u.role === 'peoneta' && u.active)
        .toSorted((a, b) => a.name.localeCompare(b.name, 'es')),
    [users],
  );

  const driverSelectOpts = useMemo(
    () => [
      { value: '', label: 'Sin chofer asignado…' },
      ...driversList.map((d) => ({ value: d.id, label: d.name })),
    ],
    [driversList],
  );

  const peonetaSelectOpts = useMemo(
    () => [
      { value: '', label: 'Sin peoneta asignado…' },
      ...peonetasList.map((p) => ({ value: p.id, label: p.name })),
    ],
    [peonetasList],
  );

  const vehiclesSorted = useMemo(
    () => vehicles.toSorted((a, b) => a.plate.localeCompare(b.plate, 'es')),
    [vehicles],
  );

  const vehicleSelectOpts = useMemo(
    () => [
      { value: '', label: 'Sin vehículo asignado…' },
      ...vehiclesSorted.map((v) => ({
        value: v.id,
        label: `${v.plate} · ${v.brand} ${v.model}${v.available ? '' : ' (no disponible)'}`,
      })),
    ],
    [vehiclesSorted],
  );

  const handleAttachOrphan = async () => {
    if (!pickOrderId) return;
    setActionError(null);
    setBusyId('add');
    try {
      await assignToRoute(pickOrderId, route.id);
      addOrderToRoute(route.id, pickOrderId);
      setPickOrderId('');
      await fetchOrders();
      await fetchRoutes();
    } catch {
      setActionError('No se pudo vincular el pedido. Revisa permisos y conexión.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateOrder = async (data: OrderFormData) => {
    const client = clients.find((c) => c.id === data.clientId);
    setActionError(null);
    setBusyId('create');
    try {
      const created = await addOrder({
        clientId: data.clientId,
        clientName: client?.companyName ?? '',
        status: 'pending',
        priority: data.priority,
        routeId: route.id,
        origin: { street: '', city: '', region: '' },
        destination: {
          street: data.destStreet,
          city: data.destCity,
          region: data.destRegion,
        },
        items: [],
        totalWeight: 0,
        totalVolume: 0,
        estimatedDelivery: data.estimatedDelivery,
        notes: data.notes,
        bultos: data.bultos,
        ...(data.dispatchGuideUrl.trim()
          ? { dispatchGuideUrl: data.dispatchGuideUrl.trim() }
          : {}),
      });
      if (created) addOrderToRoute(route.id, created.id);
      setShowCreateForm(false);
      setCreateFormKey((k) => k + 1);
      await fetchOrders();
      await fetchRoutes();
    } catch (err) {
      // Intentar extraer el mensaje real del servidor (ApiError o NestJS 400/422).
      let msg = 'No se pudo crear el pedido en esta ruta.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse((err as { body?: string }).body ?? '{}') as Record<string, unknown>;
          const apiMsg = parsed.message;
          if (typeof apiMsg === 'string' && apiMsg.length > 0) msg = apiMsg;
          else if (Array.isArray(apiMsg) && apiMsg.length > 0) msg = (apiMsg as string[]).join(' · ');
        } catch {
          // body no era JSON, usar el mensaje genérico
        }
      }
      setActionError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (orderId: string) => {
    setActionError(null);
    setBusyId(orderId);
    try {
      await detachOrderFromRoute(orderId);
      await fetchOrders();
      await fetchRoutes();
    } catch {
      setActionError('No se pudo quitar el pedido de la ruta.');
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenOrderAssign = (o: Order) => {
    setExpandedOrderId(o.id);
    setOrderDraftDriver(o.driverId ?? '');
    setOrderDraftPeoneta(o.peonetaId ?? '');
    setOrderDraftVehicle(o.vehicleId ?? '');
    setOrderApplyToAll(false);
  };

  const handleCancelOrderAssign = () => {
    setExpandedOrderId(null);
    setOrderDraftDriver('');
    setOrderDraftPeoneta('');
    setOrderDraftVehicle('');
    setOrderApplyToAll(false);
  };

  const getSameVehicleConflict = (
    orderId: string,
  ): { plate: string; otherCodes: string[] } | null => {
    if (!orderDraftVehicle.trim()) return null;
    const v = vehiclesSorted.find((x) => x.id === orderDraftVehicle);
    if (!v) return null;

    if (orderApplyToAll) {
      if (assigned.length <= 1) return null;
      return {
        plate: v.plate,
        otherCodes: assigned.map((o) => o.code),
      };
    }

    const others = assigned.filter(
      (o) => o.id !== orderId && o.vehicleId === orderDraftVehicle,
    );
    if (others.length === 0) return null;
    return {
      plate: v.plate,
      otherCodes: others.map((o) => o.code),
    };
  };

  const performSaveOrderAssignment = async (orderId: string) => {
    setOrderAssignBusy(orderId);
    setActionError(null);
    try {
      const d = orderDraftDriver ? driversList.find((u) => u.id === orderDraftDriver) : null;
      const pe = orderDraftPeoneta ? peonetasList.find((u) => u.id === orderDraftPeoneta) : null;
      const v = orderDraftVehicle ? vehiclesSorted.find((x) => x.id === orderDraftVehicle) : null;

      if (orderApplyToAll) {
        await assignDriverToOrders(route.id, {
          driverId: d ? d.id : null,
          driverName: d ? d.name : null,
          peonetaId: pe ? pe.id : null,
          peonetaName: pe ? pe.name : null,
          vehicleId: v ? v.id : null,
          vehiclePlate: v ? v.plate : null,
        });
      } else {
        await updateOrder(orderId, {
          driverId: d ? d.id : null,
          driverName: d ? d.name : null,
          peonetaId: pe ? pe.id : null,
          peonetaName: pe ? pe.name : null,
          vehicleId: v ? v.id : null,
          vehiclePlate: v ? v.plate : null,
        });
      }

      await fetchOrders();
      setExpandedOrderId(null);
      setOrderDraftDriver('');
      setOrderDraftPeoneta('');
      setOrderDraftVehicle('');
      setOrderApplyToAll(false);
      setOrderAssignSaved(orderId);
      setTimeout(() => setOrderAssignSaved(null), 3000);
    } catch {
      setActionError('No se pudo guardar la asignación del pedido.');
    } finally {
      setOrderAssignBusy(null);
    }
  };

  const handleSaveOrderAssignment = (orderId: string) => {
    const conflict = getSameVehicleConflict(orderId);
    if (conflict) {
      setSameVehicleConfirm({ orderId, plate: conflict.plate, otherCodes: conflict.otherCodes });
      return;
    }
    void performSaveOrderAssignment(orderId);
  };

  const fechaSrc =
    typeof route.startTime === 'string' && route.startTime.includes('T')
      ? route.startTime
      : route.createdAt;

  const deliveredCount = assigned.filter((o) => o.status === 'delivered').length;

  return (
    <>
      <Modal open onClose={onClose} bare size="2xl" contentClassName="px-6 sm:px-8 pb-8 pt-6">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-50 tracking-tight text-balance">
                Ruta {route.code}
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 dark:text-stone-500 mt-0.5 truncate">
                {route.name}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              aria-label="Cerrar"
            >
              <X size={20} aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pb-4 border-b border-stone-100 dark:border-stone-800">
            <RouteModalStat label="Fecha">{formatRouteDayElegant(fechaSrc)}</RouteModalStat>
            <RouteModalStat label="Pedidos">{totals.pedidos}</RouteModalStat>
            <RouteModalStat label="Bultos Totales">{totals.bultos}</RouteModalStat>
            <RouteModalStat label="Estado Ruta">
              <RouteStatusBadge status={route.status} />
            </RouteModalStat>
          </div>

          {assigned.length > 0 ? (
            <p className="text-[11px] text-stone-400 dark:text-stone-500 -mt-2" aria-live="polite">
              <span className="font-medium text-stone-500 dark:text-stone-400 tabular-nums">
                {deliveredCount}/{assigned.length}
              </span>{' '}
              pedidos marcados como entregados · el estado de la ruta se actualiza desde el servidor
            </p>
          ) : null}

          {actionError ? (
            <p className="text-sm text-red-600 dark:text-red-400 rounded-xl bg-red-50 dark:bg-red-950/30 px-4 py-3" role="alert">
              {actionError}
            </p>
          ) : null}

          {assigned.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/30 py-16 text-center">
              <Package size={32} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" aria-hidden />
              <p className="text-sm text-stone-500 dark:text-stone-400">Ningún pedido en esta ruta aún.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {assigned.map((o) => {
                const destLabel = [o.clientName?.trim() || 'Cliente por confirmar', o.destination.city]
                  .filter(Boolean)
                  .join(' - ');
                const isAssignOpen = expandedOrderId === o.id;
                const vehicleWarn = isAssignOpen ? getSameVehicleConflict(o.id) : null;

                return (
                  <li
                    key={o.id}
                    className="rounded-xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm shadow-stone-200/50 dark:shadow-none overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 sm:px-5 py-4">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="font-mono text-sm sm:text-[15px] font-semibold text-stone-900 dark:text-stone-50">
                          {o.code}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{destLabel}</p>
                        <p className="text-base font-semibold text-stone-800 dark:text-stone-100 tabular-nums pt-1.5">
                          {o.bultos} bultos
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {o.driverName ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                              <UserCircle size={12} aria-hidden /> {o.driverName}
                            </span>
                          ) : null}
                          {o.peonetaName ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                              {o.peonetaName}
                            </span>
                          ) : null}
                          {o.vehiclePlate?.trim() ? (
                            <span
                              translate="no"
                              className="inline-flex items-center gap-1 rounded-lg bg-stone-100 dark:bg-stone-800 px-2.5 py-1 text-xs font-mono font-medium text-stone-700 dark:text-stone-200"
                            >
                              <Truck size={12} aria-hidden /> {o.vehiclePlate.trim()}
                            </span>
                          ) : null}
                          {orderAssignSaved === o.id ? (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Guardado</span>
                          ) : null}
                        </div>
                      </div>

                      {canManage ? (
                        <div className="flex flex-row flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 sm:pl-2">
                          <OrderCardAction
                            icon={<UserCircle size={16} />}
                            label="Asignar"
                            active={isAssignOpen}
                            onClick={() =>
                              isAssignOpen ? handleCancelOrderAssign() : handleOpenOrderAssign(o)
                            }
                            disabled={busyId !== null && busyId !== o.id}
                          />
                          <OrderCardAction
                            icon={<Pencil size={16} />}
                            label="Editar"
                            onClick={() => setDetailOrder(o)}
                            disabled={busyId !== null}
                          />
                          <OrderCardAction
                            icon={<Trash2 size={16} />}
                            label="Quitar"
                            tone="danger"
                            loading={busyId === o.id}
                            onClick={() => void handleRemove(o.id)}
                            disabled={busyId !== null && busyId !== o.id}
                          />
                        </div>
                      ) : (
                        <Button type="button" variant="secondary" size="sm" onClick={() => setDetailOrder(o)}>
                          Ver detalle
                        </Button>
                      )}
                    </div>

                    {isAssignOpen ? (
                      <div className="border-t border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/50 px-4 sm:px-5 py-4 space-y-3">
                        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                          Asignación del pedido
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Select
                            id={`order-driver-${o.id}`}
                            label="Chofer"
                            value={orderDraftDriver}
                            onChange={(e) => setOrderDraftDriver(e.target.value)}
                            options={driverSelectOpts}
                            disabled={orderAssignBusy !== null}
                            autoComplete="off"
                          />
                          <Select
                            id={`order-peoneta-${o.id}`}
                            label="Peoneta"
                            value={orderDraftPeoneta}
                            onChange={(e) => setOrderDraftPeoneta(e.target.value)}
                            options={peonetaSelectOpts}
                            disabled={orderAssignBusy !== null}
                            autoComplete="off"
                          />
                          <Select
                            id={`order-vehicle-${o.id}`}
                            label="Vehículo"
                            value={orderDraftVehicle}
                            onChange={(e) => setOrderDraftVehicle(e.target.value)}
                            options={vehicleSelectOpts}
                            disabled={orderAssignBusy !== null}
                            autoComplete="off"
                          />
                        </div>
                        {vehicleWarn ? (
                          <p
                            role="status"
                            className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3"
                          >
                            {orderApplyToAll
                              ? `Al guardar, el mismo vehículo (${vehicleWarn.plate}) quedará en todos los pedidos. Te pediremos confirmación.`
                              : `Este vehículo (${vehicleWarn.plate}) ya está en ${vehicleWarn.otherCodes.join(', ')}. Te pediremos confirmación al guardar.`}
                          </p>
                        ) : null}
                        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-stone-600 dark:text-stone-300">
                          <input
                            type="checkbox"
                            checked={orderApplyToAll}
                            onChange={(e) => setOrderApplyToAll(e.target.checked)}
                            disabled={orderAssignBusy !== null}
                            className="h-4 w-4 rounded border-stone-300 dark:border-stone-600 accent-violet-600"
                          />
                          Aplicar a todos los pedidos de esta ruta
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            loading={orderAssignBusy === o.id}
                            disabled={orderAssignBusy !== null}
                            onClick={() => void handleSaveOrderAssignment(o.id)}
                          >
                            Guardar asignación
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={orderAssignBusy !== null}
                            onClick={handleCancelOrderAssign}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {canManage ? (
            <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Nuevo pedido</h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                    Se crea ya vinculado a esta ruta.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={showCreateForm ? <ChevronUp size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
                  aria-expanded={showCreateForm}
                  onClick={() => setShowCreateForm((v) => !v)}
                  disabled={busyId !== null}
                >
                  {showCreateForm ? 'Ocultar' : 'Agregar pedido'}
                </Button>
              </div>
              {showCreateForm ? (
                <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-900/40 p-5 sm:p-6">
                  <OrderForm
                    key={createFormKey}
                    submitLabel="Crear pedido en la ruta"
                    onSubmit={(d) => void handleCreateOrder(d)}
                    onCancel={() => setShowCreateForm(false)}
                    lockedClientId={route.clientId ?? undefined}
                  />
                </div>
              ) : null}

              {orphanOrders.length > 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 dark:border-stone-700 p-5 space-y-3">
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Vincular pedido huérfano
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <Select
                      id={`attach-orphan-route-${route.id}`}
                      label="Pedido sin ruta"
                      value={pickOrderId}
                      onChange={(e) => setPickOrderId(e.target.value)}
                      options={orphanOptions}
                      containerClassName="flex-1 w-full min-w-0"
                    />
                    <Button
                      type="button"
                      onClick={() => void handleAttachOrphan()}
                      disabled={!pickOrderId || busyId !== null}
                      loading={busyId === 'add'}
                    >
                      Vincular
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-4">
              Solo administradores u operadores pueden gestionar pedidos en esta ruta.
            </p>
          )}
        </div>
      </Modal>
      {detailOrder ? (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          routeLabel={`${route.code} · ${route.name}`}
        />
      ) : null}

      <ConfirmModal
        open={sameVehicleConfirm !== null}
        onClose={() => setSameVehicleConfirm(null)}
        onConfirm={() => {
          const id = sameVehicleConfirm?.orderId;
          setSameVehicleConfirm(null);
          if (id) void performSaveOrderAssignment(id);
        }}
        title="Mismo vehículo en varios pedidos"
        message={
          sameVehicleConfirm
            ? orderApplyToAll
              ? `¿Estás seguro de asignar el mismo vehículo (${sameVehicleConfirm.plate}) a los ${sameVehicleConfirm.otherCodes.length} pedidos de esta ruta?`
              : `¿Estás seguro de asignar el mismo vehículo (${sameVehicleConfirm.plate})? Ya está en el pedido ${sameVehicleConfirm.otherCodes.join(', ')}.`
            : ''
        }
        confirmLabel="Sí, asignar igual"
        variant="warning"
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function RoutesPage() {
  const { routes, loading: routesLoading, addRoute, fetchRoutes } = useRouteStore();
  const { orders, fetchOrders } = useOrderStore();

  useEffect(() => {
    void fetchRoutes();
    void fetchOrders();
  }, [fetchRoutes, fetchOrders]);

  const routeAggById = useMemo(() => {
    const map = new Map<string, { pedidos: number; bultos: number; vehiclesLabel: string }>();
    for (const r of routes) {
      const pedidosEnRuta = orders.filter((o) => o.routeId === r.id);
      map.set(r.id, {
        pedidos: pedidosEnRuta.length,
        bultos: pedidosEnRuta.reduce((s, o) => s + (Number(o.bultos) || 0), 0),
        vehiclesLabel: summarizeRouteVehicles(pedidosEnRuta, r.vehiclePlate),
      });
    }
    return map;
  }, [routes, orders]);

  const [sortCol, setSortCol] = useState<RouteSortKey | null>('code');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [filterRouteStatus, setFilterRouteStatus] = useState<RouteStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewRoute, setShowNewRoute] = useState(false);
  const [newRouteError, setNewRouteError] = useState<string | null>(null);
  const [routePedidosDetail, setRoutePedidosDetail] = useState<Route | null>(null);

  useEffect(() => {
    setRoutePedidosDetail((prev) => {
      if (!prev) return null;
      const fresh = routes.find((r) => r.id === prev.id);
      return fresh ?? prev;
    });
  }, [routes]);

  const routeDateKey = (r: Route) =>
    typeof r.startTime === 'string' && r.startTime.includes('T') ? r.startTime : r.createdAt;

  const handleSort = (col: RouteSortKey) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
      if (sortDir === 'desc') setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const filteredRoutes = useMemo(() => {
    let data = routes.filter((r) => {
      if (filterRouteStatus !== 'all' && r.status !== filterRouteStatus) return false;
      if (search) {
        const t = search.toLowerCase();
        return (
          r.code.toLowerCase().includes(t) ||
          r.name.toLowerCase().includes(t) ||
          (r.driverName?.toLowerCase().includes(t) ?? false) ||
          (r.vehiclePlate?.toLowerCase().includes(t) ?? false)
        );
      }
      return true;
    });

    if (sortCol && sortDir) {
      data = data.toSorted((a, b) => {
        const aggA = routeAggById.get(a.id) ?? { pedidos: 0, bultos: 0, vehiclesLabel: '' };
        const aggB = routeAggById.get(b.id) ?? { pedidos: 0, bultos: 0, vehiclesLabel: '' };
        let av: string | number = '';
        let bv: string | number = '';
        switch (sortCol) {
          case 'code':
            av = a.code;
            bv = b.code;
            break;
          case 'name':
            av = a.name;
            bv = b.name;
            break;
          case 'status':
            av = a.status;
            bv = b.status;
            break;
          case 'pedidos':
            av = aggA.pedidos;
            bv = aggB.pedidos;
            break;
          case 'bultos':
            av = aggA.bultos;
            bv = aggB.bultos;
            break;
          case 'fecha':
            av = routeDateKey(a);
            bv = routeDateKey(b);
            break;
          case 'driverName':
            av = a.driverName ?? '';
            bv = b.driverName ?? '';
            break;
          case 'vehiclePlate':
            av = aggA.vehiclesLabel;
            bv = aggB.vehiclesLabel;
            break;
        }
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv), 'es', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [routes, filterRouteStatus, search, sortCol, sortDir, routeAggById]);

  const statusCounts = useMemo(
    () => Object.fromEntries(ROUTE_STATUSES.map((s) => [s, routes.filter((r) => r.status === s).length])),
    [routes],
  );

  const hasActiveFilters = filterRouteStatus !== 'all';

  const handleAddRoute = async (data: RouteFormData) => {
    setNewRouteError(null);
    try {
      await addRoute({
        name: data.name,
        ...(data.code ? { code: data.code } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
        ...(data.clientId ? { clientId: data.clientId } : {}),
      });
      await fetchRoutes();
      setShowNewRoute(false);
    } catch (e) {
      if (e instanceof ApiError) {
        try {
          const j = JSON.parse(e.body) as { message?: string | string[] };
          const m = j.message;
          setNewRouteError(Array.isArray(m) ? m.join('. ') : m || `Error ${e.status}`);
        } catch {
          setNewRouteError(e.body || `Error ${e.status}`);
        }
      } else {
        setNewRouteError('No se pudo crear la ruta');
      }
    }
  };

  const colProps = { sortCol, sortDir, onSort: handleSort };
  const totalBultos = filteredRoutes.reduce(
    (s, r) => s + (routeAggById.get(r.id)?.bultos ?? 0),
    0,
  );

  return (
    <div className="space-y-4 -mt-1">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" aria-hidden />
          <input
            type="search"
            name="route-search"
            placeholder="Buscar folio, nombre, chofer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          icon={<SlidersHorizontal size={14} />}
          aria-expanded={showFilters}
          className={clsx(hasActiveFilters && 'border-primary-300 dark:border-primary-700')}
        >
          Filtros
          {hasActiveFilters ? (
            <span className="ml-1 size-1.5 rounded-full bg-primary-500" aria-hidden />
          ) : null}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={() => {
            void fetchRoutes();
            void fetchOrders();
          }}
        >
          Actualizar
        </Button>

        <Button variant="secondary" size="sm" icon={<Download size={14} />}>
          Exportar
        </Button>

        <div className="flex-1" />

        <Button size="sm" onClick={() => setShowNewRoute(true)} icon={<Plus size={14} />}>
          Nueva ruta
        </Button>
      </div>

      {showFilters ? (
        <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-sm space-y-3">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Estado de la ruta</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterRouteStatus('all')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                filterRouteStatus === 'all'
                  ? 'bg-primary-50 dark:bg-primary-950/45 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800'
                  : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-300',
              )}
            >
              Todos
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200/80 dark:bg-stone-700 tabular-nums">
                {routes.length}
              </span>
            </button>
            {ROUTE_STATUSES.map((s) => {
              const active = filterRouteStatus === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterRouteStatus(active ? 'all' : s)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                    active
                      ? 'bg-primary-50 dark:bg-primary-950/45 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800'
                      : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-300',
                  )}
                >
                  <span className={clsx('size-1.5 rounded-full', routeStatusDot[s])} aria-hidden />
                  {routeStatusLabel(s)}
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200/80 dark:bg-stone-700 tabular-nums">
                    {statusCounts[s] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterRouteStatus('all');
                setShowFilters(false);
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      ) : null}

      {routesLoading && routes.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400 py-8 text-center">Cargando rutas…</p>
      ) : filteredRoutes.length === 0 ? (
        <EmptyState
          icon={<RouteIcon size={32} />}
          title={routes.length === 0 ? 'Sin rutas' : 'Sin resultados'}
          description={
            routes.length === 0
              ? 'Crea tu primera ruta con «Nueva ruta» y asigna pedidos desde la columna Pedidos.'
              : 'No hay rutas que coincidan con la búsqueda o los filtros.'
          }
        />
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[880px]">
              <thead className="bg-stone-50 dark:bg-stone-800/90">
                <tr>
                  <RouteColHeader label="Folio" col="code" {...colProps} className="min-w-[100px]" />
                  <RouteColHeader label="Itinerario" col="name" {...colProps} className="min-w-[160px]" />
                  <RouteColHeader label="Fecha" col="fecha" {...colProps} className="min-w-[110px]" />
                  <RouteColHeader label="Pedidos" col="pedidos" {...colProps} className="w-20 text-center" />
                  <RouteColHeader label="Bultos" col="bultos" {...colProps} className="w-20 text-center" />
                  <RouteColHeader label="Estado" col="status" {...colProps} className="min-w-[120px]" />
                  <RouteColHeader label="Chofer" col="driverName" {...colProps} className="min-w-[130px]" />
                  <RouteColHeader label="Vehículo" col="vehiclePlate" {...colProps} className="min-w-[90px]" />
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide border-b border-stone-200 dark:border-stone-700 w-28">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((r, idx) => {
                  const agg = routeAggById.get(r.id) ?? { pedidos: 0, bultos: 0, vehiclesLabel: '' };
                  return (
                    <tr
                      key={r.id}
                      className={clsx(
                        'border-b border-stone-100 dark:border-stone-800 transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-950/20',
                        idx % 2 === 0 ? 'bg-white dark:bg-stone-900' : 'bg-stone-50/50 dark:bg-stone-900/70',
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <span translate="no" className="font-mono text-xs font-semibold text-stone-800 dark:text-stone-100">
                          {r.code}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 max-w-[200px]">
                        <span className="text-xs font-medium text-stone-800 dark:text-stone-100 truncate block">{r.name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap tabular-nums">
                        {formatRouteDay(routeDateKey(r))}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs font-semibold text-stone-700 dark:text-stone-200 tabular-nums">
                        {agg.pedidos}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs font-semibold text-stone-700 dark:text-stone-200 tabular-nums">
                        {agg.bultos}
                      </td>
                      <td className="px-3 py-2.5">
                        <RouteStatusBadge status={r.status} />
                      </td>
                      <td className="px-3 py-2.5">
                        {r.driverName ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div
                              aria-hidden
                              className="size-5 bg-primary-100 dark:bg-primary-900/80 rounded-full flex items-center justify-center text-[10px] font-semibold text-primary-700 dark:text-primary-300 shrink-0"
                            >
                              {r.driverName.charAt(0)}
                            </div>
                            <span className="text-xs text-stone-700 dark:text-stone-200 truncate">{r.driverName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-300 dark:text-stone-600">–</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {agg.vehiclesLabel ? (
                          <span
                            translate="no"
                            className="font-mono text-xs font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded"
                          >
                            {agg.vehiclesLabel}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-300 dark:text-stone-600">–</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          icon={<Package size={14} />}
                          onClick={() => setRoutePedidosDetail(r)}
                        >
                          Pedidos
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80 text-xs text-stone-400 dark:text-stone-500">
            <span>
              Mostrando <strong className="text-stone-600 dark:text-stone-300 tabular-nums">{filteredRoutes.length}</strong> de{' '}
              <strong className="text-stone-600 dark:text-stone-300 tabular-nums">{routes.length}</strong> rutas
            </span>
            <span className="tabular-nums">
              Total bultos: <strong className="text-stone-700 dark:text-stone-200">{totalBultos}</strong>
            </span>
          </div>
        </div>
      )}

      {routePedidosDetail ? (
        <RoutePedidosModal route={routePedidosDetail} onClose={() => setRoutePedidosDetail(null)} />
      ) : null}

      <Modal
        open={showNewRoute}
        onClose={() => {
          setNewRouteError(null);
          setShowNewRoute(false);
        }}
        title="Crear nueva ruta"
        size="md"
      >
        <RouteForm
          onSubmit={handleAddRoute}
          onCancel={() => {
            setNewRouteError(null);
            setShowNewRoute(false);
          }}
          submitLabel="Crear ruta"
          error={newRouteError}
        />
      </Modal>
    </div>
  );
}
