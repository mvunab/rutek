import { useEffect, useState, useMemo, type ReactNode } from 'react';
import {
  Plus, Search, ChevronUp, ChevronDown,
  Download, RefreshCw, SlidersHorizontal, Package, UserCircle, Route as RouteIcon, Truck,
  Pencil, Trash2, X, Copy, MapPin, Box, ArrowLeft, Check,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RouteStatusBadge } from '../../components/ui/Badge';
import { ConfirmModal, Modal, TypeToConfirmModal } from '../../components/ui/Modal';
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

const containerCard = clsx(
  'rounded-xl border shadow-sm',
  'bg-white border-stone-200 text-stone-900 shadow-stone-200/50',
  'dark:bg-[#161616] dark:border-stone-800/80 dark:text-stone-100 dark:shadow-md dark:shadow-black/15',
);

function RouteModalStat({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium text-stone-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="text-xs font-semibold text-stone-800 dark:text-stone-100 tabular-nums leading-snug">
        {children}
      </div>
    </div>
  );
}

function RoutePriorityChip({ status }: { status: RouteStatus }) {
  const styles: Record<RouteStatus, string> = {
    not_started:
      'border-stone-300 text-stone-600 bg-stone-100 dark:border-stone-600 dark:text-stone-400 dark:bg-stone-800/50',
    in_progress:
      'border-amber-300 text-amber-800 bg-amber-50 dark:border-amber-500/50 dark:text-amber-400 dark:bg-amber-950/30',
    completed:
      'border-emerald-300 text-emerald-800 bg-emerald-50 dark:border-emerald-500/50 dark:text-emerald-400 dark:bg-emerald-950/30',
    cancelled:
      'border-red-300 text-red-800 bg-red-50 dark:border-red-500/50 dark:text-red-400 dark:bg-red-950/30',
  };
  return (
    <span
      className={clsx(
        'shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide',
        styles[status],
      )}
    >
      {routeStatusLabel(status)}
    </span>
  );
}

