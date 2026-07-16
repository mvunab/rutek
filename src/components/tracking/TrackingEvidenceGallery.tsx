import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { normalizeMediaUrl } from '../../lib/mediaUrl';

export type TrackingPhoto = {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type?: string | null;
};

function typeLabel(type?: string | null): string {
  const t = (type ?? '').toLowerCase();
  if (t === 'firma' || t === 'signature') return 'Firma';
  return 'Evidencia';
}

export function TrackingEvidenceGallery({
  photos,
  title = 'Evidencias de entrega',
  compact = false,
}: {
  photos: TrackingPhoto[] | null | undefined;
  title?: string;
  /** Miniaturas más pequeñas (p. ej. lista de ruta). */
  compact?: boolean;
}) {
  const list = photos ?? [];
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (index === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      if (e.key === 'ArrowLeft' && index > 0) setIndex(index - 1);
      if (e.key === 'ArrowRight' && index < list.length - 1) setIndex(index + 1);
    };
    document.addEventListener('keydown', h);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', h);
    };
  }, [index, list.length]);

  if (list.length === 0) return null;

  const open = index !== null ? list[index] : null;
  const thumbSize = compact ? 'size-14' : 'size-20 sm:size-24';

  const lightbox =
    open && index !== null
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/95 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Evidencia ampliada"
            onClick={() => setIndex(null)}
          >
            <button
              type="button"
              className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Cerrar"
              onClick={() => setIndex(null)}
            >
              <X className="size-6" aria-hidden />
            </button>
            {index > 0 ? (
              <button
                type="button"
                className="absolute left-3 sm:left-6 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(index - 1);
                }}
              >
                <ChevronLeft className="size-7" aria-hidden />
              </button>
            ) : null}
            {index < list.length - 1 ? (
              <button
                type="button"
                className="absolute right-3 sm:right-6 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Siguiente"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(index + 1);
                }}
              >
                <ChevronRight className="size-7" aria-hidden />
              </button>
            ) : null}
            <div
              className="relative z-10 max-w-3xl w-full flex flex-col items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={normalizeMediaUrl(open.url)}
                alt={typeLabel(open.type)}
                className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
              />
              <p className="text-sm text-white/80 tabular-nums">
                {typeLabel(open.type)} · {index + 1} / {list.length}
              </p>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={compact ? 'mt-2' : 'mt-4 sm:col-span-2'}>
      <div className="flex items-center gap-2 mb-2">
        <Camera className={`shrink-0 text-stone-500 ${compact ? 'size-3.5' : 'size-4'}`} aria-hidden />
        <p className={`font-bold text-stone-600 ${compact ? 'text-[11px]' : 'text-sm'}`}>
          {title}
          <span className="font-normal text-stone-400 tabular-nums"> ({list.length})</span>
        </p>
      </div>
      <ul className="flex flex-wrap gap-2" role="list">
        {list.map((photo, i) => {
          const src = normalizeMediaUrl(photo.thumbnailUrl || photo.url);
          return (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className={`${thumbSize} rounded-lg overflow-hidden border border-stone-200 bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500`}
                aria-label={`Ver ${typeLabel(photo.type)} ${i + 1} de ${list.length}`}
              >
                <img
                  src={src}
                  alt=""
                  className="size-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://placehold.co/96x96/e7e5e4/78716c?text=Foto';
                  }}
                />
              </button>
            </li>
          );
        })}
      </ul>
      {lightbox}
    </div>
  );
}
