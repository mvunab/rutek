import { UserCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { RangeAssignRulesPanel } from '../../components/routes/RangeAssignRulesPanel';
import type { RouteDetailPanelState } from './useRouteDetailSidePanel';

export function RouteDetailOrderBulkPanels(s: RouteDetailPanelState) {
  const {
    canManage,
    assigned,
    bulkAssignOpen,
    orderSelectMode,
    orderStatusFilter,
    filteredAssigned,
    selectedOrderIds,
    selectAllFilteredOrders,
    clearSelectedOrders,
    selectDraftDriver,
    setSelectDraftDriver,
    selectDraftPeoneta,
    setSelectDraftPeoneta,
    selectDraftVehicle,
    setSelectDraftVehicle,
    selectAssignBusy,
    closeOrderSelectMode,
    handleAssignSelectedOrders,
    bulkAssignRules,
    setBulkAssignRules,
    handleBulkApplyRules,
    driversList,
    vehiclesSorted,
    peonetasList,
    bulkAssignBusy,
    bulkDraftCity,
    setBulkDraftCity,
    bulkDraftRegion,
    setBulkDraftRegion,
    bulkRegionSelectOpts,
    driverSelectOpts,
    peonetaSelectOpts,
    vehicleSelectOpts,
  } = s;

  return (
    <>
      {canManage && assigned.length > 0 && !bulkAssignOpen && !orderSelectMode ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-stone-500 dark:text-stone-400 px-0.5 -mt-1">
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded border border-[#ff7b00] bg-[#ff7b00]/20" aria-hidden />
            Acción abierta
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded border border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-800" aria-hidden />
            Disponible
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 opacity-50" aria-hidden />
            Bloqueada
          </span>
        </p>
      ) : null}

      {orderSelectMode && assigned.length > 0 ? (
        <div
          className="rounded-xl border border-primary-200/80 dark:border-primary-800/60 bg-primary-50/40 dark:bg-primary-950/20 px-3 py-3 space-y-3 animate-toolbar-panel-enter motion-reduce:animate-none"
          role="region"
          aria-label="Asignación por selección manual"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-stone-600 dark:text-stone-300">
              <span className="font-semibold tabular-nums text-stone-800 dark:text-stone-100">
                {selectedOrderIds.size}
              </span>{' '}
              de {filteredAssigned.length} visibles seleccionados
              {orderStatusFilter !== 'all' ? (
                <span className="text-stone-400"> (filtro activo)</span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={selectAllFilteredOrders}
                disabled={selectAssignBusy || filteredAssigned.length === 0}
              >
                Todas
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={clearSelectedOrders}
                disabled={selectAssignBusy || selectedOrderIds.size === 0}
              >
                Ninguna
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              id="select-bulk-driver"
              label="Chofer"
              value={selectDraftDriver}
              onChange={(e) => setSelectDraftDriver(e.target.value)}
              options={driverSelectOpts}
              disabled={selectAssignBusy}
              autoComplete="off"
            />
            <Select
              id="select-bulk-peoneta"
              label="Peoneta"
              value={selectDraftPeoneta}
              onChange={(e) => setSelectDraftPeoneta(e.target.value)}
              options={peonetaSelectOpts}
              disabled={selectAssignBusy}
              autoComplete="off"
            />
            <Select
              id="select-bulk-vehicle"
              label="Vehículo"
              value={selectDraftVehicle}
              onChange={(e) => setSelectDraftVehicle(e.target.value)}
              options={vehicleSelectOpts}
              disabled={selectAssignBusy}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={closeOrderSelectMode}
              disabled={selectAssignBusy}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<UserCircle size={14} aria-hidden />}
              onClick={handleAssignSelectedOrders}
              disabled={selectAssignBusy || selectedOrderIds.size === 0}
              loading={selectAssignBusy}
            >
              Asignar seleccionados
              {selectedOrderIds.size > 0 ? ` (${selectedOrderIds.size})` : ''}
            </Button>
          </div>
        </div>
      ) : null}

      {bulkAssignOpen && assigned.length > 0 ? (
        <div className="rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-violet-50/40 dark:bg-violet-950/20 px-3 py-3 space-y-3 animate-toolbar-panel-enter motion-reduce:animate-none">
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Los números de pedido coinciden con el orden de la lista ({assigned.length} en total).
          </p>
          <RangeAssignRulesPanel
            total={assigned.length}
            rules={bulkAssignRules}
            onRulesChange={setBulkAssignRules}
            onApplyRules={handleBulkApplyRules}
            drivers={driversList}
            vehicles={vehiclesSorted}
            peonetas={peonetasList}
            showPeoneta
            disabled={bulkAssignBusy}
            applyLabel="Guardar asignación"
            tone="violet"
          />
          <div className="rounded-lg border border-stone-200/80 dark:border-stone-700/80 bg-white/60 dark:bg-stone-900/40 px-3 py-3 space-y-2">
            <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
              Ubicación destino (opcional)
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Se aplica a los pedidos cubiertos por las reglas. Si no hay reglas de equipo, aplica a todos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                id="bulk-dest-city"
                label="Ciudad destino"
                name="bulk_dest_city"
                placeholder="Ej: Maipú…"
                value={bulkDraftCity}
                onChange={(e) => setBulkDraftCity(e.target.value)}
                disabled={bulkAssignBusy}
                autoComplete="off"
                containerClassName="sm:col-span-1"
              />
              <Select
                id="bulk-dest-region"
                label="Región destino"
                value={bulkDraftRegion}
                onChange={(e) => setBulkDraftRegion(e.target.value)}
                options={bulkRegionSelectOpts}
                disabled={bulkAssignBusy}
                autoComplete="off"
                containerClassName="sm:col-span-2"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
