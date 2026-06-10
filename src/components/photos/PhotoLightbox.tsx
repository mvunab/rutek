import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Package, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import type { RoutePhoto } from '../../types';

const PLACEHOLDER_FULL =
  'https://placehold.co/400x300/292524/a8a29e?text=Imagen+no+disponible';
const PLACEHOLDER_THUMB =
  'https://placehold.co/80x60/292524/a8a29e?text=F';

export function PhotoLightbox({
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

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Evidencia — ${photo.orderCode}`}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/92 backdrop-blur-sm p-4 motion-reduce:backdrop-blur-none"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X size={20} aria-hidden />
      </button>

      {idx > 0 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(idx - 1);
          }}
          aria-label="Foto anterior"
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ChevronLeft size={22} aria-hidden />
        </button>
      ) : null}
      {idx < photos.length - 1 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(idx + 1);
          }}
          aria-label="Siguiente foto"
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ChevronRight size={22} aria-hidden />
        </button>
      ) : null}

      <div
        className="flex flex-col items-center gap-4 max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-xl overflow-hidden shadow-2xl bg-stone-900 max-h-[65vh]">
          <img
            src={photo.photoUrl}
            alt={photo.description || `Evidencia ${photo.orderCode}`}
            width={800}
            height={600}
            className="max-h-[65vh] w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_FULL;
            }}
          />
          <div className="absolute bottom-3 right-3 text-xs text-white/60 bg-black/40 px-2 py-1 rounded-full tabular-nums">
            {idx + 1}&nbsp;/&nbsp;{photos.length}
          </div>
        </div>

        <div className="w-full bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-white space-y-1.5 motion-reduce:backdrop-blur-none">
          {photo.description ? <p className="text-sm font-medium">{photo.description}</p> : null}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/70">
            <span className="flex items-center gap-1.5">
              <MapPin size={12} aria-hidden />
              Ruta&nbsp;<strong className="text-white font-mono">{photo.routeCode}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Package size={12} aria-hidden />
              <span className="font-mono">{photo.orderCode}</span>
              {photo.clientName ? <>&nbsp;·&nbsp;{photo.clientName}</> : null}
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
                'shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-[border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none',
                i === idx ? 'border-white scale-105' : 'border-white/20 hover:border-white/50',
              )}
            >
              <img
                src={p.thumbnailUrl || p.photoUrl}
                alt=""
                aria-hidden
                width={56}
                height={40}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_THUMB;
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
