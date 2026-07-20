import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Select, Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { OrderStatusBadge } from '../../components/ui/Badge';
import {
  ORDERS_MAP_UNDER_CONSTRUCTION_MESSAGE,
  isOrdersMapModuleEnabled,
} from '../../lib/ordersMapModule';
import { geocodeChilePlaces, type GeocodeResult } from '../../lib/geocode';
import {
  bestPlaceQuery,
  destinationLooksLikeReceiver,
  extractDiscardedNoise,
  extractReceiverHint,
  placeSimilarity,
  splitPlaceAndNoise,
  suggestPlaceQueries,
  type PlaceQuerySuggestion,
} from '../../lib/placeQuerySuggest';
import { resolveOrderStatusLabel } from '../../lib/orderStatusLabels';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useClientStore } from '../../store/useClientStore';
import type { Order } from '../../types';

type StatusFilter =
  | 'all'
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'rejected'
  | 'terminal'
  | 'open';

const SANTIAGO_CENTER: LatLngExpression = [-33.4489, -70.6693];

function statusColor(status: string): string {
  if (status === 'delivered') return '#059669';
  if (status === 'rejected') return '#dc2626';
  if (status === 'in_transit') return '#2563eb';
  if (status === 'pending') return '#d97706';
  return '#78716c';
}

function FitBounds({ points }: { points: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      map.setView(SANTIAGO_CENTER, 11);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0]!, 14);
      return;
    }
    map.fitBounds(points as LatLngBoundsExpression, { padding: [40, 40], maxZoom: 14 });
  }, [map, points]);
  return null;
}

function FlyToOrder({ order }: { order: Order | null }) {
  const map = useMap();
  useEffect(() => {
    const c = order?.destination.coordinates;
    if (!c) return;
    map.flyTo([c.lat, c.lng], 15, { duration: 0.6 });
  }, [map, order?.id, order?.destination.coordinates?.lat, order?.destination.coordinates?.lng]);
  return null;
}

function FlyToDraft({ pin }: { pin: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!pin) return;
    map.flyTo([pin.lat, pin.lng], 16, { duration: 0.7 });
  }, [map, pin?.lat, pin?.lng]);
  return null;
}

/** Ajuste fino opcional del pin borrador (después de geocodificar). */
function MapClickToAdjustDraft({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'neutral' | 'amber' | 'blue' | 'green' | 'red';
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border px-3 py-2.5 flex items-center gap-2.5 min-w-0',
        tone === 'neutral' && 'bg-surface dark:bg-stone-900 border-stone-200 dark:border-stone-800',
        tone === 'amber' && 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40',
        tone === 'blue' && 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40',
        tone === 'green' && 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40',
        tone === 'red' && 'bg-red-50/80 dark:bg-red-950/30 border-red-100 dark:border-red-900/40',
      )}
    >
      <span className="shrink-0 text-stone-500 dark:text-stone-400" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-stone-900 dark:text-stone-100 leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

function OrderListItem({
  order,
  selected,
  onSelect,
}: {
  order: Order;
  selected: boolean;
  onSelect: (o: Order) => void;
}) {
  const hasPin = Boolean(order.destination.coordinates);
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(order)}
        className={clsx(
          'w-full text-left px-3 py-2.5 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors duration-200',
          selected && 'bg-primary-50/80 dark:bg-primary-950/30',
          !hasPin && 'border-l-2 border-amber-400',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-xs font-semibold text-stone-800 dark:text-stone-100">
            {order.code}
          </span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 truncate">
          {order.clientName}
        </p>
        <p className="text-[11px] text-stone-500 truncate flex items-center gap-1 mt-0.5">
          {hasPin ? (
            <MapPin size={11} className="shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <AlertTriangle size={11} className="shrink-0 text-amber-500" aria-hidden />
          )}
          {hasPin
            ? `${order.destination.city || order.destination.street || 'Con pin'}`
            : `Sin pin · ingresar dirección`}
        </p>
      </button>
    </li>
  );
}

