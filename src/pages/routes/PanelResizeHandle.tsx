import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { clsx } from 'clsx';

export function PanelResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    lastX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const delta = lastX.current - e.clientX; // arrastrar izquierda = panel más ancho
    lastX.current = e.clientX;
    onResize(delta);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      role="separator"
      aria-label="Ajustar ancho del panel de detalle"
      aria-orientation="vertical"
      tabIndex={0}
      className={clsx(
        'hidden lg:flex items-center justify-center',
        'w-3 shrink-0 self-stretch cursor-col-resize select-none',
        'group relative z-10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onResize(-16);
        if (e.key === 'ArrowRight') onResize(16);
      }}
    >
      <div className="w-px h-full bg-stone-200/80 dark:bg-stone-800 group-hover:bg-primary-400 dark:group-hover:bg-primary-500 transition-[background-color] duration-150" />
      <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
        <div className="w-0.5 h-3 rounded-full bg-stone-400 dark:bg-stone-500 group-hover:bg-primary-500" />
        <div className="w-1 h-6 rounded-full bg-stone-300 dark:bg-stone-600 group-hover:bg-primary-400 dark:group-hover:bg-primary-500 transition-[background-color] duration-150" />
        <div className="w-0.5 h-3 rounded-full bg-stone-400 dark:bg-stone-500 group-hover:bg-primary-500" />
      </div>
    </div>
  );
}
