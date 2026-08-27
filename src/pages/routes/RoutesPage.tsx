import { clsx } from 'clsx';
import { Modal, TypeToConfirmModal } from '../../components/ui/Modal';
import { ImportExcelModal } from '../../modules/operations/route-import/ImportExcelModal';
import { formatRouteDisplayLabel, suggestNextRouteSequence } from '../../lib/routeSequence';
import { RouteDetailPlaceholder } from './RouteDetailPlaceholder';
import { RouteDetailSidePanel } from './RouteDetailSidePanel';
import { RouteForm } from './RouteForm';
import { PanelResizeHandle } from './PanelResizeHandle';
import { RoutesPageToolbar } from './RoutesPageToolbar';
import { RoutesPageFiltersPanel } from './RoutesPageFiltersPanel';
import { RoutesPageBulkDeleteBar } from './RoutesPageBulkDeleteBar';
import { RoutesPageListSection } from './RoutesPageListSection';
import { useRoutesPage } from './useRoutesPage';

export function RoutesPage() {
  const s = useRoutesPage();
  const {
    showFilters,
    bulkDeleteMode,
    filteredRoutes,
    panelFullscreenActive,
    selectedRoute,
    closeDetailPanel,
    detailPanelFullscreen,
    setDetailPanelFullscreen,
    detailPanelWidth,
    handlePanelResize,
    showImportExcel,
    setShowImportExcel,
    fetchRoutes,
    fetchOrders,
    showNewRoute,
    setShowNewRoute,
    newRouteError,
    setNewRouteError,
    handleAddRoute,
    routes,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    handleConfirmBulkDelete,
    bulkDeleteTargets,
    bulkDeleteBusy,
    bulkDeleteOrderCount,
  } = s;

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden -mx-6 -mb-6 -mt-1">
      <RoutesPageToolbar {...s} />
      {showFilters ? <RoutesPageFiltersPanel {...s} /> : null}
      {bulkDeleteMode && filteredRoutes.length > 0 ? (
        <RoutesPageBulkDeleteBar {...s} />
      ) : null}

      <div className="flex flex-1 min-h-0 min-w-0 relative overflow-hidden">
        <RoutesPageListSection {...s} />

        {!panelFullscreenActive ? (
          <PanelResizeHandle onResize={handlePanelResize} />
        ) : null}

        <div
          style={panelFullscreenActive ? undefined : { width: detailPanelWidth }}
          className={clsx(
            'flex flex-col min-h-0 max-h-full shrink-0 overflow-hidden',
            panelFullscreenActive
              ? 'absolute inset-0 z-20 h-full w-full max-w-none bg-white/95 dark:bg-stone-950/95 backdrop-blur-md'
              : selectedRoute
                ? [
                    'w-full max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:h-dvh max-lg:max-h-dvh',
                    'lg:h-full lg:relative',
                    'lg:border-l lg:border-stone-200/70 dark:lg:border-stone-800/70',
                    'lg:bg-white/35 dark:lg:bg-stone-950/25 backdrop-blur-md',
                  ]
                : [
                    'hidden lg:flex lg:h-full',
                    'lg:border-l lg:border-dashed lg:border-stone-200/70 dark:lg:border-stone-800/70',
                    'lg:bg-white/20 dark:lg:bg-stone-950/10 backdrop-blur-md',
                  ],
          )}
        >
          {selectedRoute ? (
            <div
              key={selectedRoute.id}
              className="flex flex-col h-full min-h-0 w-full min-w-0 max-lg:animate-route-panel-enter-mobile lg:animate-route-panel-enter motion-reduce:animate-none"
            >
              <RouteDetailSidePanel
                route={selectedRoute}
                onClose={closeDetailPanel}
                fullscreen={detailPanelFullscreen}
                onToggleFullscreen={() => setDetailPanelFullscreen((v) => !v)}
              />
            </div>
          ) : (
            <RouteDetailPlaceholder />
          )}
        </div>
      </div>

      <ImportExcelModal
        open={showImportExcel}
        onClose={() => setShowImportExcel(false)}
        onImported={() => {
          void fetchRoutes();
          void fetchOrders();
        }}
      />

      <Modal
        open={showNewRoute}
        onClose={() => {
          setNewRouteError(null);
          setShowNewRoute(false);
        }}
        title="Crear nueva ruta"
        size="md"
      >
        <RouteForm
          suggestedSequence={suggestNextRouteSequence(routes)}
          onSubmit={handleAddRoute}
          onCancel={() => {
            setNewRouteError(null);
            setShowNewRoute(false);
          }}
          submitLabel="Crear ruta"
          error={newRouteError}
        />
      </Modal>

      <TypeToConfirmModal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={bulkDeleteTargets.length === 1 ? 'Eliminar ruta' : 'Eliminar rutas en lote'}
        loading={bulkDeleteBusy}
        confirmLabel={bulkDeleteTargets.length === 1 ? 'Eliminar ruta' : `Eliminar ${bulkDeleteTargets.length} rutas`}
        message={
          <>
            <p>
              Se eliminarán{' '}
              <strong className="tabular-nums">{bulkDeleteTargets.length}</strong>{' '}
              ruta{bulkDeleteTargets.length === 1 ? '' : 's'} y todos sus pedidos asociados.
            </p>
            {bulkDeleteOrderCount > 0 ? (
              <p className="mt-2">
                {bulkDeleteOrderCount} pedido{bulkDeleteOrderCount === 1 ? '' : 's'} serán eliminados permanentemente.
              </p>
            ) : (
              <p className="mt-2">Las rutas seleccionadas no tienen pedidos.</p>
            )}
            {bulkDeleteTargets.length <= 5 ? (
              <ul className="mt-3 space-y-1 text-xs font-mono text-stone-600 dark:text-stone-400">
                {bulkDeleteTargets.map((r) => (
                  <li key={r.id} translate="no">
                    N° {formatRouteDisplayLabel(r)}
                    {r.name ? ` — ${r.name}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                Incluye{' '}
                {bulkDeleteTargets.slice(0, 3).map((r) => `N° ${formatRouteDisplayLabel(r)}`).join(', ')}
                {' '}y {bulkDeleteTargets.length - 3} más…
              </p>
            )}
          </>
        }
      />
    </div>
  );
}
