import { useState } from 'react';
import { Search, Camera } from 'lucide-react';
import type { RoutePhoto } from '../../types';
import { PhotoLightbox } from '../../components/photos/PhotoLightbox';
import { PhotosExplorer } from './PhotosExplorer';
import { usePhotosPageData } from './usePhotosPageData';

export function PhotosPage() {
  const [lightbox, setLightbox] = useState<{ photos: RoutePhoto[]; index: number } | null>(null);
  const {
    search,
    setSearch,
    selectedRoute,
    selectedOrder,
    setSelectedOrder,
    selectRoute,
    loading,
    photos,
    evidencePhotos,
    routeList,
    routesDelivered,
    routesPending,
    ordersInRoute,
    photosForOrder,
    selectedRouteMeta,
    selectedOrderMeta,
  } = usePhotosPageData();

  return (
    <div className="flex flex-col gap-3 -mt-1 min-h-[calc(100vh-7rem)]">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            name="photo-search"
            autoComplete="off"
            placeholder="Buscar ruta, pedido, cliente, chofer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300/80 dark:border-stone-700/70 bg-white/70 dark:bg-stone-950/40 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 shadow-sm backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Buscar evidencias"
          />
        </div>
        {!loading && evidencePhotos.length > 0 && (
          <p className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
            {routesDelivered.length} entregada{routesDelivered.length !== 1 ? 's' : ''}
            &nbsp;·&nbsp;{routesPending.length} pendiente{routesPending.length !== 1 ? 's' : ''}
            &nbsp;·&nbsp;{photosForOrder.length} foto{photosForOrder.length !== 1 ? 's' : ''}{' '}
            {selectedOrder ? 'visibles' : ''}
          </p>
        )}
      </div>

      {loading && photos.length === 0 ? (
        <p className="text-sm text-stone-400 dark:text-stone-500 py-16 text-center">Cargando evidencias…</p>
      ) : routeList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80">
          <div className="p-4 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-400 dark:text-stone-500">
            <Camera size={32} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">Sin evidencias de pedidos</p>
          <p className="text-sm text-stone-400 dark:text-stone-500 max-w-sm">
            {search
              ? 'No hay resultados para la búsqueda.'
              : 'Solo se muestran evidencias de pedidos entregados o rechazados, con datos alineados a rutas y pedidos en el sistema.'}
          </p>
        </div>
      ) : (
        <PhotosExplorer
          routesDelivered={routesDelivered}
          routesPending={routesPending}
          selectedRoute={selectedRoute}
          onSelectRoute={selectRoute}
          ordersInRoute={ordersInRoute}
          selectedOrder={selectedOrder}
          onSelectOrder={setSelectedOrder}
          selectedRouteMeta={selectedRouteMeta}
          selectedOrderMeta={selectedOrderMeta}
          photosForOrder={photosForOrder}
          onOpenLightbox={(photos, index) => setLightbox({ photos, index })}
        />
      )}

      {lightbox ? (
        <PhotoLightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onIndexChange={(next) =>
            setLightbox((prev) => (prev ? { ...prev, index: next } : prev))
          }
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </div>
  );
}
