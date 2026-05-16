import { useEffect, useState, useMemo } from 'react';
import {
  Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown,
  CheckCircle2, Circle, Truck, Clock, RotateCcw, XCircle,
  Download, RefreshCw, SlidersHorizontal, Edit2, Eye, Package, Map as MapIcon, UserCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RouteStatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRouteStore } from '../../store/useRouteStore';
import { useDeliveryStore } from '../../store/useDeliveryStore';
import type { DeliveryRecord, DeliveryStatus, Route, Order } from '../../types';
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
const statusConfig: Record<DeliveryStatus, {
  label: string;
  bg: string;
  text: string;
  dot: string;
  icon: React.ReactNode;
}> = {
  entregado:    { label: 'Entregado',    bg: 'bg-emerald-100 dark:bg-emerald-950/55', text: 'text-emerald-800 dark:text-emerald-200', dot: 'bg-emerald-500', icon: <CheckCircle2 size={12} /> },
  en_ruta:      { label: 'En Ruta',      bg: 'bg-blue-100 dark:bg-blue-950/55',       text: 'text-blue-800 dark:text-blue-200',       dot: 'bg-blue-500',    icon: <Truck size={12} /> },
  pendiente:    { label: 'Pendiente',    bg: 'bg-stone-100 dark:bg-stone-800',        text: 'text-stone-600 dark:text-stone-300',     dot: 'bg-stone-400',   icon: <Circle size={12} /> },
  reprogramado: { label: 'Reprogramado', bg: 'bg-amber-100 dark:bg-amber-950/55',      text: 'text-amber-800 dark:text-amber-200',     dot: 'bg-amber-500',   icon: <RotateCcw size={12} /> },
  rechazado:    { label: 'Rechazado',    bg: 'bg-red-100 dark:bg-red-950/55',          text: 'text-red-800 dark:text-red-200',         dot: 'bg-red-500',     icon: <XCircle size={12} /> },
  parcial:      { label: 'Parcial',      bg: 'bg-violet-100 dark:bg-violet-950/55',     text: 'text-violet-800 dark:text-violet-200',   dot: 'bg-violet-500',  icon: <Clock size={12} /> },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: DeliveryStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap',
      cfg.bg, cfg.text
    )}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────
type SortDir = 'asc' | 'desc' | null;

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc')  return <ChevronUp size={12} className="text-primary-600 dark:text-primary-400" />;
  if (dir === 'desc') return <ChevronDown size={12} className="text-primary-600 dark:text-primary-400" />;
  return <ChevronsUpDown size={12} className="text-stone-300 dark:text-stone-600 group-hover:text-stone-400 dark:group-hover:text-stone-500" />;
}

