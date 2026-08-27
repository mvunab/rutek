import { LayoutList, Package, Route as RouteIcon } from 'lucide-react';

export function RouteDetailPlaceholder() {
  return (
    <div className="flex flex-1 min-h-0 flex-col items-center justify-center p-6">
      <div className="glass-card w-full max-w-sm p-8 text-center space-y-5">
        <div
          className="mx-auto size-14 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 flex items-center justify-center"
          aria-hidden
        >
          <RouteIcon size={28} className="text-stone-500 dark:text-stone-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">
            Selecciona una ruta
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 text-pretty leading-relaxed">
            El detalle, pedidos y asignaciones aparecerán en este panel.
          </p>
        </div>
        <ul className="text-left text-xs text-stone-500 dark:text-stone-400 space-y-2.5 pt-1">
          <li className="flex items-start gap-2">
            <LayoutList size={14} className="shrink-0 mt-0.5 text-primary-500" aria-hidden />
            <span>Haz clic en una ruta del listado central.</span>
          </li>
          <li className="flex items-start gap-2">
            <Package size={14} className="shrink-0 mt-0.5 text-primary-500" aria-hidden />
            <span>Gestiona pedidos, choferes y vehículos por entrega.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 w-3.5 h-3.5 rounded-sm border border-stone-300 dark:border-stone-600" aria-hidden />
            <span>Arrastra el borde izquierdo para ampliar este panel.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
