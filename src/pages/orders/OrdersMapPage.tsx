import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  ORDERS_MAP_UNDER_CONSTRUCTION_MESSAGE,
  isOrdersMapModuleEnabled,
} from '../../lib/ordersMapModule';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useClientStore } from '../../store/useClientStore';
import type { Order } from '../../types';
import { OrdersMapCanvas } from './OrdersMapCanvas';
import { OrdersMapFilters } from './OrdersMapFilters';
import { OrdersMapSidebar } from './OrdersMapSidebar';
import { OrdersMapStatCard } from './OrdersMapStatCard';
import type { StatusFilter } from './ordersMapConstants';
import { useOrdersMapPlacement } from './useOrdersMapPlacement';

function subscribeNever() {
  return () => {};
}
function getClientMapReady() {
  return true;
}
function getServerMapReady() {
  return false;
}

export function OrdersMapPage() {
  const tenant = useAuthStore((s) => s.tenant);
  const mapEnabled = isOrdersMapModuleEnabled(tenant);
  const { orders, loading, fetchOrders } = useOrderStore();
  const { clients, fetchClients } = useClientStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [clientId, setClientId] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapReady = useSyncExternalStore(subscribeNever, getClientMapReady, getServerMapReady);

  useEffect(() => {
    if (!mapEnabled) return;
    void fetchOrders();
    void fetchClients();
  }, [mapEnabled, fetchOrders, fetchClients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (clientId !== 'all' && o.clientId !== clientId) return false;
      if (statusFilter === 'pending' && o.status !== 'pending') return false;
      if (statusFilter === 'in_transit' && o.status !== 'in_transit') return false;
      if (statusFilter === 'delivered' && o.status !== 'delivered') return false;
      if (statusFilter === 'rejected' && o.status !== 'rejected') return false;
      if (statusFilter === 'terminal' && o.status !== 'delivered' && o.status !== 'rejected') {
        return false;
      }
      if (
        statusFilter === 'open' &&
        o.status !== 'pending' &&
        o.status !== 'in_transit'
      ) {
        return false;
      }
      if (q) {
        const hay = `${o.code} ${o.clientName} ${o.destination.street} ${o.destination.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, clientId, search]);

  const unmapped = useMemo(
    () => filtered.filter((o) => !o.destination.coordinates),
    [filtered],
  );
  const withCoords = useMemo(
    () => filtered.filter((o) => Boolean(o.destination.coordinates)),
    [filtered],
  );

  const stats = useMemo(
    () => ({
      total: filtered.length,
      pending: filtered.filter((o) => o.status === 'pending').length,
      inTransit: filtered.filter((o) => o.status === 'in_transit').length,
      delivered: filtered.filter((o) => o.status === 'delivered').length,
      rejected: filtered.filter((o) => o.status === 'rejected').length,
      mapped: withCoords.length,
      unmapped: unmapped.length,
    }),
    [filtered, withCoords.length, unmapped.length],
  );

  const mapPoints = useMemo(
    () =>
      withCoords.map(
        (o) =>
          [o.destination.coordinates!.lat, o.destination.coordinates!.lng] as [number, number],
      ),
    [withCoords],
  );

  const selected = useMemo(
    () => filtered.find((o) => o.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  const needsPlacement = Boolean(selected && !selected.destination.coordinates);
  const placing = needsPlacement;

  const placement = useOrdersMapPlacement(selected, needsPlacement, unmapped);

  const onSelect = useCallback(
    (order: Order) => {
      setSelectedId(order.id);
      placement.resetPlacement(order);
    },
    [placement],
  );

  if (!mapEnabled) {
    return (
      <EmptyState
        icon={<MapPin size={32} aria-hidden />}
        title="Mapa de pedidos"
        description={ORDERS_MAP_UNDER_CONSTRUCTION_MESSAGE}
      />
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <OrdersMapStatCard label="Filtrados" value={stats.total} icon={<Package size={16} />} tone="neutral" />
        <OrdersMapStatCard label="Pendientes" value={stats.pending} icon={<Clock size={16} />} tone="amber" />
        <OrdersMapStatCard label="En ruta" value={stats.inTransit} icon={<Truck size={16} />} tone="blue" />
        <OrdersMapStatCard label="Entregados" value={stats.delivered} icon={<CheckCircle2 size={16} />} tone="green" />
        <OrdersMapStatCard label="Rechazados" value={stats.rejected} icon={<XCircle size={16} />} tone="red" />
        <OrdersMapStatCard
          label="Sin ubicar"
          value={stats.unmapped}
          icon={<AlertTriangle size={16} />}
          tone="amber"
        />
      </div>

      {stats.unmapped > 0 ? (
        <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-1.5">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden />
          {stats.unmapped} pedido{stats.unmapped !== 1 ? 's' : ''} sin pin: selecciónalos; si el
          destino es tipo «Ripley Arauco Maipú», usa las sugerencias, busca y confirma.
        </p>
      ) : null}

      <OrdersMapFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        clientId={clientId}
        onClientIdChange={setClientId}
        search={search}
        onSearchChange={setSearch}
        clients={clients}
        tenant={tenant}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-3 min-h-[520px]">
        <OrdersMapCanvas
          mapReady={mapReady}
          loading={loading}
          ordersCount={orders.length}
          placing={placing}
          selected={selected}
          draftPin={placement.draftPin}
          savingPin={placement.savingPin}
          geocoding={placement.geocoding}
          mapPoints={mapPoints}
          withCoords={withCoords}
          selectedId={selectedId}
          onSelect={onSelect}
          onAdjustDraftPin={placement.adjustDraftPin}
        />

        <OrdersMapSidebar
          filtered={filtered}
          unmapped={unmapped}
          withCoords={withCoords}
          selected={selected}
          selectedId={selectedId}
          needsPlacement={needsPlacement}
          placement={placement}
          onSelect={onSelect}
        />
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-stone-500 dark:text-stone-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-500" aria-hidden /> Pendiente
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-blue-600" aria-hidden /> En ruta
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-600" aria-hidden /> Entregado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-600" aria-hidden /> Rechazado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle size={11} className="text-amber-500" aria-hidden /> Sin ubicar → dirección +
          confirmar
        </span>
      </div>
    </div>
  );
}
