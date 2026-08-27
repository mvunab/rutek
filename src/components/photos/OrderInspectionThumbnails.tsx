import { Camera, ZoomIn } from 'lucide-react';
import type { RoutePhoto } from '../../types';

const PLACEHOLDER_THUMB =
  'https://placehold.co/64x48/e7e5e4/a8a29e?text=F';

export function OrderInspectionThumbnails({
  photos,
  onPhotoClick,
  className,
}: {
  photos: RoutePhoto[];
  onPhotoClick: (index: number) => void;
  className?: string;
}) {
  if (photos.length === 0) return null;

  return (
    <div
      className={[
        'rounded-lg border border-emerald-200/70 dark:border-emerald-900/45 bg-emerald-50/50 dark:bg-emerald-950/25 px-2 py-1.5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1.5">
        <Camera size={10} aria-hidden />
        Inspección
        <span className="font-normal normal-case tracking-normal text-emerald-600/80 dark:text-emerald-500/80 tabular-nums">
          ({photos.length})
        </span>
      </p>
      <ul
        className="flex flex-wrap gap-1.5"
        aria-label={`${photos.length} foto${photos.length === 1 ? '' : 's'} de inspección`}
      >
        {photos.map((photo, index) => (
          <li key={photo.id}>
          <button
            type="button"
            onClick={() => onPhotoClick(index)}
            aria-label={
              photo.description?.trim()
                ? `Ampliar: ${photo.description}`
                : `Ampliar evidencia ${index + 1} de ${photos.length}`
            }
            className="group relative w-12 h-9 shrink-0 rounded-md overflow-hidden border border-emerald-200/90 dark:border-emerald-800/70 bg-stone-100 dark:bg-stone-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-[border-color,transform] duration-150 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <img
              src={photo.thumbnailUrl || photo.photoUrl}
              alt=""
              aria-hidden
              loading="lazy"
              width={48}
              height={36}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_THUMB;
              }}
            />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center motion-reduce:transition-none">
              <ZoomIn
                size={14}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:opacity-100"
                aria-hidden
              />
            </span>
          </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
