import { useEffect, useRef, useState } from 'react';
import { X, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { useToastStore, type Toast, type ToastSeverity } from '../../store/useToastStore';

// ─── config por severidad ────────────────────────────────────────────────────

const CONFIG: Record<
  ToastSeverity,
  { icon: React.ReactNode; bar: string; bg: string; border: string; title: string; desc: string; close: string }
> = {
  info: {
    icon: <Info size={16} aria-hidden />,
    bar: 'bg-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    border: 'border-blue-200 dark:border-blue-800',
    title: 'text-blue-900 dark:text-blue-100',
    desc: 'text-blue-700 dark:text-blue-300',
    close: 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200',
  },
  warning: {
    icon: <AlertTriangle size={16} aria-hidden />,
    bar: 'bg-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-800',
    title: 'text-amber-900 dark:text-amber-100',
    desc: 'text-amber-700 dark:text-amber-300',
    close: 'text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200',
  },
  error: {
    icon: <AlertCircle size={16} aria-hidden />,
    bar: 'bg-red-500',
    bg: 'bg-red-50 dark:bg-red-950/60',
    border: 'border-red-200 dark:border-red-800',
    title: 'text-red-900 dark:text-red-100',
    desc: 'text-red-700 dark:text-red-300',
    close: 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200',
  },
};

// ─── ToastItem ────────────────────────────────────────────────────────────────

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const cfg = CONFIG[toast.severity];
  const duration = toast.duration ?? 5000;

  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Entrada con pequeño delay para que el CSS transite desde opacity-0
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 16);
    return () => clearTimeout(id);
  }, []);

  // Barra de progreso
  const [progress, setProgress] = useState(100);
  useEffect(() => {
    if (!duration) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) {
        timerRef.current = setTimeout(tick, 50);
      }
    };
    timerRef.current = setTimeout(tick, 50);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [duration]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => dismiss(toast.id), 250);
  };

  return (
    <div
      role="alert"
      aria-live={toast.severity === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity 200ms ease, transform 200ms ease',
      }}
      className={`relative w-full max-w-sm rounded-xl border shadow-lg overflow-hidden ${cfg.bg} ${cfg.border}`}
    >
      {/* Barra de progreso */}
      {duration > 0 && (
        <div
          className={`absolute top-0 left-0 h-0.5 ${cfg.bar} transition-none`}
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      )}

      <div className="flex gap-3 px-3.5 py-3">
        {/* Icono */}
        <span className={`shrink-0 mt-0.5 ${cfg.title}`}>{cfg.icon}</span>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug ${cfg.title}`}>
            {toast.title}
          </p>
          {toast.description && (
            <p className={`text-xs mt-0.5 leading-snug ${cfg.desc}`}>
              {toast.description}
            </p>
          )}
        </div>

        {/* Cerrar */}
        <button
          type="button"
          aria-label="Cerrar notificación"
          onClick={handleDismiss}
          className={`shrink-0 mt-0.5 p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 transition-colors ${cfg.close}`}
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    </div>
  );
}

// ─── ToastContainer ───────────────────────────────────────────────────────────

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notificaciones"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
      style={{ maxWidth: 'min(calc(100vw - 2rem), 24rem)' }}
    >
      {toasts.map((t) => (
        <div key={t.id} className="w-full pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
