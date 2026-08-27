import { formatRouteDisplayTitle } from '../../lib/routeSequence';
import { RouteDetailSidePanelHeader } from './RouteDetailSidePanelHeader';
import { RouteDetailSummaryCard } from './RouteDetailSummaryCard';
import { RouteDetailOrdersToolbar } from './RouteDetailOrdersToolbar';
import { RouteDetailOrdersList } from './RouteDetailOrdersList';
import { RouteDetailSidePanelModals } from './RouteDetailSidePanelModals';
import {
  useRouteDetailSidePanel,
  type RouteDetailSidePanelProps,
} from './useRouteDetailSidePanel';
import { RouteValuationPanel } from '../../components/pricing/RouteValuationPanel';

export function RouteDetailSidePanel({
  route,
  onClose,
  fullscreen,
  onToggleFullscreen,
}: RouteDetailSidePanelProps) {
  const s = useRouteDetailSidePanel({ route, onClose });

  return (
    <>
      <aside
        className="flex flex-col h-full min-h-0 w-full overflow-hidden bg-white/30 dark:bg-stone-950/20 backdrop-blur-md"
        aria-label={`Detalle de ruta ${formatRouteDisplayTitle(route)}`}
      >
        <RouteDetailSidePanelHeader
          {...s}
          onClose={onClose}
          fullscreen={fullscreen}
          onToggleFullscreen={onToggleFullscreen}
        />
        <div
          className="route-panel-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y px-3 pb-3 pt-2 space-y-2.5"
          aria-label="Detalle y pedidos de la ruta"
        >
          <RouteDetailSummaryCard {...s} />
          {s.assigned.length > 0 ? (
            <RouteValuationPanel
              routeId={route.id}
              canManage={s.canManage}
              refreshKey={s.valuationRefreshKey.length}
            />
          ) : null}
          <RouteDetailOrdersToolbar {...s} />
          <RouteDetailOrdersList {...s} />
        </div>
      </aside>
      <RouteDetailSidePanelModals {...s} />
    </>
  );
}