export function OrdersMapPage() {
  const tenant = useAuthStore((s) => s.tenant);
  const mapEnabled = isOrdersMapModuleEnabled(tenant);
  const { orders, loading, fetchOrders, updateOrder } = useOrderStore();
  const { clients, fetchClients } = useClientStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [clientId, setClientId] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const [addressQuery, setAddressQuery] = useState('');
  const [querySuggestions, setQuerySuggestions] = useState<PlaceQuerySuggestion[]>([]);
  const [draftPin, setDraftPin] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodeLabel, setGeocodeLabel] = useState('');
  const [geocodeHits, setGeocodeHits] = useState<GeocodeResult[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [pinMsg, setPinMsg] = useState('');
  const [applyToSimilar, setApplyToSimilar] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

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
          [o.destination.coordinates!.lat, o.destination.coordinates!.lng] as LatLngExpression,
      ),
    [withCoords],
  );

  const selected = useMemo(
    () => filtered.find((o) => o.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  const needsPlacement = Boolean(selected && !selected.destination.coordinates);
  const placing = needsPlacement;

  const SIMILARITY_THRESHOLD = 0.8;

  /**
   * Pedidos sin pin cuyo lugar coincide ≥80% con lo que se está buscando.
   * Compara solo el lugar parseado del destino de cada pedido (nunca el
   * nombre del cliente como fallback) para no agrupar tiendas distintas
   * del mismo cliente.
   */
  const similarUnmapped = useMemo(() => {
    if (!selected || !needsPlacement) return [] as Order[];
    const reference = addressQuery.trim() || bestPlaceQuery(selected);
    if (reference.length < 3) return [] as Order[];
    return unmapped.filter((o) => {
      if (o.id === selected.id) return false;
      const otherPlace = splitPlaceAndNoise(o.destination.street ?? '').place;
      if (!otherPlace || otherPlace.length < 3) return false;
      return placeSimilarity(reference, otherPlace) >= SIMILARITY_THRESHOLD;
    });
  }, [selected, needsPlacement, addressQuery, unmapped]);

  const resetPlacement = useCallback((order: Order | null) => {
    setDraftPin(null);
    setGeocodeLabel('');
    setGeocodeHits([]);
    setPinMsg('');
    setGeocoding(false);
    setApplyToSimilar(true);
    if (order && !order.destination.coordinates) {
      const suggestions = suggestPlaceQueries(order);
      setQuerySuggestions(suggestions);
      setAddressQuery(bestPlaceQuery(order));
      const noise = extractDiscardedNoise(order);
      const receiver = extractReceiverHint(order);
      if (noise) {
        setPinMsg(
          `Se omitió texto irrelevante («${noise}»). Busca el lugar y confirma el pin.`,
        );
      } else if (destinationLooksLikeReceiver(order)) {
        setPinMsg(
          receiver
            ? `«${order.destination.street}» parece quien recibe (${receiver}), no la dirección. Usa la tienda o escribe el local.`
            : 'El destino parece nombre de quien recibe. Escribe el local o elige la tienda.',
        );
      } else if (suggestions[0]) {
        setPinMsg(`Listo para buscar «${suggestions[0].query}». Confirma el pin en el mapa.`);
      } else {
        setPinMsg('Escribe el lugar o dirección, búscala y confirma el pin.');
      }
    } else {
      setAddressQuery('');
      setQuerySuggestions([]);
    }
  }, []);

  const onSelect = useCallback(
    (order: Order) => {
      setSelectedId(order.id);
      resetPlacement(order);
    },
    [resetPlacement],
  );

  const applyGeocodeHit = useCallback((hit: GeocodeResult) => {
    setDraftPin({ lat: hit.lat, lng: hit.lng });
    setGeocodeLabel(hit.displayName);
    setPinMsg('Revisa el pin en el mapa. Si está bien, confirma la ubicación.');
  }, []);

  const searchAddress = useCallback(async () => {
    if (!selected || !needsPlacement) return;
    const q = addressQuery.trim();
    if (q.length < 3) {
      setPinMsg('Escribe un lugar o dirección más completa (ej. Ripley Arauco Maipú).');
      return;
    }
    setGeocoding(true);
    setPinMsg('Buscando en el mapa…');
    setGeocodeHits([]);
    try {
      const results = await geocodeChilePlaces(q, 5);
      if (results.length === 0) {
        setDraftPin(null);
        setGeocodeLabel('');
        setPinMsg(
          'No encontramos ese lugar. Prueba otra sugerencia o «Marca + mall + comuna».',
        );
        return;
      }
      setGeocodeHits(results);
      applyGeocodeHit(results[0]!);
      if (results.length > 1) {
        setPinMsg(
          `Encontramos ${results.length} coincidencias. Elige la correcta abajo o confirma la primera.`,
        );
      }
    } catch {
      setPinMsg('No se pudo buscar. Intenta de nuevo.');
    } finally {
      setGeocoding(false);
    }
  }, [selected, needsPlacement, addressQuery, applyGeocodeHit]);

  /** Confirma que el pedido quedó con coordenadas en el store (el store
   *  silencia errores de red, así que el await solo no basta). */
  const pinPersisted = useCallback((orderId: string) => {
    const row = useOrderStore.getState().orders.find((o) => o.id === orderId);
    return Boolean(row?.destination.coordinates);
  }, []);

  const confirmPin = useCallback(async () => {
    if (!selected || !draftPin) return;
    const bulkTargets = applyToSimilar ? similarUnmapped : [];
    setSavingPin(true);
    setPinMsg(
      bulkTargets.length > 0
        ? `Guardando ubicación en ${bulkTargets.length + 1} pedidos…`
        : 'Guardando ubicación…',
    );
    try {
      const street =
        addressQuery.trim() ||
        selected.destination.street ||
        geocodeLabel.split(',')[0]?.trim() ||
        selected.destination.street;
      await updateOrder(selected.id, {
        destination: {
          ...selected.destination,
          street: street || selected.destination.street,
          city: selected.destination.city || '',
          coordinates: { lat: draftPin.lat, lng: draftPin.lng },
        },
      });
      if (!pinPersisted(selected.id)) {
        setPinMsg('No se pudo guardar (sin conexión con el servidor). Intenta de nuevo.');
        return;
      }

      let bulkOk = 0;
      let bulkFail = 0;
      for (const order of bulkTargets) {
        try {
          // Cada pedido conserva su propia calle; solo comparte el pin.
          await updateOrder(order.id, {
            destination: {
              ...order.destination,
              city: order.destination.city || '',
              coordinates: { lat: draftPin.lat, lng: draftPin.lng },
            },
          });
          if (pinPersisted(order.id)) bulkOk++;
          else bulkFail++;
        } catch {
          bulkFail++;
        }
      }

      setDraftPin(null);
      setGeocodeLabel('');
      setGeocodeHits([]);
      setQuerySuggestions([]);
      setAddressQuery('');
      if (bulkTargets.length === 0) {
        setPinMsg('Ubicación guardada.');
      } else if (bulkFail === 0) {
        setPinMsg(`Ubicación guardada en ${bulkOk + 1} pedidos con el mismo destino.`);
      } else {
        setPinMsg(
          `Ubicación guardada en ${bulkOk + 1} pedidos; ${bulkFail} fallaron. Reintenta con esos.`,
        );
      }
    } catch {
      setPinMsg('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSavingPin(false);
    }
  }, [
    selected,
    draftPin,
    addressQuery,
    geocodeLabel,
    updateOrder,
    applyToSimilar,
    similarUnmapped,
    pinPersisted,
  ]);

  const cancelDraft = useCallback(() => {
    setDraftPin(null);
    setGeocodeLabel('');
    setGeocodeHits([]);
    setPinMsg('Elige una sugerencia o edita la búsqueda, luego ubica y confirma.');
  }, []);

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
        <StatCard label="Filtrados" value={stats.total} icon={<Package size={16} />} tone="neutral" />
        <StatCard label="Pendientes" value={stats.pending} icon={<Clock size={16} />} tone="amber" />
        <StatCard label="En ruta" value={stats.inTransit} icon={<Truck size={16} />} tone="blue" />
        <StatCard label="Entregados" value={stats.delivered} icon={<CheckCircle2 size={16} />} tone="green" />
        <StatCard label="Rechazados" value={stats.rejected} icon={<XCircle size={16} />} tone="red" />
        <StatCard
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

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Select
          label="Estado"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'open', label: 'Abiertos (pendiente + en ruta)' },
            { value: 'terminal', label: 'Cerrados (entregado + rechazado)' },
            { value: 'pending', label: resolveOrderStatusLabel('pending', tenant) },
            { value: 'in_transit', label: resolveOrderStatusLabel('in_transit', tenant) },
            { value: 'delivered', label: resolveOrderStatusLabel('delivered', tenant) },
            { value: 'rejected', label: resolveOrderStatusLabel('rejected', tenant) },
          ]}
        />
        <Select
          label="Cliente / destino"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          options={[
            { value: 'all', label: 'Todos' },
            ...clients.map((c) => ({ value: c.id, label: c.companyName })),
          ]}
        />
        <Input
          label="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Código, cliente, dirección…"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-3 min-h-[520px]">
        <div
          className={clsx(
            'rounded-xl border overflow-hidden bg-stone-100 dark:bg-stone-950 min-h-[420px] relative z-0',
            placing && draftPin
              ? 'border-amber-400 dark:border-amber-600'
              : 'border-stone-200 dark:border-stone-800',
          )}
        >
          {placing ? (
            <div className="absolute top-2 left-2 right-2 z-[1000] pointer-events-none">
              <p className="text-xs font-medium text-amber-950 dark:text-amber-100 bg-amber-100/95 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-800 rounded-lg px-3 py-2 shadow-sm">
                {draftPin
                  ? `Pin borrador de ${selected?.code}: confirma en el panel o ajusta con un clic en el mapa.`
                  : `Pedido ${selected?.code}: ingresa la dirección en el panel y búscala.`}
              </p>
            </div>
          ) : null}
          {loading && orders.length === 0 ? (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-stone-500 z-10">
              Cargando pedidos…
            </p>
          ) : null}
          {mapReady ? (
            <MapContainer
              center={SANTIAGO_CENTER}
              zoom={11}
              className="h-[min(70vh,640px)] w-full"
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {!placing ? <FitBounds points={mapPoints} /> : null}
              <FlyToOrder order={selected?.destination.coordinates ? selected : null} />
              <FlyToDraft pin={draftPin} />
              <MapClickToAdjustDraft
                enabled={Boolean(placing && draftPin && !savingPin && !geocoding)}
                onPick={(lat, lng) => {
                  setDraftPin({ lat, lng });
                  setPinMsg('Pin ajustado. Confirma la ubicación si está correcta.');
                }}
              />
              {withCoords.map((o) => {
                const c = o.destination.coordinates!;
                const active = selectedId === o.id;
                return (
                  <CircleMarker
                    key={o.id}
                    center={[c.lat, c.lng]}
                    pathOptions={{
                      color: active ? '#0f172a' : statusColor(o.status),
                      fillColor: statusColor(o.status),
                      fillOpacity: active ? 0.95 : 0.75,
                      weight: active ? 3 : 1.5,
                    }}
                    radius={active ? 11 : 8}
                    eventHandlers={{
                      click: () => onSelect(o),
                    }}
                  >
                    <Popup>
                      <div className="text-sm space-y-1 min-w-[160px]">
                        <p className="font-mono font-semibold">{o.code}</p>
                        <p className="text-stone-600">{o.clientName}</p>
                        <p className="text-xs text-stone-500">
                          {o.destination.street}, {o.destination.city}
                        </p>
                        <OrderStatusBadge status={o.status} />
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
              {draftPin ? (
                <CircleMarker
                  center={[draftPin.lat, draftPin.lng]}
                  pathOptions={{
                    color: '#b45309',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.9,
                    weight: 2,
                    dashArray: '4 4',
                  }}
                  radius={12}
                />
              ) : null}
            </MapContainer>
          ) : (
            <div className="h-[min(70vh,640px)] flex items-center justify-center text-sm text-stone-500">
              Preparando mapa…
            </div>
          )}
        </div>

        <aside className="rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900 overflow-hidden flex flex-col max-h-[min(70vh,640px)]">
          <div className="px-3 py-2.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              Pedidos
            </h2>
            <span className="text-xs text-stone-500 tabular-nums">{filtered.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {filtered.length === 0 ? (
              <p className="p-4 text-sm text-stone-500 text-center">Sin resultados</p>
            ) : (
              <>
                {unmapped.length > 0 ? (
                  <div>
                    <div className="sticky top-0 z-10 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/40">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                        Sin ubicar ({unmapped.length})
                      </p>
                    </div>
                    <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                      {unmapped.map((o) => (
                        <OrderListItem
                          key={o.id}
                          order={o}
                          selected={selectedId === o.id}
                          onSelect={onSelect}
                        />
                      ))}
                    </ul>
                  </div>
                ) : null}
                {withCoords.length > 0 ? (
                  <div>
                    <div className="sticky top-0 z-10 px-3 py-1.5 bg-stone-50 dark:bg-stone-900/90 border-b border-stone-100 dark:border-stone-800">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                        En mapa ({withCoords.length})
                      </p>
                    </div>
                    <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                      {withCoords.map((o) => (
                        <OrderListItem
                          key={o.id}
                          order={o}
                          selected={selectedId === o.id}
                          onSelect={onSelect}
                        />
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </div>
          {selected ? (
            <div className="border-t border-stone-200 dark:border-stone-800 px-3 py-3 text-xs space-y-2.5 bg-stone-50/80 dark:bg-stone-900/80 shrink-0">
              <div>
                <p className="font-medium text-stone-800 dark:text-stone-100">
                  Seleccionado: <span className="font-mono">{selected.code}</span>
                </p>
              <p className="text-stone-500 mt-0.5">
                {selected.destination.street || 'Sin calle'}, {selected.destination.city || '—'}
              </p>
              {needsPlacement && (destinationLooksLikeReceiver(selected) || extractDiscardedNoise(selected)) ? (
                <p
                  className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-md px-2 py-1.5"
                  role="status"
                >
                  {(() => {
                    const noise = extractDiscardedNoise(selected);
                    if (noise) {
                      return (
                        <>
                          Texto omitido del destino: <strong>{noise}</strong> (quién recibe). Se
                          usa solo el lugar para el mapa.
                        </>
                      );
                    }
                    const who = extractReceiverHint(selected);
                    return (
                      <>
                        Destino raro: parece «quién recibe»
                        {who ? ` (${who})` : ''}, no el local.
                      </>
                    );
                  })()}
                </p>
              ) : null}
              </div>

              {needsPlacement ? (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void searchAddress();
                  }}
                >
                  {!draftPin && similarUnmapped.length > 0 ? (
                    <p className="text-[11px] leading-snug text-primary-800 dark:text-primary-200 bg-primary-50/80 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-md px-2 py-1.5">
                      Hay {similarUnmapped.length} pedido
                      {similarUnmapped.length !== 1 ? 's' : ''} más sin pin con este mismo lugar.
                      Busca una vez y podrás confirmar la ubicación para todos.
                    </p>
                  ) : null}

                  {querySuggestions.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                        Lugar detectado
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {querySuggestions.slice(0, 2).map((s) => (
                          <button
                            key={s.query}
                            type="button"
                            disabled={geocoding || savingPin}
                            title={s.reason}
                            onClick={() => {
                              setAddressQuery(s.query);
                              setPinMsg(s.reason);
                            }}
                            className={clsx(
                              'max-w-full truncate rounded-md border px-2 py-1 text-[11px] cursor-pointer transition-colors duration-200',
                              addressQuery.trim().toLowerCase() === s.query.trim().toLowerCase()
                                ? 'border-primary-400 bg-primary-50 text-primary-900 dark:bg-primary-950/40 dark:text-primary-100 dark:border-primary-700'
                                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200 dark:hover:bg-stone-800',
                            )}
                          >
                            <MapPin
                              size={10}
                              className="inline -mt-0.5 mr-0.5 opacity-70"
                              aria-hidden
                            />
                            {s.query}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <label className="block space-y-1">
                    <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                      Lugar o dirección a ubicar
                    </span>
                    <textarea
                      value={addressQuery}
                      onChange={(e) => setAddressQuery(e.target.value)}
                      rows={2}
                      placeholder="Ej. Ripley Arauco Maipú"
                      disabled={geocoding || savingPin}
                      className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-2.5 py-2 text-xs text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-y min-h-[56px]"
                    />
                  </label>
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    fullWidth
                    loading={geocoding}
                    disabled={savingPin || addressQuery.trim().length < 3}
                    icon={<Search size={14} aria-hidden />}
                  >
                    Buscar en el mapa
                  </Button>

                  {geocodeHits.length > 1 ? (
                    <ul className="space-y-1 max-h-28 overflow-y-auto">
                      {geocodeHits.map((hit) => {
                        const active =
                          draftPin?.lat === hit.lat && draftPin?.lng === hit.lng;
                        return (
                          <li key={`${hit.lat},${hit.lng},${hit.displayName}`}>
                            <button
                              type="button"
                              disabled={geocoding || savingPin}
                              onClick={() => applyGeocodeHit(hit)}
                              className={clsx(
                                'w-full text-left rounded-md border px-2 py-1.5 text-[11px] cursor-pointer transition-colors duration-200',
                                active
                                  ? 'border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100'
                                  : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-950 dark:hover:bg-stone-800',
                              )}
                            >
                              {hit.displayName}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : geocodeLabel ? (
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug">
                      Encontrado: {geocodeLabel}
                    </p>
                  ) : null}

                  {draftPin && similarUnmapped.length > 0 ? (
                    <div
                      className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/80 dark:bg-primary-950/40 px-2.5 py-2 space-y-1.5"
                      role="status"
                    >
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={applyToSimilar}
                          disabled={savingPin || geocoding}
                          onChange={(e) => setApplyToSimilar(e.target.checked)}
                          className="mt-0.5 accent-primary-600 cursor-pointer"
                        />
                        <span className="text-[11px] leading-snug text-primary-900 dark:text-primary-100">
                          <strong>
                            {similarUnmapped.length} pedido
                            {similarUnmapped.length !== 1 ? 's' : ''} más
                          </strong>{' '}
                          sin pin apunta{similarUnmapped.length !== 1 ? 'n' : ''} al mismo lugar
                          (coincidencia ≥80%). Asignarles esta misma ubicación.
                        </span>
                      </label>
                      <ul className="pl-5 space-y-0.5">
                        {similarUnmapped.slice(0, 4).map((o) => (
                          <li
                            key={o.id}
                            className="text-[11px] text-primary-800/80 dark:text-primary-200/80 truncate"
                          >
                            <span className="font-mono font-semibold">{o.code}</span>
                            {' · '}
                            {o.destination.street || 'sin calle'}
                          </li>
                        ))}
                        {similarUnmapped.length > 4 ? (
                          <li className="text-[11px] text-primary-800/70 dark:text-primary-200/70">
                            +{similarUnmapped.length - 4} más
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  ) : null}

                  {draftPin ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        fullWidth
                        loading={savingPin}
                        disabled={geocoding}
                        onClick={() => void confirmPin()}
                        icon={<CheckCircle2 size={14} aria-hidden />}
                      >
                        {applyToSimilar && similarUnmapped.length > 0
                          ? `Confirmar en ${similarUnmapped.length + 1} pedidos`
                          : 'Confirmar ubicación'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={geocoding || savingPin}
                        onClick={cancelDraft}
                      >
                        Limpiar
                      </Button>
                    </div>
                  ) : null}
                </form>
              ) : null}

              {pinMsg ? (
                <p className="text-stone-600 dark:text-stone-300" role="status">
                  {pinMsg}
                </p>
              ) : null}
              {selected.routeId ? (
                <Link
                  to="/rutas"
                  className="text-primary-700 dark:text-primary-300 underline block cursor-pointer"
                >
                  Ver en rutas
                </Link>
              ) : null}
            </div>
          ) : null}
        </aside>
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
