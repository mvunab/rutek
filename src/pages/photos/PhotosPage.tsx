import { useEffect, useState, useMemo } from 'react';
import {
  Search, X, ZoomIn, Truck, Calendar,
  Package, Camera, ChevronLeft, ChevronRight, ChevronDown,
  MapPin,
} from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';
import type { RoutePhoto } from '../../types';
import { clsx } from 'clsx';

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
      if (e.key === 'ArrowLeft'  && idx > 0)                 onIndexChange(idx - 1);
      if (e.key === 'ArrowRight' && idx < photos.length - 1) onIndexChange(idx + 1);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [idx, photos.length, onIndexChange, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Evidencia — ${photo.orderCode || `ruta ${photo.routeCode}`}`}
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
        <button onClick={() => onIndexChange(idx - 1)} aria-label="Foto anterior"
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <ChevronLeft size={22} aria-hidden />
        </button>
      )}
      {idx < photos.length - 1 && (
        <button onClick={() => onIndexChange(idx + 1)} aria-label="Siguiente foto"
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <ChevronRight size={22} aria-hidden />
        </button>
      )}

      <div className="flex flex-col items-center gap-4 max-w-3xl w-full">
        <div className="relative rounded-xl overflow-hidden shadow-2xl bg-stone-900 max-h-[65vh]">
          <img
            src={photo.photoUrl}
            alt={photo.description || `Evidencia ${photo.orderCode || photo.routeCode}`}
            className="max-h-[65vh] w-auto object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/292524/a8a29e?text=Imagen+no+disponible'; }}
          />
          <div className="absolute bottom-3 right-3 text-xs text-white/60 bg-black/40 px-2 py-1 rounded-full tabular-nums">
            {idx + 1}&nbsp;/&nbsp;{photos.length}
          </div>
        </div>

        <div className="w-full bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-white space-y-1.5">
          {photo.description && <p className="text-sm font-medium">{photo.description}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/70">
            <span className="flex items-center gap-1.5">
              <Truck size={12} aria-hidden />
              Ruta&nbsp;<strong className="text-white">{photo.routeCode}</strong>
              {photo.driverName && <>&nbsp;·&nbsp;{photo.driverName}</>}
              {photo.vehiclePlate && <>&nbsp;·&nbsp;<span translate="no">{photo.vehiclePlate}</span></>}
            </span>
            {photo.clientName && (
              <span className="flex items-center gap-1.5">
                <Package size={12} aria-hidden />
                {photo.clientName}
                {photo.orderCode && <>&nbsp;·&nbsp;<span className="font-mono">{photo.orderCode}</span></>}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={12} aria-hidden />
              {photo.fecha}&nbsp;{photo.hora}
            </span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full" role="list" aria-label="Miniaturas">
          {photos.map((p, i) => (
            <button key={p.id} type="button" role="listitem"
              aria-label={`Ver foto ${i + 1}`} aria-pressed={i === idx}
              onClick={() => onIndexChange(i)}
              className={clsx(
                'flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                i === idx ? 'border-white scale-105' : 'border-white/20 hover:border-white/50',
              )}
            >
              <img src={p.thumbnailUrl} alt="" aria-hidden className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x60/292524/a8a29e?text=F'; }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta de pedido (nivel 2) ──────────────────────────────────────────────

function OrderCard({
  orderCode,
  clientName,
  photos,
  onView,
}: {
  orderCode: string;
  clientName: string;
  photos: RoutePhoto[];
  onView: (photos: RoutePhoto[], index: number) => void;
}) {
  const isGeneral = orderCode === '__general__';

  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
      {/* Cabecera del pedido */}
      <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border-b border-stone-200">
        <Package size={13} aria-hidden className="text-stone-400 shrink-0" />
        {isGeneral ? (
          <span className="text-xs text-stone-400 italic">Fotos generales de ruta</span>
        ) : (
          <>
            <span className="font-mono text-xs font-semibold text-stone-700">{orderCode}</span>
            {clientName && (
              <span className="text-xs text-stone-500 truncate min-w-0">&nbsp;·&nbsp;{clientName}</span>
            )}
          </>
        )}
        <span className="ml-auto text-[11px] text-stone-400 tabular-nums shrink-0">
          {photos.length}&nbsp;foto{photos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid de fotos */}
      <div className="p-3 flex flex-wrap gap-2" role="list" aria-label={isGeneral ? 'Fotos generales' : `Fotos del pedido ${orderCode}`}>
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            role="listitem"
            onClick={() => onView(photos, i)}
            aria-label={`Ver foto ${i + 1}${isGeneral ? '' : ` del pedido ${orderCode}`}`}
            className="group relative w-20 h-16 rounded-md overflow-hidden border border-stone-200 hover:border-primary-400 transition-all hover:scale-105 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <img
              src={photo.thumbnailUrl}
              alt=""
              aria-hidden
              loading="lazy"
              width={80}
              height={64}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x64/e7e5e4/a8a29e?text=F'; }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn size={15} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" aria-hidden />
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1 py-0.5">
              <span className="text-[9px] text-white/80 tabular-nums">{photo.hora}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tarjeta de ruta (nivel 1) ────────────────────────────────────────────────

function RouteCard({
  routeCode,
  photos,
  onView,
}: {
  routeCode: string;
  photos: RoutePhoto[];
  onView: (photos: RoutePhoto[], index: number) => void;
}) {
  const [open, setOpen] = useState(true);

  const driver = photos[0]?.driverName   ?? '';
  const plate  = photos[0]?.vehiclePlate ?? '';
  const fecha  = photos[0]?.fecha        ?? '';

  const orderGroups = useMemo(() => {
    const map = new Map<string, RoutePhoto[]>();
    for (const p of photos) {
      const key = p.orderCode || '__general__';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    const entries = Array.from(map.entries());
    entries.sort(([a], [b]) => {
      if (a === '__general__') return 1;
      if (b === '__general__') return -1;
      return a.localeCompare(b);
    });
    return entries;
  }, [photos]);

  const pedidoCount = orderGroups.filter(([k]) => k !== '__general__').length;

  return (
    <div className="rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      {/* ── Cabecera de ruta (nivel 1) ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-start gap-3 px-4 py-3.5 bg-stone-700 hover:bg-stone-600 transition-colors text-left select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
      >
        {/* Ícono ruta */}
        <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <MapPin size={15} className="text-white/80" aria-hidden />
        </div>

        {/* Datos de ruta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">
            Ruta&nbsp;<span className="font-mono">{routeCode}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-white/70">
            {driver && (
              <span className="flex items-center gap-1">
                <Truck size={11} aria-hidden className="shrink-0" />
                {driver}
                {plate && <>&nbsp;<span translate="no">{plate}</span></>}
              </span>
            )}
            {fecha && (
              <span className="flex items-center gap-1">
                <Calendar size={11} aria-hidden />
                {fecha}
              </span>
            )}
          </div>
        </div>

        {/* Contadores + chevron */}
        <div className="shrink-0 flex items-center gap-3 text-white/60 text-xs tabular-nums mt-0.5">
          <span>{pedidoCount}&nbsp;pedido{pedidoCount !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{photos.length}&nbsp;foto{photos.length !== 1 ? 's' : ''}</span>
          <ChevronDown
            size={15}
            aria-hidden
            className={clsx('transition-transform duration-150 text-white/50', !open && '-rotate-90')}
          />
        </div>
      </button>

      {/* ── Pedidos y sus fotos (niveles 2 y 3) ── */}
      {open && (
        <div className="p-3 bg-stone-50 space-y-2">
          {orderGroups.map(([key, orderPhotos]) => (
            <OrderCard
              key={key}
              orderCode={key}
              clientName={orderPhotos[0]?.clientName ?? ''}
              photos={orderPhotos}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export function PhotosPage() {
  const [search, setSearch] = useState('');
  const [lightbox, setLightbox] = useState<{ photos: RoutePhoto[]; index: number } | null>(null);
  const { photos, loading, fetchPhotos } = usePhotoStore();

  useEffect(() => { void fetchPhotos(); }, [fetchPhotos]);

  const filtered = useMemo(() => {
    if (!search.trim()) return photos;
    const t = search.toLowerCase();
    return photos.filter((p) =>
      p.routeCode.toLowerCase().includes(t) ||
      p.driverName.toLowerCase().includes(t) ||
      p.vehiclePlate.toLowerCase().includes(t) ||
      p.clientName.toLowerCase().includes(t) ||
      p.orderCode.toLowerCase().includes(t) ||
      p.description.toLowerCase().includes(t),
    );
  }, [photos, search]);

  const routeGroups = useMemo(() => {
    const map = new Map<string, RoutePhoto[]>();
    for (const p of filtered) {
      if (!map.has(p.routeCode)) map.set(p.routeCode, []);
      map.get(p.routeCode)!.push(p);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const orderCount = useMemo(() => {
    return new Set(filtered.map((p) => p.orderCode).filter(Boolean)).size;
  }, [filtered]);

  return (
    <div className="space-y-4 -mt-1">
      {/* Buscador */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" aria-hidden />
          <input
            type="search"
            name="photo-search"
            autoComplete="off"
            placeholder="Buscar por ruta, chofer, patente, pedido…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shadow-sm"
            aria-label="Buscar fotos de evidencia"
          />
        </div>
        {!loading && photos.length > 0 && (
          <p className="text-xs text-stone-400 tabular-nums shrink-0">
            {routeGroups.length}&nbsp;ruta{routeGroups.length !== 1 ? 's' : ''}
            &nbsp;·&nbsp;{orderCount}&nbsp;pedido{orderCount !== 1 ? 's' : ''}
            &nbsp;·&nbsp;{filtered.length}&nbsp;foto{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Lista de rutas */}
      {loading && photos.length === 0 ? (
        <p className="text-sm text-stone-400 py-12 text-center">Cargando evidencias…</p>
      ) : routeGroups.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="p-4 bg-stone-100 rounded-2xl text-stone-400">
            <Camera size={32} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-stone-600">Sin fotos de evidencia</p>
          <p className="text-sm text-stone-400 max-w-xs">
            {search
              ? 'No hay fotos que coincidan con la búsqueda.'
              : 'Las fotos tomadas por choferes y peonetas al entregar pedidos aparecerán aquí, agrupadas por ruta y pedido.'}
          </p>
        </div>
      ) : (
        <div
          className="space-y-3"
          role="region"
          aria-label="Evidencias por ruta y pedido"
        >
          {routeGroups.map(([routeCode, routePhotos]) => (
            <RouteCard
              key={routeCode}
              routeCode={routeCode}
              photos={routePhotos}
              onView={(p, i) => setLightbox({ photos: p, index: i })}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onIndexChange={(next) => setLightbox((prev) => prev ? { ...prev, index: next } : prev)}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
