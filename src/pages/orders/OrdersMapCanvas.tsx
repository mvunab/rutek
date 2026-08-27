import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { clsx } from 'clsx';
import { OrderStatusBadge } from '../../components/ui/Badge';
import type { Order } from '../../types';
import {
  FitBounds,
  FlyToDraft,
  FlyToOrder,
  MapClickToAdjustDraft,
} from './OrdersMapLeafletHelpers';
import { SANTIAGO_CENTER, statusColor } from './ordersMapConstants';

export function OrdersMapCanvas({
  mapReady,
  loading,
  ordersCount,
  placing,
  selected,
  draftPin,
  savingPin,
  geocoding,
  mapPoints,
  withCoords,
  selectedId,
  onSelect,
  onAdjustDraftPin,
}: {
  mapReady: boolean;
  loading: boolean;
  ordersCount: number;
  placing: boolean;
  selected: Order | null;
  draftPin: { lat: number; lng: number } | null;
  savingPin: boolean;
  geocoding: boolean;
  mapPoints: LatLngExpression[];
  withCoords: Order[];
  selectedId: string | null;
  onSelect: (order: Order) => void;
  onAdjustDraftPin: (lat: number, lng: number) => void;
}) {
  return (
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
      {loading && ordersCount === 0 ? (
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
            onPick={onAdjustDraftPin}
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
  );
}