// ─── Column header ────────────────────────────────────────────────────────────
function ColHeader({
  label, col, sortCol, sortDir, onSort, className,
}: {
  label: string;
  col: keyof DeliveryRecord;
  sortCol: keyof DeliveryRecord | null;
  sortDir: SortDir;
  onSort: (col: keyof DeliveryRecord) => void;
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
  const [form, setForm] = useState<RouteFormData>({
    code: '',
    name: '',
    notes: '',
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const f = (field: keyof RouteFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        code: form.code.trim(),
        name: form.name.trim(),
        notes: form.notes.trim(),
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
      <Input
        label="Código / folio interno"
        placeholder="Ej: 2028050006 (opcional; se genera si lo dejas vacío)"
        value={form.code}
        onChange={f('code')}
        name="route_code"
        autoComplete="off"
        spellCheck={false}
      />
      <Input
        label="Nombre de la ruta"
        placeholder="Ej: Santiago Norte"
        value={form.name}
        onChange={f('name')}
        name="route_name"
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

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DeliveryDetailModal({ record, onClose }: { record: DeliveryRecord; onClose: () => void }) {
  const cfg = statusConfig[record.estado];
  return (
    <Modal open onClose={onClose} title="Detalle de parada" description={`Pedido ${record.pedido}`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <StatusBadge status={record.estado} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ['Cliente',    record.cliente],
            ['Punto de entrega', record.entrega],
            ['Folio',     record.pedido],
            ['Factura',    record.factura || '–'],
            ['Tipo',       record.tipo],
            ['Referencia', record.ref],
            ['Bultos',     String(record.bultos)],
            ['RUT',        record.rut],
          ].map(([k, v]) => (
            <div key={k} className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2">
              <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide">{k}</p>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-100 mt-0.5">{v}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ['Chofer',     record.chofer || '–'],
            ['Vehículo',   record.vehiculo || '–'],
            ['Peoneta',    record.peoneta || '–'],
          ].map(([k, v]) => (
            <div key={k} className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2">
              <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide">{k}</p>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-100 mt-0.5">{v}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2">
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide">Recepción</p>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-100 mt-0.5">{record.recepcion || '–'}</p>
          </div>
          <div className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2">
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide">Fecha / Hora</p>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-100 mt-0.5">{record.fechaHora || '–'}</p>
          </div>
        </div>

        {record.obs && (
          <div className={clsx('border rounded-lg px-3 py-2', cfg.bg, 'border-stone-200 dark:border-stone-700')}>
            <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Observaciones</p>
            <p className={clsx('text-sm font-medium mt-0.5', cfg.text)}>{record.obs}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** Detalle administrativo: crear y consultar pedidos en el contexto de esta ruta. */
function RoutePedidosModal({ route, onClose }: { route: Route; onClose: () => void }) {
  const { user } = useAuthStore();
  const canManage = user?.role === 'admin' || user?.role === 'operator';
  const { orders, assignToRoute, detachOrderFromRoute, fetchOrders, addOrder } = useOrderStore();
  const { fetchRoutes, addOrderToRoute, updateRoute } = useRouteStore();
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
  const [draftDriverId, setDraftDriverId] = useState(route.driverId ?? '');
  const [draftVehicleId, setDraftVehicleId] = useState(route.vehicleId ?? '');

  useEffect(() => {
    setDraftDriverId(route.driverId ?? '');
    setDraftVehicleId(route.vehicleId ?? '');
  }, [route.id, route.driverId, route.vehicleId]);

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

  const driverSelectOpts = useMemo(
    () => [
      { value: '', label: 'Sin chofer asignado…' },
      ...driversList.map((d) => ({ value: d.id, label: d.name })),
    ],
    [driversList],
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

  const assignmentDirty =
    draftDriverId !== (route.driverId ?? '') || draftVehicleId !== (route.vehicleId ?? '');

  const canClearAssignment =
    !!(route.driverId || route.vehicleId || draftDriverId || draftVehicleId);

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
    } catch {
      setActionError('No se pudo crear el pedido en esta ruta.');
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

  const handleSaveAssignment = async () => {
    setActionError(null);
    setBusyId('assign');
    try {
      const d = draftDriverId ? driversList.find((u) => u.id === draftDriverId) : undefined;
      const v = draftVehicleId ? vehiclesSorted.find((x) => x.id === draftVehicleId) : undefined;
      await updateRoute(route.id, {
        driverId: d ? d.id : null,
        driverName: d ? d.name : null,
        vehicleId: v ? v.id : null,
        vehiclePlate: v ? v.plate : null,
      });
      await fetchRoutes();
    } catch {
      setActionError('No se pudo guardar chofer o vehículo de la ruta.');
    } finally {
      setBusyId(null);
    }
  };

  const handleClearAssignment = async () => {
    setActionError(null);
    setBusyId('assign');
    try {
      await updateRoute(route.id, {
        driverId: null,
        driverName: null,
        vehicleId: null,
        vehiclePlate: null,
      });
      await fetchRoutes();
    } catch {
      setActionError('No se pudo quitar la asignación de la ruta.');
    } finally {
      setBusyId(null);
    }
  };

  const fechaSrc =
    typeof route.startTime === 'string' && route.startTime.includes('T')
      ? route.startTime
      : route.createdAt;

  return (
    <>
      <Modal open onClose={onClose} title={`Ruta ${route.code}`} description={route.name} size="xl">
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">Fecha</p>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{formatRouteDay(fechaSrc)}</p>
          </div>
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 tabular-nums">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">Pedidos</p>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{totals.pedidos}</p>
          </div>
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 tabular-nums">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">Bultos totales</p>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{totals.bultos}</p>
          </div>
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">Estado ruta</p>
            <RouteStatusBadge status={route.status} />
          </div>
        </div>

        {canManage ? (
          <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/45 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 items-center justify-center text-stone-400">
                <UserCircle size={18} aria-hidden />
              </span>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wide">
                  Chofer y vehículo
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Quién conduce y con qué patente cubre los pedidos de esta ruta. Se propaga a los registros de entrega ya ligados al itinerario.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
              <span>
                <span className="font-semibold text-stone-500 dark:text-stone-500">Actual: </span>
                {route.driverName?.trim() ? route.driverName.trim() : 'Sin chofer'}
              </span>
              <span className="text-stone-300 dark:text-stone-600">·</span>
              <span translate="no">
                <span className="font-semibold text-stone-500 dark:text-stone-500">Patente: </span>
                {route.vehiclePlate?.trim() ? route.vehiclePlate.trim() : 'Sin vehículo'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                id={`route-driver-${route.id}`}
                label="Chofer"
                value={draftDriverId}
                onChange={(e) => setDraftDriverId(e.target.value)}
                options={driverSelectOpts}
                disabled={busyId !== null}
                autoComplete="off"
              />
              <Select
                id={`route-vehicle-${route.id}`}
                label="Vehículo"
                value={draftVehicleId}
                onChange={(e) => setDraftVehicleId(e.target.value)}
                options={vehicleSelectOpts}
                disabled={busyId !== null}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                loading={busyId === 'assign'}
                disabled={busyId !== null || !assignmentDirty}
                onClick={() => void handleSaveAssignment()}
              >
                Guardar asignación
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busyId !== null || !canClearAssignment}
                onClick={() => void handleClearAssignment()}
              >
                Quitar asignación
              </Button>
            </div>
          </div>
        ) : (
          (route.driverName?.trim() || route.vehiclePlate?.trim()) ? (
            <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/40 px-4 py-3 text-xs text-stone-600 dark:text-stone-400">
              <p className="font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">Chofer y vehículo</p>
              <p>
                {route.driverName?.trim() || 'Sin chofer'}
                {(route.vehiclePlate?.trim()) ? (
                  <span translate="no"> · Patente {route.vehiclePlate.trim()}</span>
                ) : null}
              </p>
            </div>
          ) : null
        )}

        {actionError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">{actionError}</p>
        )}

        {assigned.length > 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400 tabular-nums" aria-live="polite">
            <span className="font-semibold text-stone-600 dark:text-stone-300">
              {assigned.filter((o) => o.status === 'delivered').length}/{assigned.length}
            </span>{' '}
            pedidos marcados como entregados · el estado de la ruta se actualiza desde el servidor
          </p>
        ) : null}

        <div>
          <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
            Pedidos en esta ruta
          </h4>
          {assigned.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 py-4 text-center border border-dashed border-stone-200 dark:border-stone-700 rounded-lg">
              Ningún pedido asignado aún.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
              {assigned.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-white dark:bg-stone-900 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono font-semibold text-stone-800 dark:text-stone-100">{o.code}</p>
                    <p className="text-stone-500 dark:text-stone-400 truncate">
                      {o.clientName?.trim() || 'Cliente por confirmar'} · {o.destination.city}
                    </p>
                  </div>
                  <span className="tabular-nums font-semibold text-stone-700 dark:text-stone-200 shrink-0">
                    {o.bultos} bultos
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      icon={<Eye size={13} />}
                      onClick={() => setDetailOrder(o)}
                      aria-label={`Ver pedido ${o.code}`}
                    />
                    {canManage ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        loading={busyId === o.id}
                        disabled={busyId !== null}
                        onClick={() => void handleRemove(o.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        Quitar
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {canManage ? (
          <div className="border-t border-stone-100 dark:border-stone-800 pt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Nuevo pedido en esta ruta
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={
                  showCreateForm ? (
                    <ChevronUp size={18} aria-hidden />
                  ) : (
                    <Plus size={18} aria-hidden strokeWidth={2.25} />
                  )
                }
                aria-expanded={showCreateForm}
                aria-label={
                  showCreateForm
                    ? 'Ocultar formulario de nuevo pedido'
                    : 'Mostrar formulario de nuevo pedido'
                }
                onClick={() => setShowCreateForm((v) => !v)}
                disabled={busyId !== null}
                className={
                  showCreateForm
                    ? '!bg-emerald-100 hover:!bg-emerald-200/90 !text-emerald-900 border border-emerald-300 shadow-sm dark:!bg-emerald-950/50 dark:hover:!bg-emerald-950/65 dark:!text-emerald-100 dark:border-emerald-800 rounded-full shrink-0 min-h-10 min-w-10 !p-0 focus-visible:!ring-emerald-500'
                    : '!bg-emerald-600 hover:!bg-emerald-700 !text-white border-0 shadow-md hover:shadow-lg rounded-full shrink-0 min-h-10 min-w-10 !p-0 focus-visible:!ring-emerald-500'
                }
              />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Los pedidos se registran ya asociados a esta ruta (<strong className="font-medium text-stone-600 dark:text-stone-300">route_id</strong> obligatorio).
            </p>
            {showCreateForm ? (
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/90 dark:bg-stone-900/50 p-4">
                <OrderForm
                  key={createFormKey}
                  submitLabel="Crear pedido en la ruta"
                  onSubmit={(d) => void handleCreateOrder(d)}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            ) : null}

            {orphanOrders.length > 0 ? (
              <div className="space-y-3 pt-3 border-t border-dashed border-stone-200 dark:border-stone-700">
                <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Pedidos sin ruta (corrección)
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Solo para datos antiguos: vincular un pedido huérfano a esta ruta.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <Select
                    id={`attach-orphan-route-${route.id}`}
                    label="Pedido huérfano"
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
                    Vincular a la ruta
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Solo administradores u operadores pueden crear pedidos o modificarlos en esta ruta.
          </p>
        )}

        <div className="flex justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
      {detailOrder ? (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          routeLabel={`${route.code} · ${route.name}`}
        />
      ) : null}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function RoutesPage() {
  const { routes, loading: routesLoading, addRoute, fetchRoutes } = useRouteStore();
  const { records, loaded: deliveriesLoaded, fetchRecords } = useDeliveryStore();
  const { orders, fetchOrders } = useOrderStore();

  useEffect(() => {
    void fetchRecords();
    void fetchRoutes();
    void fetchOrders();
  }, [fetchRecords, fetchRoutes, fetchOrders]);

  const routeAggById = useMemo(() => {
    const map = new Map<string, { pedidos: number; bultos: number }>();
    for (const r of routes) {
      const pedidosEnRuta = orders.filter((o) => o.routeId === r.id);
      map.set(r.id, {
        pedidos: pedidosEnRuta.length,
        bultos: pedidosEnRuta.reduce((s, o) => s + (Number(o.bultos) || 0), 0),
      });
    }
    return map;
  }, [routes, orders]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortCol, setSortCol] = useState<keyof DeliveryRecord | null>('estado');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<DeliveryStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [detailRecord, setDetailRecord] = useState<DeliveryRecord | null>(null);
  const [showNewRoute, setShowNewRoute] = useState(false);
  const [newRouteError, setNewRouteError] = useState<string | null>(null);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [routePedidosDetail, setRoutePedidosDetail] = useState<Route | null>(null);

  useEffect(() => {
    setRoutePedidosDetail((prev) => {
      if (!prev) return null;
      const fresh = routes.find((r) => r.id === prev.id);
      return fresh ?? prev;
    });
  }, [routes]);

  // Sort handler
  const handleSort = (col: keyof DeliveryRecord) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  // Derived data
  const filtered = useMemo(() => {
    let data = records.filter(r => {
      if (filterStatus !== 'all' && r.estado !== filterStatus) return false;
      if (search) {
        const t = search.toLowerCase();
        return (
          r.cliente.toLowerCase().includes(t) ||
          r.entrega.toLowerCase().includes(t) ||
          r.pedido.includes(t) ||
          r.factura.includes(t) ||
          r.chofer.toLowerCase().includes(t) ||
          r.vehiculo.toLowerCase().includes(t)
        );
      }
      return true;
    });

    if (sortCol && sortDir) {
      data = data.toSorted((a, b) => {
        const av = a[sortCol] ?? '';
        const bv = b[sortCol] ?? '';
        const cmp = String(av).localeCompare(String(bv), 'es', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [records, filterStatus, search, sortCol, sortDir]);

  // Selection
  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.id)));
  };
  const toggleRow = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // Stats
  const statuses: DeliveryStatus[] = ['entregado', 'en_ruta', 'pendiente', 'reprogramado', 'rechazado', 'parcial'];
  const counts = useMemo(() =>
    Object.fromEntries(statuses.map(s => [s, records.filter(r => r.estado === s).length])),
  [records]);

  const handleAddRoute = async (data: RouteFormData) => {
    setNewRouteError(null);
    try {
      await addRoute({
        name: data.name,
        ...(data.code ? { code: data.code } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
      });
      await fetchRoutes();
      setShowNewRoute(false);
    } catch (e) {
      if (e instanceof ApiError) {
        try {
          const j = JSON.parse(e.body) as { message?: string | string[] };
          const m = j.message;
          setNewRouteError(
            Array.isArray(m) ? m.join('. ') : m || `Error ${e.status}`,
          );
        } catch {
          setNewRouteError(e.body || `Error ${e.status}`);
        }
      } else {
        setNewRouteError('No se pudo crear la ruta');
      }
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    ...statuses.map(s => ({ value: s, label: statusConfig[s].label })),
  ];

  const colProps = { sortCol, sortDir, onSort: handleSort };

  return (
    <div className="space-y-4 -mt-1">
      {/* Summary counters */}
      <div className="flex items-center gap-2 flex-wrap">
        {statuses.map(s => {
          const cfg = statusConfig[s];
          const active = filterStatus === s;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(active ? 'all' : s)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                active
                  ? clsx(cfg.bg, cfg.text, 'border-transparent shadow-sm')
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-500 hover:text-stone-700 dark:hover:text-stone-200'
              )}
            >
              <span className={clsx('h-1.5 w-1.5 rounded-full', cfg.dot)} />
              {cfg.label}
              <span className={clsx(
                'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                active ? 'bg-white/60 dark:bg-black/25 dark:text-inherit' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
              )}>
                {counts[s] ?? 0}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowStatusManager(true)}
          className="inline-flex items-center justify-center size-8 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          title="Gestionar estados"
          aria-label="Gestionar estados"
        >
          <Plus size={14} />
        </button>
        <div className="flex-1" />
        <span className="text-xs text-stone-400 dark:text-stone-500">
          {selected.size > 0 && <span className="font-semibold text-stone-700 dark:text-stone-300 mr-1">{selected.size} seleccionados ·</span>}
          {filtered.length} de {records.length} registros
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
          <input
            type="text"
            placeholder="Buscar folio, cliente, chofer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          icon={<SlidersHorizontal size={14} />}
        >
          Filtros
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={() => {
            void fetchRecords();
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

      {/* Expanded filters */}
      {showFilters && (
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm">
          <Select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as DeliveryStatus | 'all')}
            options={statusOptions}
            containerClassName="w-44"
          />
          <Button variant="ghost" size="sm" onClick={() => { setFilterStatus('all'); setShowFilters(false); }}>
            Limpiar
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Rutas (itinerario de salida)</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              <strong className="font-medium text-stone-600 dark:text-stone-300">Ruta</strong> e <strong className="font-medium text-stone-600 dark:text-stone-300">itinerario</strong> son lo mismo aquí: folio interno, nombre, fecha, cuántos <strong className="font-medium text-stone-600 dark:text-stone-300">pedidos</strong> lleva y <strong className="font-medium text-stone-600 dark:text-stone-300">bultos totales</strong> (suma de los bultos de cada pedido asignado). Usá <strong className="font-medium text-stone-600 dark:text-stone-300">Pedidos</strong> en cada fila para armar la ruta. La tabla inferior es el detalle operativo por parada (recepción, fecha y hora, chofer, vehículo, observaciones).
            </p>
          </div>
        </div>
        {routesLoading && routes.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">Cargando rutas…</p>
        ) : routes.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Todavía no hay rutas en este tenant. Crea una con «Nueva ruta».
          </p>
        ) : (
          <ul
            className="divide-y divide-stone-100 dark:divide-stone-800 max-h-52 overflow-y-auto rounded-lg border border-stone-100 dark:border-stone-800"
            aria-label="Listado de rutas"
          >
            {routes.map((r) => {
              const agg = routeAggById.get(r.id) ?? { pedidos: 0, bultos: 0 };
              const fechaSrc =
                typeof r.startTime === 'string' && r.startTime.includes('T')
                  ? r.startTime
                  : r.createdAt;
              return (
                <li
                  key={r.id}
                  className="px-3 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 text-xs"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:flex-1 sm:min-w-0 sm:justify-between">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                      <span translate="no" className="font-mono font-semibold text-stone-800 dark:text-stone-100 shrink-0">
                        {r.code}
                      </span>
                      <span className="text-stone-800 dark:text-stone-100 font-medium truncate">{r.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-500 dark:text-stone-400 shrink-0 tabular-nums">
                      <span title="Fecha de registro o inicio planificado">{formatRouteDay(fechaSrc)}</span>
                      <span className="text-stone-300 dark:text-stone-600" aria-hidden>
                        ·
                      </span>
                      <span>
                        {agg.pedidos}{' '}
                        {agg.pedidos === 1 ? 'pedido' : 'pedidos'}
                      </span>
                      <span className="text-stone-300 dark:text-stone-600" aria-hidden>
                        ·
                      </span>
                      <span>
                        {agg.bultos} bultos
                      </span>
                      <RouteStatusBadge status={r.status} />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    icon={<Package size={14} />}
                    onClick={() => setRoutePedidosDetail(r)}
                    className="shrink-0 self-start sm:self-center"
                  >
                    Pedidos
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<MapIcon size={32} />}
          title={deliveriesLoaded && records.length === 0 ? 'Sin paradas en hoja de ruta' : 'Sin registros'}
          description={
            deliveriesLoaded && records.length === 0
              ? 'Aún no hay paradas registradas para rutas. Cuando existan movimientos ligados a pedidos en ruta, aparecerán aquí.'
              : 'No hay paradas que coincidan con los filtros.'
          }
        />
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[1200px]">
              <thead className="bg-stone-50 dark:bg-stone-800/90">
                <tr>
                  {/* Checkbox */}
                  <th className="w-10 px-3 py-2.5 border-b border-stone-200 dark:border-stone-700">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="size-3.5 rounded border-stone-300 dark:border-stone-600 dark:bg-stone-900 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </th>
                  <ColHeader label="Estado"     col="estado"    {...colProps} className="min-w-[120px]" />
                  <ColHeader label="Cliente"    col="cliente"   {...colProps} className="min-w-[140px]" />
                  <ColHeader label="Punto entrega" col="entrega"   {...colProps} className="min-w-[170px]" />
                  <ColHeader label="Folio"      col="pedido"    {...colProps} className="min-w-[110px]" />
                  <ColHeader label="Factura"    col="factura"   {...colProps} className="min-w-[110px]" />
                  <ColHeader label="Tipo"       col="tipo"      {...colProps} className="w-14" />
                  <ColHeader label="Ref."       col="ref"       {...colProps} className="min-w-[90px]" />
                  <ColHeader label="Bultos"     col="bultos"    {...colProps} className="w-16 text-center" />
                  <ColHeader label="Rut"        col="rut"       {...colProps} className="min-w-[110px]" />
                  <ColHeader label="Recepción"  col="recepcion" {...colProps} className="min-w-[130px]" />
                  <ColHeader label="Fecha/Hora" col="fechaHora" {...colProps} className="min-w-[120px]" />
                  <ColHeader label="Chofer"     col="chofer"    {...colProps} className="min-w-[130px]" />
                  <ColHeader label="Vehículo"   col="vehiculo"  {...colProps} className="min-w-[90px]" />
                  <ColHeader label="Peoneta"    col="peoneta"   {...colProps} className="min-w-[110px]" />
                  <ColHeader label="Obs."       col="obs"       {...colProps} className="min-w-[140px]" />
                  {/* Actions */}
                  <th className="w-16 px-3 py-2.5 border-b border-stone-200 dark:border-stone-700" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => {
                  const isSelected = selected.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={clsx(
                        'group border-b border-stone-100 dark:border-stone-800 transition-colors',
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-950/35'
                          : idx % 2 === 0
                            ? 'bg-white dark:bg-stone-900'
                            : 'bg-stone-50/50 dark:bg-stone-900/70',
                        'hover:bg-primary-50/60 dark:hover:bg-primary-950/25'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(row.id)}
                          className="size-3.5 rounded border-stone-300 dark:border-stone-600 dark:bg-stone-900 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>

                      {/* Estado */}
                      <td className="px-3 py-2.5">
                        <StatusBadge status={row.estado} />
                      </td>

                      {/* Cliente */}
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">{row.cliente}</span>
                      </td>

                      {/* Entrega */}
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-stone-600 dark:text-stone-300">{row.entrega}</span>
                      </td>

                      {/* Pedido */}
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-xs text-stone-700 dark:text-stone-200">{row.pedido}</span>
                      </td>

                      {/* Factura */}
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-xs text-stone-500 dark:text-stone-400">{row.factura || '–'}</span>
                      </td>

                      {/* Tipo */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">{row.tipo}</span>
                      </td>

                      {/* Ref */}
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-xs text-stone-500 dark:text-stone-400">{row.ref}</span>
                      </td>

                      {/* Bultos */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">{row.bultos}</span>
                      </td>

                      {/* Rut */}
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-xs text-stone-500 dark:text-stone-400">{row.rut}</span>
                      </td>

                      {/* Recepción */}
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-stone-600 dark:text-stone-300">{row.recepcion || <span className="text-stone-300 dark:text-stone-600">–</span>}</span>
                      </td>

                      {/* Fecha/Hora */}
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">{row.fechaHora || <span className="text-stone-300 dark:text-stone-600">–</span>}</span>
                      </td>

                      {/* Chofer */}
                      <td className="px-3 py-2.5">
                        {row.chofer ? (
                          <div className="flex items-center gap-1.5">
                            <div aria-hidden="true" className="size-5 bg-primary-100 dark:bg-primary-900/80 rounded-full flex items-center justify-center text-[10px] font-semibold text-primary-700 dark:text-primary-300 flex-shrink-0">
                              {row.chofer.charAt(0)}
                            </div>
                            <span className="text-xs text-stone-700 dark:text-stone-200 whitespace-nowrap">{row.chofer}</span>
                          </div>
                        ) : <span className="text-stone-300 dark:text-stone-600 text-xs">–</span>}
                      </td>

                      {/* Vehículo */}
                      <td className="px-3 py-2.5">
                        {row.vehiculo ? (
                          <span className="font-mono text-xs font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                            {row.vehiculo}
                          </span>
                        ) : <span className="text-stone-300 dark:text-stone-600 text-xs">–</span>}
                      </td>

                      {/* Peoneta */}
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-stone-500 dark:text-stone-400">{row.peoneta || <span className="text-stone-300 dark:text-stone-600">–</span>}</span>
                      </td>

                      {/* Obs */}
                      <td className="px-3 py-2.5 max-w-[160px]">
                        <span className="text-xs text-stone-500 dark:text-stone-400 truncate block">{row.obs || <span className="text-stone-300 dark:text-stone-600">–</span>}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setDetailRecord(row)}
                            className="p-1 rounded text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className="p-1 rounded text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                        {/* Always visible on hover via row */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => setDetailRecord(row)}
                            className="p-1 rounded text-stone-300 dark:text-stone-600 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80">
            <span className="text-xs text-stone-400 dark:text-stone-500">
              Mostrando <strong className="text-stone-600 dark:text-stone-300">{filtered.length}</strong> de{' '}
              <strong className="text-stone-600 dark:text-stone-300">{records.length}</strong> paradas
              {selected.size > 0 && <> · <strong className="text-primary-600 dark:text-primary-400">{selected.size}</strong> seleccionadas</>}
            </span>
            <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
              <span>Total bultos: <strong className="text-stone-700 dark:text-stone-200">{filtered.reduce((s, r) => s + r.bultos, 0)}</strong></span>
              <span>·</span>
              <span>
                Entregados:{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">{filtered.filter(r => r.estado === 'entregado').length}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detalle ruta + pedidos */}
      {routePedidosDetail && (
        <RoutePedidosModal route={routePedidosDetail} onClose={() => setRoutePedidosDetail(null)} />
      )}

      {/* Detail modal */}
      {detailRecord && (
        <DeliveryDetailModal record={detailRecord} onClose={() => setDetailRecord(null)} />
      )}

      {/* New route modal */}
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

      {/* Status manager modal */}
      <Modal
        open={showStatusManager}
        onClose={() => setShowStatusManager(false)}
        title="Gestión de estados"
        description="Gestión de estados en Rutas"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Próximamente podrás crear y configurar nuevos estados desde esta vista.
          </p>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowStatusManager(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