function RouteListItem({
  route,
  agg,
  fecha,
  selected,
  onSelect,
}: {
  route: Route;
  agg: { pedidos: number; bultos: number; vehiclesLabel: string };
  fecha: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'w-full text-left rounded-xl border px-4 py-3.5 transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950',
        selected
          ? 'bg-white dark:bg-stone-900 border-violet-400 dark:border-violet-600 ring-2 ring-violet-400/30 dark:ring-violet-500/40 shadow-md'
          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-sm',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            'size-11 shrink-0 rounded-xl flex items-center justify-center',
            selected ? 'bg-violet-100 dark:bg-violet-950/60' : 'bg-stone-100 dark:bg-stone-800',
          )}
          aria-hidden
        >
          <RouteIcon
            size={20}
            className={selected ? 'text-violet-600 dark:text-violet-400' : 'text-stone-500 dark:text-stone-400'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span translate="no" className="font-mono text-sm font-bold text-stone-900 dark:text-stone-50">
              {route.code}
            </span>
            <RouteStatusBadge status={route.status} />
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-300 truncate mt-0.5">{route.name}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-stone-400 dark:text-stone-500 tabular-nums">
            <span>{fecha}</span>
            <span>{agg.pedidos} pedidos</span>
            <span>{agg.bultos} bultos</span>
            {agg.vehiclesLabel ? (
              <span translate="no" className="font-mono">
                {agg.vehiclesLabel}
              </span>
            ) : null}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={clsx(
            'shrink-0 text-stone-300 dark:text-stone-600 transition-transform',
            selected && 'rotate-180 text-violet-500',
          )}
          aria-hidden
        />
      </div>
    </button>
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
        'inline-flex items-center justify-center gap-1 min-w-[4.25rem] rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors',
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

type SortDir = 'asc' | 'desc' | null;
type RouteSortKey = 'code' | 'name' | 'status' | 'pedidos' | 'bultos' | 'fecha' | 'driverName' | 'vehiclePlate';

const ROUTE_STATUSES: RouteStatus[] = ['not_started', 'in_progress', 'completed', 'cancelled'];

const routeStatusDot: Record<RouteStatus, string> = {
  not_started: 'bg-stone-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};

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


function RouteDetailPlaceholder() {
  return (
    <div className="flex flex-1 min-h-0 flex-col items-center justify-center px-4 py-6 text-center">
      <RouteIcon size={32} className="text-stone-300 dark:text-stone-600 mb-2" aria-hidden />
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Selecciona una ruta</p>
      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 max-w-[200px] text-pretty">
        El detalle y los pedidos aparecerán aquí.
      </p>
    </div>
  );
}

/** Panel lateral: detalle de ruta y gestión de pedidos (estilo container). */
function RouteDetailSidePanel({ route, onClose }: { route: Route; onClose: () => void }) {
  const { user } = useAuthStore();
  const canManage = user?.role === 'admin' || user?.role === 'operator';
  const { orders, assignToRoute, detachOrderFromRoute, fetchOrders, addOrder, updateOrder } = useOrderStore();
  const { fetchRoutes, addOrderToRoute, assignDriverToOrders, deleteRoute } = useRouteStore();
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
    const clientId = data.clientId?.trim();
    if (!clientId) {
      setActionError('Selecciona un cliente para el pedido.');
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    const clientName =
      client?.companyName?.trim() ||
      assigned.find((o) => o.clientId === clientId)?.clientName?.trim() ||
      '';
    if (!clientName) {
      setActionError(
        'No se pudo resolver el nombre del cliente. Recarga la página o verifica que el cliente exista.',
      );
      return;
    }
    setActionError(null);
    setBusyId('create');
    try {
      const created = await addOrder({
        clientId,
        clientName,
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
      if (!created) {
        setActionError('No se pudo crear el pedido. Revisa la conexión con el servidor.');
        return;
      }
      addOrderToRoute(route.id, created.id);
      setShowCreateForm(false);
      setCreateFormKey((k) => k + 1);
      await fetchOrders();
      await fetchRoutes();
    } catch (err) {
      let msg = 'No se pudo crear el pedido en esta ruta.';
      if (err instanceof ApiError) {
        try {
          const parsed = JSON.parse(err.body) as { message?: string | string[] };
          const apiMsg = parsed.message;
          if (typeof apiMsg === 'string' && apiMsg.length > 0) msg = apiMsg;
          else if (Array.isArray(apiMsg) && apiMsg.length > 0) msg = apiMsg.join(' · ');
        } catch {
          if (err.body) msg = err.body;
        }
      } else if (err instanceof Error && err.message) {
        msg = err.message;
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

  const routeClientLabel = useMemo(() => {
    if (route.clientId) {
      const c = clients.find((x) => x.id === route.clientId);
      if (c?.companyName) return c.companyName;
    }
    return assigned[0]?.clientName?.trim() || '—';
  }, [route.clientId, clients, assigned]);

  const [codeCopied, setCodeCopied] = useState(false);
  const [deleteRouteOpen, setDeleteRouteOpen] = useState(false);
  const [deleteRouteBusy, setDeleteRouteBusy] = useState(false);
  const copyRouteCode = async () => {
    try {
      await navigator.clipboard.writeText(route.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleConfirmDeleteRoute = async () => {
    setDeleteRouteBusy(true);
    setActionError(null);
    try {
      await deleteRoute(route.id);
      await fetchOrders();
      await fetchRoutes();
      setDeleteRouteOpen(false);
      onClose();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : 'No se pudo eliminar la ruta.',
      );
      setDeleteRouteOpen(false);
    } finally {
      setDeleteRouteBusy(false);
    }
  };

  return (
    <>
      <div
        className="flex flex-col h-full min-h-0 w-full overflow-hidden bg-stone-50 dark:bg-[#0d0d0d]"
        role="complementary"
        aria-label={`Detalle de ruta ${route.code}`}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-[#111] shrink-0 shadow-sm dark:shadow-none">
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 -ml-1 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label="Volver al listado"
          >
            <ArrowLeft size={20} aria-hidden />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Package size={16} className="text-violet-500 shrink-0" aria-hidden />
            <span className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">
              Detalle de ruta
            </span>
          </div>
          {canManage ? (
            <button
              type="button"
              onClick={() => setDeleteRouteOpen(true)}
              disabled={deleteRouteBusy}
              className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
              aria-label="Eliminar ruta"
            >
              <Trash2 size={18} aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="hidden lg:flex shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            aria-label="Cerrar panel"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Todo el detalle en un solo scroll (resumen + pedidos + formularios) */}
        <div
          className="route-panel-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y px-3 pb-3 pt-2 space-y-2.5"
          aria-label="Detalle y pedidos de la ruta"
        >
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
                        {route.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyRouteCode()}
                        className="p-0.5 rounded text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        aria-label={codeCopied ? 'Código copiado' : 'Copiar código de ruta'}
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
              <RouteModalStat label="Cliente">{routeClientLabel}</RouteModalStat>
              <RouteModalStat label="Fecha">{formatRouteDayElegant(fechaSrc)}</RouteModalStat>
              <RouteModalStat label="Chofer">{route.driverName?.trim() || '—'}</RouteModalStat>
              <RouteModalStat label="Vehículos">
                {summarizeRouteVehicles(assigned, route.vehiclePlate) || '—'}
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
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {deliveredCount}/{assigned.length}
                </span>
              </span>
            </p>

            {route.notes?.trim() ? (
              <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-2 flex gap-1.5 dark:bg-amber-950/40 dark:border-amber-800/50">
                <MapPin size={12} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" aria-hidden />
                <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 leading-snug line-clamp-3">
                  {route.notes.trim()}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2 px-0.5 sticky top-0 z-[1] py-1 -mx-0.5 bg-stone-50/95 dark:bg-[#0d0d0d]/95 backdrop-blur-sm border-b border-transparent dark:border-transparent">
            <h3 className="text-[10px] font-semibold text-stone-500 dark:text-stone-500 uppercase tracking-wider">
              Pedidos en ruta
            </h3>
          </div>

          {actionError ? (
            <p
              className="text-xs text-red-800 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-3 py-2"
              role="alert"
            >
              {actionError}
            </p>
          ) : null}
          {assigned.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 dark:border-stone-700 dark:bg-stone-900/30 py-8 text-center">
              <Package size={24} className="mx-auto text-stone-400 dark:text-stone-600 mb-1.5" aria-hidden />
              <p className="text-xs text-stone-500">Ningún pedido en esta ruta aún.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {assigned.map((o) => {
                const destLabel = [o.clientName?.trim() || 'Cliente por confirmar', o.destination.city]
                  .filter(Boolean)
                  .join(' · ');
                const isAssignOpen = expandedOrderId === o.id;
                const vehicleWarn = isAssignOpen ? getSameVehicleConflict(o.id) : null;

                return (
                  <li
                    key={o.id}
                    className={clsx(containerCard, 'overflow-hidden')}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5">
                      <div className="size-8 shrink-0 rounded-md bg-stone-100 border border-stone-200 dark:bg-stone-800 dark:border-stone-700 flex items-center justify-center" aria-hidden>
                        <Package size={14} className="text-stone-500 dark:text-stone-500" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p translate="no" className="font-mono text-sm font-bold text-stone-900 dark:text-white">
                          {o.code}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-500 truncate flex items-center gap-1">
                          <MapPin size={10} className="shrink-0" aria-hidden />
                          {destLabel}
                        </p>
                        <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 tabular-nums pt-0.5">
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
                      <div className="border-t border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950/60 px-3 py-3 space-y-3">
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
            <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-stone-800 dark:text-stone-200">Nuevo pedido</h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">Vinculado a esta ruta.</p>
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
                <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900/50 dark:shadow-none">
                  <OrderForm
                    key={createFormKey}
                    submitLabel="Crear pedido en la ruta"
                    onSubmit={(d) => void handleCreateOrder(d)}
                    onCancel={() => setShowCreateForm(false)}
                    lockedClientId={route.clientId?.trim() || undefined}
                    lockedClientName={
                      routeClientLabel !== '—' ? routeClientLabel : undefined
                    }
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
            <p className="text-xs text-stone-500 text-center py-4">
              Solo administradores u operadores pueden gestionar pedidos en esta ruta.
            </p>
          )}
        </div>
      </div>
      {detailOrder ? (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          routeLabel={`${route.code} · ${route.name}`}
        />
      ) : null}

      <TypeToConfirmModal
        open={deleteRouteOpen}
        onClose={() => setDeleteRouteOpen(false)}
        onConfirm={handleConfirmDeleteRoute}
        title="Eliminar ruta"
        loading={deleteRouteBusy}
        confirmLabel="Eliminar ruta"
        message={
          <>
            <p>
              Se eliminará la ruta <strong translate="no">{route.code}</strong>
              {route.name ? (
                <>
                  {' '}
                  (<span translate="no">{route.name}</span>)
                </>
              ) : null}
              {' '}
              y todos sus pedidos asociados.
            </p>
            <p className="mt-2">
              {assigned.length === 0
                ? 'No hay pedidos en esta ruta.'
                : `${assigned.length} pedido${assigned.length === 1 ? '' : 's'} serán eliminados permanentemente.`}
            </p>
          </>
        }
      />

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
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  useEffect(() => {
    setSelectedRoute((prev) => {
      if (!prev) return null;
      const fresh = routes.find((r) => r.id === prev.id);
      return fresh ?? prev;
    });
  }, [routes]);

  const routeDateKey = (r: Route) =>
    typeof r.startTime === 'string' && r.startTime.includes('T') ? r.startTime : r.createdAt;

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

  const totalBultos = filteredRoutes.reduce(
    (s, r) => s + (routeAggById.get(r.id)?.bultos ?? 0),
    0,
  );

  const panelOpen = selectedRoute !== null;

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden -mx-6 -mb-6 -mt-1">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap px-6 pt-1 pb-3 shrink-0 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/80 dark:bg-stone-950/80">
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
        <div className="mx-6 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-sm space-y-3 shrink-0">
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

      <div className="flex flex-1 min-h-0 min-w-0 relative overflow-hidden">
        {/* Listado centrado */}
        <div
          className={clsx(
            'flex flex-col min-w-0 flex-1 transition-opacity',
            panelOpen && 'max-lg:hidden',
          )}
        >
          <div className="route-list-scroll flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y px-4 sm:px-6 lg:px-8 py-4">
            {routesLoading && routes.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400 py-12 text-center">Cargando rutas…</p>
            ) : filteredRoutes.length === 0 ? (
              <div className="max-w-lg mx-auto">
                <EmptyState
                  icon={<RouteIcon size={32} />}
                  title={routes.length === 0 ? 'Sin rutas' : 'Sin resultados'}
                  description={
                    routes.length === 0
                      ? 'Crea tu primera ruta con «Nueva ruta» y selecciónala para gestionar pedidos.'
                      : 'No hay rutas que coincidan con la búsqueda o los filtros.'
                  }
                />
              </div>
            ) : (
              <div className="max-w-lg mx-auto w-full space-y-4">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    <span className="font-semibold text-stone-700 dark:text-stone-200 tabular-nums">
                      {filteredRoutes.length}
                    </span>{' '}
                    de{' '}
                    <span className="tabular-nums">{routes.length}</span> rutas ·{' '}
                    <span className="tabular-nums">{totalBultos}</span> bultos
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wide hidden sm:inline">
                      Ordenar
                    </span>
                    <select
                      value={sortCol ?? ''}
                      onChange={(e) => {
                        const v = e.target.value as RouteSortKey | '';
                        if (!v) {
                          setSortCol(null);
                          setSortDir(null);
                        } else {
                          setSortCol(v);
                          setSortDir('desc');
                        }
                      }}
                      className="text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-2 py-1 text-stone-700 dark:text-stone-200"
                      aria-label="Ordenar rutas"
                    >
                      <option value="code">Folio</option>
                      <option value="fecha">Fecha</option>
                      <option value="pedidos">Pedidos</option>
                      <option value="status">Estado</option>
                    </select>
                  </div>
                </div>
                <ul className="space-y-2" role="list">
                  {filteredRoutes.map((r) => {
                    const agg = routeAggById.get(r.id) ?? { pedidos: 0, bultos: 0, vehiclesLabel: '' };
                    return (
                      <li key={r.id}>
                        <RouteListItem
                          route={r}
                          agg={agg}
                          fecha={formatRouteDay(routeDateKey(r))}
                          selected={selectedRoute?.id === r.id}
                          onSelect={() => setSelectedRoute(r)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: misma caja en vacío o con detalle; scroll solo dentro del panel */}
        <div
          className={clsx(
            'flex flex-col min-h-0 max-h-full shrink-0 overflow-hidden',
            selectedRoute
              ? [
                  'w-full max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:h-dvh max-lg:max-h-dvh',
                  'lg:w-[min(100%,24rem)] xl:w-[26rem] lg:h-full lg:relative',
                  'lg:border-l lg:border-stone-200/90 dark:lg:border-stone-800',
                ]
              : [
                  'hidden lg:flex lg:h-full',
                  'lg:w-[min(100%,24rem)] xl:w-[26rem]',
                  'lg:border-l lg:border-dashed lg:border-stone-200 dark:lg:border-stone-800',
                  'lg:bg-stone-100/80 lg:border-stone-200 dark:lg:bg-stone-900/30 dark:lg:border-stone-800',
                ],
          )}
        >
          {selectedRoute ? (
            <RouteDetailSidePanel
              route={selectedRoute}
              onClose={() => setSelectedRoute(null)}
            />
          ) : (
            <RouteDetailPlaceholder />
          )}
        </div>
      </div>

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
