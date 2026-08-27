import {
  ZoomIn, Truck, Package, Camera, ChevronRight, MapPin,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { RoutePhoto } from '../../types';
import { routeStatusLabel } from '../../lib/routeStatusLabels';
import { RouteListSection } from './RouteListSection';
import {
  isRouteDelivered,
  listItemBase,
  panelHeader,
  routeStatusDot,
  type RouteListItem,
} from './photosPageShared';

type OrderInRoute = {
  code: string;
  orderId: string;
  clientName: string;
  orderStatus?: string;
  photoCount: number;
};

type PhotosExplorerProps = {
  routesDelivered: RouteListItem[];
  routesPending: RouteListItem[];
  selectedRoute: string | null;
  onSelectRoute: (code: string) => void;
  ordersInRoute: OrderInRoute[];
  selectedOrder: string | null;
  onSelectOrder: (code: string) => void;
  selectedRouteMeta: RouteListItem | undefined;
  selectedOrderMeta: OrderInRoute | undefined;
  photosForOrder: RoutePhoto[];
  onOpenLightbox: (photos: RoutePhoto[], index: number) => void;
};

export function PhotosExplorer({
  routesDelivered,
  routesPending,
  selectedRoute,
  onSelectRoute,
  ordersInRoute,
  selectedOrder,
  onSelectOrder,
  selectedRouteMeta,
  selectedOrderMeta,
  photosForOrder,
  onOpenLightbox,
}: PhotosExplorerProps) {
  return (
    <div
      className="flex flex-col lg:flex-row flex-1 min-h-[420px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 shadow-sm overflow-hidden"
      role="application"
      aria-label="Explorador de evidencias por ruta y pedido"
    >
      <div className="flex flex-col w-full lg:w-52 xl:w-56 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-800 shrink-0 min-h-0 max-h-48 lg:max-h-none">
        <p className={panelHeader}>
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} aria-hidden />
            Ruta
          </span>
        </p>
        <div
          className="flex-1 overflow-y-auto overscroll-y-contain"
          role="listbox"
          aria-label="Rutas con evidencias"
        >
          <RouteListSection
            title="Rutas entregadas"
            routes={routesDelivered}
            selectedRoute={selectedRoute}
            onSelectRoute={onSelectRoute}
          />
          <RouteListSection
            title="Rutas pendientes"
            routes={routesPending}
            selectedRoute={selectedRoute}
            onSelectRoute={onSelectRoute}
          />
        </div>
      </div>

      <div className="flex flex-col w-full lg:w-52 xl:w-60 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-800 shrink-0 min-h-0 max-h-48 lg:max-h-none">
        <p className={panelHeader}>
          <span className="inline-flex items-center gap-1">
            <Package size={12} aria-hidden />
            Pedido
          </span>
        </p>
        <div
          className="flex-1 overflow-y-auto overscroll-y-contain"
          role="listbox"
          aria-label="Pedidos con evidencias"
        >
          {!selectedRoute ? (
            <p className="px-3 py-6 text-xs text-stone-400 dark:text-stone-500 text-center">Elige una ruta</p>
          ) : ordersInRoute.length === 0 ? (
            <p className="px-3 py-6 text-xs text-stone-400 dark:text-stone-500 text-center">Sin pedidos en esta ruta</p>
          ) : (
            ordersInRoute.map((order) => {
              const active = selectedOrder === order.code;
              return (
                <button
                  key={order.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => onSelectOrder(order.code)}
                  className={clsx(
                    listItemBase,
                    active
                      ? 'bg-primary-50 dark:bg-primary-950/40 border-l-2 border-l-primary-500'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/60',
                  )}
                >
                  <span className="font-mono text-xs font-bold text-stone-800 dark:text-stone-100 block">
                    {order.code}
                  </span>
                  {order.clientName && (
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate block mt-0.5">
                      {order.clientName}
                    </span>
                  )}
                  {order.orderStatus && (
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 capitalize mt-0.5 block">
                      {order.orderStatus === 'delivered' ? 'Entregado' : 'Rechazado'}
                    </span>
                  )}
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 tabular-nums mt-1 block">
                    {order.photoCount} foto{order.photoCount !== 1 ? 's' : ''}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <p className={panelHeader}>
          <span className="inline-flex items-center gap-1">
            <Camera size={12} aria-hidden />
            Evidencias
          </span>
        </p>

        {!selectedOrder ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-sm text-stone-400 dark:text-stone-500 text-center">Elige un pedido para ver sus fotos</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/50 shrink-0">
              <p className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">Viendo</p>
              {selectedRouteMeta?.routeName && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">{selectedRouteMeta.routeName}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {selectedRouteMeta && (
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full',
                      isRouteDelivered(selectedRouteMeta.routeStatus)
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                        : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
                    )}
                  >
                    <span
                      className={clsx(
                        'size-1.5 rounded-full',
                        routeStatusDot[selectedRouteMeta.routeStatus],
                      )}
                      aria-hidden
                    />
                    {routeStatusLabel(selectedRouteMeta.routeStatus)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 font-mono font-semibold text-stone-800 dark:text-stone-100">
                  <MapPin size={14} className="text-stone-400 dark:text-stone-500" aria-hidden />
                  {selectedRoute}
                </span>
                <ChevronRight size={14} className="text-stone-300 dark:text-stone-600" aria-hidden />
                <span className="inline-flex items-center gap-1 font-mono font-semibold text-primary-800 dark:text-primary-300">
                  <Package size={14} className="text-primary-500 dark:text-primary-400" aria-hidden />
                  {selectedOrder}
                </span>
                {selectedOrderMeta?.clientName && (
                  <span className="text-stone-600 dark:text-stone-400 text-xs">· {selectedOrderMeta.clientName}</span>
                )}
              </div>
              {selectedRouteMeta?.driverName && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1">
                  <Truck size={11} aria-hidden />
                  {selectedRouteMeta.driverName}
                  {photosForOrder[0]?.vehiclePlate && (
                    <span translate="no">&nbsp;·&nbsp;{photosForOrder[0].vehiclePlate}</span>
                  )}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-y-contain p-4">
              <ul
                className="flex flex-wrap gap-3"
                aria-label={`Fotos del pedido ${selectedOrder}`}
              >
                {photosForOrder.map((photo, i) => (
                  <li key={photo.id}>
                  <button
                    type="button"
                    onClick={() => onOpenLightbox(photosForOrder, i)}
                    aria-label={`Ver evidencia ${i + 1}`}
                    className="group relative w-32 h-24 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 hover:border-primary-400 dark:hover:border-primary-500 transition-[border-color,transform] hover:scale-[1.02] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <img
                      src={photo.thumbnailUrl}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      width={128}
                      height={96}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/128x96/e7e5e4/a8a29e?text=F';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                      <ZoomIn
                        size={20}
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-hidden
                      />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                      <span className="text-[10px] text-white/90 tabular-nums">
                        {photo.fecha}&nbsp;{photo.hora}
                      </span>
                    </div>
                  </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
