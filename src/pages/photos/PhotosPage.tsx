import { useEffect, useState, useMemo } from 'react';
import {
  Search, X, ZoomIn, Truck, Calendar,
  Package, Camera, ChevronLeft, ChevronRight, MapPin,
} from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';
import type { RoutePhoto, RouteStatus } from '../../types';
import { normalizeRouteStatus, routeStatusLabel } from '../../lib/routeStatusLabels';
import { clsx } from 'clsx';

type RouteListItem = {
  code: string;
  routeId: string;
  routeName: string;
  routeStatus: RouteStatus;
  driverName: string;
  fecha: string;
  photoCount: number;
  orderCount: number;
};

function isRouteDelivered(status: RouteStatus) {
  return status === 'completed';
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: RoutePhoto[];
  index: number;
  onIndexChange: (n: number) => void;
  onClose: () => void;
}) {
  const idx = Math.min(Math.max(index, 0), photos.length - 1);
  const photo = photos[idx];

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && idx > 0) onIndexChange(idx - 1);
      if (e.key === 'ArrowRight' && idx < photos.length - 1) onIndexChange(idx + 1);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [idx, photos.length, onIndexChange, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Evidencia — ${photo.orderCode}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/92 backdrop-blur-sm p-4"
    >
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X size={20} aria-hidden />
      </button>

      {idx > 0 && (
        <button
          onClick={() => onIndexChange(idx - 1)}
          aria-label="Foto anterior"
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ChevronLeft size={22} aria-hidden />
        </button>
      )}
      {idx < photos.length - 1 && (
        <button
          onClick={() => onIndexChange(idx + 1)}
          aria-label="Siguiente foto"
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ChevronRight size={22} aria-hidden />
        </button>
      )}

      <div className="flex flex-col items-center gap-4 max-w-3xl w-full">
        <div className="relative rounded-xl overflow-hidden shadow-2xl bg-stone-900 max-h-[65vh]">
          <img
            src={photo.photoUrl}
            alt={photo.description || `Evidencia ${photo.orderCode}`}
            className="max-h-[65vh] w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://placehold.co/400x300/292524/a8a29e?text=Imagen+no+disponible';
            }}
          />
          <div className="absolute bottom-3 right-3 text-xs text-white/60 bg-black/40 px-2 py-1 rounded-full tabular-nums">
            {idx + 1}&nbsp;/&nbsp;{photos.length}
          </div>
        </div>

        <div className="w-full bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-white space-y-1.5">
          {photo.description && <p className="text-sm font-medium">{photo.description}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/70">
            <span className="flex items-center gap-1.5">
              <MapPin size={12} aria-hidden />
              Ruta&nbsp;<strong className="text-white font-mono">{photo.routeCode}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Package size={12} aria-hidden />
              <span className="font-mono">{photo.orderCode}</span>
              {photo.clientName && <>&nbsp;·&nbsp;{photo.clientName}</>}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={12} aria-hidden />
              {photo.fecha}&nbsp;{photo.hora}
            </span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full" role="list" aria-label="Miniaturas">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="listitem"
              aria-label={`Ver foto ${i + 1}`}
              aria-pressed={i === idx}
              onClick={() => onIndexChange(i)}
              className={clsx(
                'flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                i === idx ? 'border-white scale-105' : 'border-white/20 hover:border-white/50',
              )}
            >
              <img
                src={p.thumbnailUrl}
                alt=""
                aria-hidden
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/80x60/292524/a8a29e?text=F';
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Página: 3 columnas Ruta → Pedido → Fotos ────────────────────────────────

const panelHeader =
  'px-3 py-2 border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-500 uppercase tracking-wider shrink-0';

const listItemBase =
  'w-full text-left px-3 py-2.5 border-b border-stone-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset';

const routeStatusDot: Record<RouteStatus, string> = {
  not_started: 'bg-stone-400',
  in_progress: 'bg-amber-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-400',
};

function RouteListSection({
  title,
  routes,
  selectedRoute,
  onSelectRoute,
}: {
  title: string;
  routes: RouteListItem[];
  selectedRoute: string | null;
  onSelectRoute: (code: string) => void;
}) {
  if (routes.length === 0) return null;

  return (
    <div role="group" aria-label={title}>
      <p className="sticky top-0 z-10 px-3 py-1.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider bg-stone-100/95 border-b border-stone-200 backdrop-blur-sm">
        {title}
        <span className="ml-1.5 font-normal tabular-nums text-stone-400">({routes.length})</span>
      </p>
      {routes.map((route) => {
        const active = selectedRoute === route.code;
        return (
          <button
            key={route.code}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onSelectRoute(route.code)}
            className={clsx(
              listItemBase,
              active
                ? 'bg-primary-50 border-l-2 border-l-primary-500'
                : 'hover:bg-stone-50',
            )}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className={clsx('size-1.5 rounded-full shrink-0', routeStatusDot[route.routeStatus])}
                aria-hidden
              />
              <span className="text-[10px] font-medium text-stone-500">
                {routeStatusLabel(route.routeStatus)}
              </span>
            </div>
            <span className="font-mono text-sm font-bold text-stone-800 block">{route.code}</span>
            {route.routeName && (
              <span className="text-[11px] text-stone-600 truncate block">{route.routeName}</span>
            )}
            {route.driverName && (
              <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                <Truck size={10} aria-hidden className="shrink-0" />
                {route.driverName}
              </span>
            )}
            <span className="text-[10px] text-stone-400 tabular-nums mt-1 block">
              {route.orderCount} pedido{route.orderCount !== 1 ? 's' : ''} · {route.photoCount} foto
              {route.photoCount !== 1 ? 's' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function PhotosPage() {
  const [search, setSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: RoutePhoto[]; index: number } | null>(null);
  const { photos, loading, fetchPhotos } = usePhotoStore();

  useEffect(() => {
    void fetchPhotos();
  }, [fetchPhotos]);

  /** Solo pedidos finalizados en DB con evidencia (API ya filtra delivered/rejected). */
  const evidencePhotos = useMemo(() => photos, [photos]);

  const searchFiltered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return evidencePhotos;
    return evidencePhotos.filter(
      (p) =>
        p.routeCode.toLowerCase().includes(t) ||
        p.driverName.toLowerCase().includes(t) ||
        p.vehiclePlate.toLowerCase().includes(t) ||
        p.clientName.toLowerCase().includes(t) ||
        p.orderCode.toLowerCase().includes(t) ||
        p.description.toLowerCase().includes(t),
    );
  }, [evidencePhotos, search]);

  const routeList = useMemo(() => {
    const map = new Map<string, Omit<RouteListItem, 'code'>>();
    for (const p of searchFiltered) {
      const cur = map.get(p.routeCode);
      if (!cur) {
        map.set(p.routeCode, {
          routeId: p.routeId,
          routeName: p.routeName ?? '',
          routeStatus: normalizeRouteStatus(p.routeStatus ?? ''),
          driverName: p.driverName,
          fecha: p.fecha,
          photoCount: 1,
          orderCount: 0,
        });
      } else {
        cur.photoCount += 1;
      }
    }
    for (const [code, meta] of map) {
      meta.orderCount = new Set(
        searchFiltered.filter((p) => p.routeCode === code).map((p) => p.orderId),
      ).size;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, meta]) => ({ code, ...meta }));
  }, [searchFiltered]);

  const { routesDelivered, routesPending } = useMemo(() => {
    const delivered: RouteListItem[] = [];
    const pending: RouteListItem[] = [];
    for (const route of routeList) {
      if (isRouteDelivered(route.routeStatus)) delivered.push(route);
      else pending.push(route);
    }
    return { routesDelivered: delivered, routesPending: pending };
  }, [routeList]);

  const ordersInRoute = useMemo(() => {
    if (!selectedRoute) return [];
    const map = new Map<
      string,
      { orderId: string; clientName: string; orderStatus?: string; photoCount: number }
    >();
    for (const p of searchFiltered.filter((p) => p.routeCode === selectedRoute)) {
      const cur = map.get(p.orderCode);
      if (!cur) {
        map.set(p.orderCode, {
          orderId: p.orderId,
          clientName: p.clientName,
          orderStatus: p.orderStatus,
          photoCount: 1,
        });
      } else {
        cur.photoCount += 1;
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, meta]) => ({ code, ...meta }));
  }, [searchFiltered, selectedRoute]);

  const photosForOrder = useMemo(() => {
    if (!selectedRoute || !selectedOrder) return [];
    return searchFiltered.filter(
      (p) => p.routeCode === selectedRoute && p.orderCode === selectedOrder,
    );
  }, [searchFiltered, selectedRoute, selectedOrder]);

  const selectedRouteMeta = routeList.find((r) => r.code === selectedRoute);
  const selectedOrderMeta = ordersInRoute.find((o) => o.code === selectedOrder);

  useEffect(() => {
    if (routeList.length === 0) {
      setSelectedRoute(null);
      setSelectedOrder(null);
      return;
    }
    if (!selectedRoute || !routeList.some((r) => r.code === selectedRoute)) {
      setSelectedRoute(routeList[0].code);
    }
  }, [routeList, selectedRoute]);

  useEffect(() => {
    if (!selectedRoute) {
      setSelectedOrder(null);
      return;
    }
    if (ordersInRoute.length === 0) {
      setSelectedOrder(null);
      return;
    }
    if (!selectedOrder || !ordersInRoute.some((o) => o.code === selectedOrder)) {
      setSelectedOrder(ordersInRoute[0].code);
    }
  }, [selectedRoute, ordersInRoute, selectedOrder]);

  return (
    <div className="flex flex-col gap-3 -mt-1 min-h-[calc(100vh-7rem)]">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            name="photo-search"
            autoComplete="off"
            placeholder="Buscar ruta, pedido, cliente, chofer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 bg-white text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Buscar evidencias"
          />
        </div>
        {!loading && evidencePhotos.length > 0 && (
          <p className="text-xs text-stone-400 tabular-nums">
            {routesDelivered.length} entregada{routesDelivered.length !== 1 ? 's' : ''}
            &nbsp;·&nbsp;{routesPending.length} pendiente{routesPending.length !== 1 ? 's' : ''}
            &nbsp;·&nbsp;{photosForOrder.length} foto{photosForOrder.length !== 1 ? 's' : ''}{' '}
            {selectedOrder ? 'visibles' : ''}
          </p>
        )}
      </div>

      {loading && photos.length === 0 ? (
        <p className="text-sm text-stone-400 py-16 text-center">Cargando evidencias…</p>
      ) : routeList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 rounded-xl border border-stone-200 bg-white">
          <div className="p-4 bg-stone-100 rounded-2xl text-stone-400">
            <Camera size={32} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-stone-600">Sin evidencias de pedidos</p>
          <p className="text-sm text-stone-400 max-w-sm">
            {search
              ? 'No hay resultados para la búsqueda.'
              : 'Solo se muestran evidencias de pedidos entregados o rechazados, con datos alineados a rutas y pedidos en el sistema.'}
          </p>
        </div>
      ) : (
        <div
          className="flex flex-col lg:flex-row flex-1 min-h-[420px] rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden"
          role="application"
          aria-label="Explorador de evidencias por ruta y pedido"
        >
          {/* Columna 1: Rutas */}
          <div className="flex flex-col w-full lg:w-52 xl:w-56 border-b lg:border-b-0 lg:border-r border-stone-200 shrink-0 min-h-0 max-h-48 lg:max-h-none">
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
                onSelectRoute={(code) => {
                  setSelectedRoute(code);
                  setSelectedOrder(null);
                }}
              />
              <RouteListSection
                title="Rutas pendientes"
                routes={routesPending}
                selectedRoute={selectedRoute}
                onSelectRoute={(code) => {
                  setSelectedRoute(code);
                  setSelectedOrder(null);
                }}
              />
            </div>
          </div>

          {/* Columna 2: Pedidos */}
          <div className="flex flex-col w-full lg:w-52 xl:w-60 border-b lg:border-b-0 lg:border-r border-stone-200 shrink-0 min-h-0 max-h-48 lg:max-h-none">
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
                <p className="px-3 py-6 text-xs text-stone-400 text-center">Elige una ruta</p>
              ) : ordersInRoute.length === 0 ? (
                <p className="px-3 py-6 text-xs text-stone-400 text-center">Sin pedidos en esta ruta</p>
              ) : (
                ordersInRoute.map((order) => {
                  const active = selectedOrder === order.code;
                  return (
                    <button
                      key={order.code}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setSelectedOrder(order.code)}
                      className={clsx(
                        listItemBase,
                        active
                          ? 'bg-primary-50 border-l-2 border-l-primary-500'
                          : 'hover:bg-stone-50',
                      )}
                    >
                      <span className="font-mono text-xs font-bold text-stone-800 block">
                        {order.code}
                      </span>
                      {order.clientName && (
                        <span className="text-[11px] text-stone-500 truncate block mt-0.5">
                          {order.clientName}
                        </span>
                      )}
                      {order.orderStatus && (
                        <span className="text-[10px] text-stone-400 capitalize mt-0.5 block">
                          {order.orderStatus === 'delivered' ? 'Entregado' : 'Rechazado'}
                        </span>
                      )}
                      <span className="text-[10px] text-stone-400 tabular-nums mt-1 block">
                        {order.photoCount} foto{order.photoCount !== 1 ? 's' : ''}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Columna 3: Fotos */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0">
            <p className={panelHeader}>
              <span className="inline-flex items-center gap-1">
                <Camera size={12} aria-hidden />
                Evidencias
              </span>
            </p>

            {!selectedOrder ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <p className="text-sm text-stone-400 text-center">Elige un pedido para ver sus fotos</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/80 shrink-0">
                  <p className="text-[11px] text-stone-500 uppercase tracking-wide mb-1">Viendo</p>
                  {selectedRouteMeta?.routeName && (
                    <p className="text-xs text-stone-500 mb-1">{selectedRouteMeta.routeName}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {selectedRouteMeta && (
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full',
                          isRouteDelivered(selectedRouteMeta.routeStatus)
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-50 text-amber-900',
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
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-stone-800">
                      <MapPin size={14} className="text-stone-400" aria-hidden />
                      {selectedRoute}
                    </span>
                    <ChevronRight size={14} className="text-stone-300" aria-hidden />
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-primary-800">
                      <Package size={14} className="text-primary-500" aria-hidden />
                      {selectedOrder}
                    </span>
                    {selectedOrderMeta?.clientName && (
                      <span className="text-stone-600 text-xs">· {selectedOrderMeta.clientName}</span>
                    )}
                  </div>
                  {selectedRouteMeta?.driverName && (
                    <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                      <Truck size={11} aria-hidden />
                      {selectedRouteMeta.driverName}
                      {photosForOrder[0]?.vehiclePlate && (
                        <span translate="no">&nbsp;·&nbsp;{photosForOrder[0].vehiclePlate}</span>
                      )}
                    </p>
                  )}
                </div>

                <div
                  className="flex-1 overflow-y-auto overscroll-y-contain p-4"
                  role="list"
                  aria-label={`Fotos del pedido ${selectedOrder}`}
                >
                  <div className="flex flex-wrap gap-3">
                    {photosForOrder.map((photo, i) => (
                      <button
                        key={photo.id}
                        type="button"
                        role="listitem"
                        onClick={() => setLightbox({ photos: photosForOrder, index: i })}
                        aria-label={`Ver evidencia ${i + 1}`}
                        className="group relative w-32 h-24 rounded-lg overflow-hidden border border-stone-200 hover:border-primary-400 transition-all hover:scale-[1.02] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
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
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onIndexChange={(next) =>
            setLightbox((prev) => (prev ? { ...prev, index: next } : prev))
          }
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
