import { useEffect, useEffectEvent, useRef, useState } from 'react';
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

function EvidenceLightbox({
  photo,
  index,
  total,
  onClose,
  onIndexChange,
}: {
  photo: TrackingPhoto;
  index: number;
  total: number;
  onClose: () => void;
  onIndexChange: (n: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseEvent = useEffectEvent(onClose);
  const onIndexChangeEvent = useEffectEvent(onIndexChange);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onCloseEvent();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && index > 0) onIndexChangeEvent(index - 1);
      if (e.key === 'ArrowRight' && index < total - 1) onIndexChangeEvent(index + 1);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [index, total]);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label="Evidencia ampliada"
      className="fixed inset-0 z-[100] m-0 max-w-none max-h-none w-full h-full border-none bg-stone-950/95 p-4 open:flex items-center justify-center backdrop:bg-stone-950/95"
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <button
        type="button"
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Cerrar"
        onClick={onClose}
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
            onIndexChange(index - 1);
          }}
        >
          <ChevronLeft className="size-7" aria-hidden />
        </button>
      ) : null}
      {index < total - 1 ? (
        <button
          type="button"
          className="absolute right-3 sm:right-6 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Siguiente"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(index + 1);
          }}
        >
          <ChevronRight className="size-7" aria-hidden />
        </button>
      ) : null}
      <div className="relative z-10 max-w-3xl w-full flex flex-col items-center gap-3">
        <img
          src={normalizeMediaUrl(photo.url)}
          alt={typeLabel(photo.type)}
          className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
        />
        <p className="text-sm text-white/80 tabular-nums">
          {typeLabel(photo.type)} · {index + 1} / {total}
        </p>
      </div>
    </dialog>,
    document.body,
  );
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

  if (list.length === 0) return null;

  const open = index !== null ? list[index] : null;
  const thumbSize = compact ? 'size-14' : 'size-20 sm:size-24';

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
      {open && index !== null ? (
        <EvidenceLightbox
          photo={open}
          index={index}
          total={list.length}
          onClose={() => setIndex(null)}
          onIndexChange={setIndex}
        />
      ) : null}
    </div>
  );
}
