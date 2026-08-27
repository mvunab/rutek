import {
  ArrowLeft, Download, Maximize2, Minimize2, Package, Pencil, Share2, Trash2, X,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { RouteDetailSidePanelProps } from './useRouteDetailSidePanel';

type Props = Pick<RouteDetailSidePanelProps, 'fullscreen' | 'onToggleFullscreen' | 'onClose'> & {
  canManage: boolean;
  trackingRouteOpen: boolean;
  setTrackingRouteOpen: (open: boolean) => void;
  handleExportRoute: () => void;
  editRouteOpen: boolean;
  setEditRouteOpen: (open: boolean) => void;
  setDeleteRouteOpen: (open: boolean) => void;
  deleteRouteBusy: boolean;
};

export function RouteDetailSidePanelHeader({
  onClose,
  fullscreen,
  onToggleFullscreen,
  canManage,
  trackingRouteOpen,
  setTrackingRouteOpen,
  handleExportRoute,
  editRouteOpen,
  setEditRouteOpen,
  setDeleteRouteOpen,
  deleteRouteBusy,
}: Props) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-200/70 dark:border-stone-800/70 bg-white/60 dark:bg-stone-950/35 backdrop-blur-md shrink-0 shadow-sm">
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-2 -ml-1 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Volver al listado"
            >
              <ArrowLeft size={20} aria-hidden />
            </button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Package size={16} className="text-primary-600 dark:text-primary-400 shrink-0" aria-hidden />
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">
                Detalle de ruta
              </span>
            </div>
            {onToggleFullscreen ? (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="hidden lg:flex shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                aria-pressed={fullscreen}
              >
                {fullscreen ? <Minimize2 size={18} aria-hidden /> : <Maximize2 size={18} aria-hidden />}
              </button>
            ) : null}
            {canManage ? (
              <button
                type="button"
                onClick={() => setTrackingRouteOpen(true)}
                className={clsx(
                  'shrink-0 rounded-lg p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors',
                  trackingRouteOpen
                    ? 'text-primary-700 bg-primary-100 dark:text-primary-200 dark:bg-primary-950/50'
                    : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200',
                )}
                aria-label="Enviar seguimiento de ruta"
                aria-pressed={trackingRouteOpen}
                title={trackingRouteOpen ? 'Seguimiento (activo)' : 'Enviar seguimiento de ruta'}
              >
                <Share2 size={18} aria-hidden />
              </button>
            ) : null}
            {canManage ? (
              <button
                type="button"
                onClick={() => void handleExportRoute()}
                className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Exportar Excel de esta ruta"
                title="Exportar Excel de esta ruta"
              >
                <Download size={18} aria-hidden />
              </button>
            ) : null}
            {canManage ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditRouteOpen(true)}
                  className={clsx(
                    'shrink-0 rounded-lg p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors',
                    editRouteOpen
                      ? 'text-primary-700 bg-primary-100 dark:text-primary-200 dark:bg-primary-950/50'
                      : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200',
                  )}
                  aria-label="Editar ruta"
                  aria-pressed={editRouteOpen}
                  title={editRouteOpen ? 'Editar (activo)' : 'Editar ruta'}
                >
                  <Pencil size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteRouteOpen(true)}
                  disabled={deleteRouteBusy}
                  className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
                  aria-label="Eliminar ruta"
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="hidden lg:flex shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Cerrar panel"
            >
              <X size={18} aria-hidden />
            </button>
    </div>
  );
}
