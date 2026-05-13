import { useEffect, useState, useMemo } from 'react';
import {
  ChevronDown, ChevronRight, Search, X, ZoomIn,
  Download, Truck, Calendar, User, Package, Camera,
  ChevronLeft, AlertTriangle, FileSignature, ImageIcon
} from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';
import type { RoutePhoto, PhotoType } from '../../types';
import { clsx } from 'clsx';

// ─── Photo type config ────────────────────────────────────────────────────────
const typeConfig: Record<PhotoType, { label: string; color: string; icon: React.ReactNode }> = {
  entrega:   { label: 'Entrega',   color: 'bg-emerald-100 text-emerald-700', icon: <Package size={11} /> },
  recepcion: { label: 'Recepción', color: 'bg-blue-100 text-blue-700',       icon: <Camera size={11} /> },
  dano:      { label: 'Daño',      color: 'bg-red-100 text-red-700',         icon: <AlertTriangle size={11} /> },
  firma:     { label: 'Firma',     color: 'bg-violet-100 text-violet-700',   icon: <FileSignature size={11} /> },
  otro:      { label: 'Otro',      color: 'bg-stone-100 text-stone-600',     icon: <ImageIcon size={11} /> },
};

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: RoutePhoto[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}) {
  const idx = Math.min(Math.max(index, 0), photos.length - 1);
  const photo = photos[idx];
  const cfg = typeConfig[photo.type];

  const prev = () => onIndexChange(Math.max(0, idx - 1));
  const next = () => onIndexChange(Math.min(photos.length - 1, idx + 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-sm p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={20} />
      </button>

      {/* Prev */}
      {idx > 0 && (
        <button
          onClick={prev}
          className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Next */}
      {idx < photos.length - 1 && (
        <button
          onClick={next}
          className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronDown size={22} className="rotate-[-90deg]" />
        </button>
      )}

      <div className="flex flex-col items-center gap-4 max-w-3xl w-full">
        {/* Image */}
        <div className="relative rounded-xl overflow-hidden shadow-2xl bg-stone-900 max-h-[65vh]">
          <img
            src={photo.photoUrl}
            alt={photo.description}
            className="max-h-[65vh] w-auto object-contain"
            onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/400x300/e7e5e4/a8a29e?text=Foto`; }}
          />
          {/* Type badge overlay */}
          <div className="absolute top-3 left-3">
            <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold shadow', cfg.color)}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <div className="absolute bottom-3 right-3 text-xs text-white/60 bg-black/40 px-2 py-1 rounded-full">
            {idx + 1} / {photos.length}
          </div>
        </div>

        {/* Meta */}
        <div className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
          <p className="text-sm font-semibold mb-2">{photo.description}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/70">
            <span className="flex items-center gap-1.5"><Truck size={12} />{photo.driverName} · {photo.vehiclePlate}</span>
            <span className="flex items-center gap-1.5"><Calendar size={12} />{photo.fecha} {photo.hora}</span>
            {photo.clientName && <span className="flex items-center gap-1.5"><User size={12} />{photo.clientName}</span>}
            {photo.orderCode && <span className="flex items-center gap-1.5"><Package size={12} />{photo.orderCode}</span>}
          </div>
        </div>

        {/* Thumbnails strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === idx}
              onClick={() => onIndexChange(i)}
              className={clsx(
                'flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all',
                i === idx ? 'border-white scale-105' : 'border-white/20 hover:border-white/50'
              )}
            >
              <img
                src={p.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/80x60/e7e5e4/a8a29e?text=F`; }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Route Group Row ──────────────────────────────────────────────────────────
function RouteGroup({
  routeCode, photos, onViewPhoto,
}: {
  routeCode: string;
  photos: RoutePhoto[];
  onViewPhoto: (photos: RoutePhoto[], index: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const driver = photos[0]?.driverName ?? '';
  const plate  = photos[0]?.vehiclePlate ?? '';

  return (
    <div>
      {/* Group header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-stone-100 border-y border-stone-200 cursor-pointer hover:bg-stone-200/60 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <span aria-hidden="true" className="text-stone-400">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>
        <span className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
          Nº Ruta: {routeCode}
        </span>
        <span className="ml-2 flex items-center gap-1.5 text-xs text-stone-500">
          <Truck size={12} aria-hidden="true" />{driver} · {plate}
        </span>
        <span className="ml-auto text-[11px] text-stone-400 font-medium tabular-nums">
          {photos.length} foto{photos.length !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Rows */}
      {open && photos.map((photo, i) => {
        const cfg = typeConfig[photo.type];
        return (
          <div
            key={photo.id}
            className={clsx(
              'flex items-center border-b border-stone-100 hover:bg-primary-50/40 transition-colors',
              i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'
            )}
          >
            {/* Actions */}
            <div className="flex items-center gap-1.5 px-3 py-2.5 flex-shrink-0 w-24">
              <button
                className="size-5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
                title="Eliminar"
              >
                <X size={11} />
              </button>
              <button
                onClick={() => onViewPhoto(photos, i)}
                className="size-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
                title="Ver foto"
              >
                <ZoomIn size={11} />
              </button>
              <button
                className="size-5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
                title="Descargar"
              >
                <Download size={11} />
              </button>
            </div>

            {/* Nº Ruta */}
            <td className="px-3 py-2.5 w-28 flex-shrink-0">
              <span className="font-mono text-xs font-semibold text-stone-600">{routeCode}</span>
            </td>

            {/* Nombre */}
            <td className="px-3 py-2.5 flex-1 min-w-[140px]">
              <span className="text-xs font-semibold text-stone-700">{photo.driverName}</span>
            </td>

            {/* Tipo */}
            <td className="px-3 py-2.5 w-28 flex-shrink-0">
              <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium', cfg.color)}>
                {cfg.icon}{cfg.label}
              </span>
            </td>

            {/* Descripción */}
            <td className="px-3 py-2.5 flex-1 min-w-[160px]">
              <span className="text-xs text-stone-500 truncate block max-w-[220px]">{photo.description}</span>
            </td>

            {/* Pedido */}
            <td className="px-3 py-2.5 w-32 flex-shrink-0">
              <span className="font-mono text-[11px] text-stone-400">{photo.orderCode || '—'}</span>
            </td>

            {/* Fecha */}
            <td className="px-3 py-2.5 w-28 flex-shrink-0">
              <span className="text-xs text-stone-500 whitespace-nowrap">{photo.fecha} {photo.hora}</span>
            </td>

            {/* Imagen thumbnail */}
            <td className="px-3 py-2.5 w-20 flex-shrink-0">
              <button
                onClick={() => onViewPhoto(photos, i)}
                className="relative group block w-14 h-10 rounded-lg overflow-hidden border border-stone-200 hover:border-primary-400 transition-all hover:scale-105 shadow-sm"
              >
                <img
                  src={photo.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/80x60/e7e5e4/a8a29e?text=F`; }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </td>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function PhotosPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<PhotoType | 'all'>('all');
  const [lightbox, setLightbox] = useState<{ photos: RoutePhoto[]; index: number } | null>(null);
  const { photos, fetchPhotos } = usePhotoStore();

  useEffect(() => {
    void fetchPhotos();
  }, [fetchPhotos]);

  const filtered = useMemo(() => {
    return photos.filter(p => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (search) {
        const t = search.toLowerCase();
        return (
          p.routeCode.toLowerCase().includes(t) ||
          p.driverName.toLowerCase().includes(t) ||
          p.clientName.toLowerCase().includes(t) ||
          p.orderCode.toLowerCase().includes(t) ||
          p.description.toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [photos, search, filterType]);

  // Group by routeCode, preserving order
  const groups = useMemo(() => {
    const map = new Map<string, RoutePhoto[]>();
    filtered.forEach(p => {
      if (!map.has(p.routeCode)) map.set(p.routeCode, []);
      map.get(p.routeCode)!.push(p);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const typeOptions: { value: PhotoType | 'all'; label: string }[] = [
    { value: 'all',       label: 'Todos los tipos' },
    { value: 'entrega',   label: 'Entrega' },
    { value: 'recepcion', label: 'Recepción' },
    { value: 'dano',      label: 'Daño' },
    { value: 'firma',     label: 'Firma' },
    { value: 'otro',      label: 'Otro' },
  ];

  const typeCounts = useMemo(() =>
    Object.fromEntries(
      (['entrega', 'recepcion', 'dano', 'firma', 'otro'] as PhotoType[]).map(t => [
        t, photos.filter(p => p.type === t).length,
      ])
    ),
  [photos]);

  return (
    <div className="space-y-4 -mt-1">
      {/* Stats chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['entrega', 'recepcion', 'dano', 'firma', 'otro'] as PhotoType[]).map(t => {
          const cfg = typeConfig[t];
          const active = filterType === t;
          return (
            <button
              key={t}
              onClick={() => setFilterType(active ? 'all' : t)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                active
                  ? clsx(cfg.color, 'border-transparent shadow-sm')
                  : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
              )}
            >
              {cfg.icon} {cfg.label}
              <span className={clsx('ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                active ? 'bg-white/60' : 'bg-stone-100 text-stone-500'
              )}>
                {typeCounts[t]}
              </span>
            </button>
          );
        })}
        <div className="flex-1" />
        <span className="text-xs text-stone-400">
          {filtered.length} foto{filtered.length !== 1 ? 's' : ''} en {groups.length} ruta{groups.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por ruta, chofer, pedido..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as PhotoType | 'all')}
          className="bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
        >
          {typeOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {groups.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-stone-100 rounded-2xl text-stone-400 mb-4"><Camera size={32} /></div>
          <p className="text-base font-semibold text-stone-600 mb-1">Sin fotos</p>
          <p className="text-sm text-stone-400">No se encontraron fotos con los filtros aplicados</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="flex items-center bg-stone-50 border-b border-stone-200">
            <div className="w-24 px-4 py-2.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wide flex-shrink-0" />
            <div className="w-28 px-3 py-2.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wide flex-shrink-0">Nº Ruta</div>
            <div className="flex-1 px-3 py-2.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wide min-w-[140px]">Nombre</div>
            <div className="w-28 px-3 py-2.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wide flex-shrink-0">Tipo</div>
            <div className="flex-1 px-3 py-2.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wide min-w-[160px]">Descripción</div>
            <div className="w-32 px-3 py-2.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wide flex-shrink-0">Pedido</div>
            <div className="w-28 px-3 py-2.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wide flex-shrink-0 flex items-center gap-1">
              Fecha <span className="text-stone-300">↕</span>
            </div>
            <div className="w-20 px-3 py-2.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wide flex-shrink-0">Imagen</div>
          </div>

          {/* Groups */}
          {groups.map(([routeCode, photos]) => (
            <RouteGroup
              key={routeCode}
              routeCode={routeCode}
              photos={photos}
              onViewPhoto={(p, i) => setLightbox({ photos: p, index: i })}
            />
          ))}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-stone-100 bg-stone-50">
            <span className="text-xs text-stone-400">
              <strong className="text-stone-600">{filtered.length}</strong> fotos en{' '}
              <strong className="text-stone-600">{groups.length}</strong> rutas
            </span>
            <span className="text-xs text-stone-400">
              Daños registrados:{' '}
              <strong className="text-red-600">{filtered.filter(p => p.type === 'dano').length}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onIndexChange={(next) => setLightbox(prev => prev ? { ...prev, index: next } : prev)}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
