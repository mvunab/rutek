import { useEffect, useRef } from 'react';
import { X, Info, AlertTriangle, AlertCircle, BellOff, CheckCheck, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useToastStore, type Notification, type ToastSeverity } from '../../store/useToastStore';

// ─── config por severidad ────────────────────────────────────────────────────

const SEV_CONFIG: Record<ToastSeverity, {
  icon: React.ReactNode;
  dot: string;
  iconClass: string;
  bg: string;
  titleClass: string;
  descClass: string;
}> = {
  info: {
    icon: <Info size={15} aria-hidden />,
    dot: 'bg-blue-500',
    iconClass: 'text-blue-500 dark:text-blue-400',
    bg: 'hover:bg-blue-50/60 dark:hover:bg-blue-950/30',
    titleClass: 'text-stone-800 dark:text-stone-100',
    descClass: 'text-stone-500 dark:text-stone-400',
  },
  warning: {
    icon: <AlertTriangle size={15} aria-hidden />,
    dot: 'bg-amber-400',
    iconClass: 'text-amber-500 dark:text-amber-400',
    bg: 'hover:bg-amber-50/60 dark:hover:bg-amber-950/30',
    titleClass: 'text-stone-800 dark:text-stone-100',
    descClass: 'text-stone-500 dark:text-stone-400',
  },
  error: {
    icon: <AlertCircle size={15} aria-hidden />,
    dot: 'bg-red-500',
    iconClass: 'text-red-500 dark:text-red-400',
    bg: 'hover:bg-red-50/60 dark:hover:bg-red-950/30',
    titleClass: 'text-stone-800 dark:text-stone-100',
    descClass: 'text-stone-500 dark:text-stone-400',
  },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'Ahora';
  const m = Math.floor(s / 60);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return `Hace ${d} día${d !== 1 ? 's' : ''}`;
}

// ─── NotificationItem ─────────────────────────────────────────────────────────

function NotificationItem({ n }: { n: Notification }) {
  const markRead = useToastStore((s) => s.markRead);
  const cfg = SEV_CONFIG[n.severity];

  return (
    <button
      type="button"
      onClick={() => markRead(n.id)}
      className={clsx(
        'w-full text-left flex gap-3 px-4 py-3.5 border-b border-stone-100 dark:border-stone-800',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
        cfg.bg,
        !n.read && 'bg-stone-50/80 dark:bg-stone-800/40',
      )}
      aria-label={`${n.title}${n.description ? ': ' + n.description : ''} — ${n.read ? 'leída' : 'no leída'}`}
    >
      {/* Icono */}
      <span className={clsx('shrink-0 mt-0.5', cfg.iconClass)}>{cfg.icon}</span>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={clsx('text-sm font-medium leading-snug', cfg.titleClass, !n.read && 'font-semibold')}>
            {n.title}
          </p>
          <span className="text-[10px] text-stone-400 dark:text-stone-500 shrink-0 mt-0.5 tabular-nums">
            {relativeTime(n.createdAt)}
          </span>
        </div>
        {n.description && (
          <p className={clsx('text-xs mt-0.5 leading-relaxed', cfg.descClass)}>
            {n.description}
          </p>
        )}
      </div>

      {/* Punto no leído */}
      {!n.read && (
        <span className={clsx('shrink-0 mt-2 size-2 rounded-full', cfg.dot)} aria-hidden />
      )}
    </button>
  );
}

// ─── NotificationCenter ───────────────────────────────────────────────────────

export function NotificationCenter({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const history = useToastStore((s) => s.history);
  const markAllRead = useToastStore((s) => s.markAllRead);
  const clearHistory = useToastStore((s) => s.clearHistory);
  const unread = useToastStore((s) => s.unreadCount());

  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Focus trap básico: enfocar el panel al abrir
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  // Marcar todas como leídas al abrir
  useEffect(() => {
    if (open && unread > 0) {
      const id = setTimeout(() => markAllRead(), 800);
      return () => clearTimeout(id);
    }
  }, [open, unread, markAllRead]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={clsx(
          'fixed inset-0 z-40 bg-black/20 dark:bg-black/40 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Drawer */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Centro de notificaciones"
        tabIndex={-1}
        className={clsx(
          'fixed top-0 right-0 z-50 h-full w-full max-w-sm',
          'flex flex-col bg-white dark:bg-stone-950',
          'border-l border-stone-200 dark:border-stone-800 shadow-2xl',
          'transition-transform duration-250 ease-in-out focus:outline-none',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Notificaciones</h2>
            {unread > 0 && (
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                {unread} sin leer
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                aria-label="Marcar todas como leídas"
                title="Marcar todas como leídas"
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <CheckCheck size={16} aria-hidden />
              </button>
            )}
            {history.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                aria-label="Eliminar todo el historial"
                title="Eliminar historial"
                className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar centro de notificaciones"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        </div>

        {/* Lista */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          aria-live="polite"
          aria-relevant="additions"
        >
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
              <BellOff size={32} className="text-stone-300 dark:text-stone-600" aria-hidden />
              <p className="text-sm text-stone-400 dark:text-stone-500">Sin notificaciones</p>
            </div>
          ) : (
            <ul role="list">
              {history.map((n) => (
                <li key={n.id}>
                  <NotificationItem n={n} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="shrink-0 px-4 py-3 border-t border-stone-100 dark:border-stone-800">
            <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
              {history.length} notificación{history.length !== 1 ? 'es' : ''} · Se guardan las últimas 100
            </p>
          </div>
        )}
      </div>
    </>
  );
}
