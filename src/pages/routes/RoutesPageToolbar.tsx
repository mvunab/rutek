import {
  Download, FileSpreadsheet, LayoutGrid, LayoutList, ListChecks, Plus, RefreshCw,
  Search, SlidersHorizontal,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { LAYOUT_KEY } from './routesShared';
import type { RoutesPageState } from './useRoutesPage';

export function RoutesPageToolbar(s: RoutesPageState) {
  const {
    search,
    setSearch,
    showFilters,
    setShowFilters,
    hasActiveFilters,
    fetchRoutes,
    fetchOrders,
    filteredRoutes,
    bulkDeleteMode,
    closeBulkDeleteMode,
    setBulkDeleteMode,
    handleExportRoutes,
    exportRangeDescription,
    layout,
    setLayout,
    setShowImportExcel,
    setShowNewRoute,
  } = s;

  return (
  <div className="flex items-center gap-2 flex-wrap px-6 pt-1 pb-3 shrink-0 border-b border-stone-200/80 dark:border-stone-800/80 glass backdrop-blur-md">
    <div className="flex-1 min-w-[200px] max-w-sm">
      <label
        htmlFor="routes-search"
        className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5"
      >
        Buscar
      </label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" aria-hidden />
        <input
          id="routes-search"
          type="search"
          name="route-search"
          placeholder="Buscar n° ruta, nombre, chofer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          className="w-full pl-8 pr-3 py-2 bg-white/70 dark:bg-stone-950/40 border border-stone-300/80 dark:border-stone-700/70 rounded-lg text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm backdrop-blur-md"
        />
      </div>
    </div>

    <Button
      variant="secondary"
      size="sm"
      onClick={() => setShowFilters((v) => !v)}
      icon={<SlidersHorizontal size={14} />}
      aria-expanded={showFilters}
      className={clsx(hasActiveFilters && 'border-primary-300 dark:border-primary-700')}
    >
      Filtros
      {hasActiveFilters ? (
        <span className="ml-1 size-1.5 rounded-full bg-primary-500" aria-hidden />
      ) : null}
    </Button>

    <Button
      variant="secondary"
      size="sm"
      icon={<RefreshCw size={14} />}
      onClick={() => {
        void fetchRoutes();
        void fetchOrders();
      }}
    >
      Actualizar
    </Button>

    {filteredRoutes.length > 0 ? (
      <Button
        variant={bulkDeleteMode ? 'primary' : 'secondary'}
        size="sm"
        icon={<ListChecks size={14} />}
        onClick={() => {
          if (bulkDeleteMode) closeBulkDeleteMode();
          else setBulkDeleteMode(true);
        }}
        aria-pressed={bulkDeleteMode}
      >
        {bulkDeleteMode ? 'Cancelar selección' : 'Seleccionar'}
      </Button>
    ) : null}

    <div className="flex flex-col items-stretch sm:items-end gap-0.5">
      <Button
        variant="secondary"
        size="sm"
        icon={<Download size={14} aria-hidden />}
        onClick={handleExportRoutes}
        disabled={filteredRoutes.length === 0}
        aria-describedby="routes-export-range-hint"
      >
        Exportar Excel
      </Button>
      <p
        id="routes-export-range-hint"
        className="hidden sm:block text-[10px] leading-snug text-stone-500 dark:text-stone-400 max-w-[11rem] text-right"
      >
        {exportRangeDescription.short}
      </p>
    </div>

    {/* Toggle de layout */}
    <div className="flex items-center rounded-lg border border-stone-300 dark:border-stone-600 overflow-hidden shrink-0" role="group" aria-label="Cambiar vista">
      <button
        type="button"
        onClick={() => { setLayout('cards'); localStorage.setItem(LAYOUT_KEY, 'cards'); }}
        aria-label="Vista tarjetas"
        aria-pressed={layout === 'cards'}
        className={clsx(
          'flex items-center justify-center px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
          layout === 'cards'
            ? 'bg-primary-600 text-white'
            : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800',
        )}
      >
        <LayoutGrid size={14} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => { setLayout('table'); localStorage.setItem(LAYOUT_KEY, 'table'); }}
        aria-label="Vista tabla"
        aria-pressed={layout === 'table'}
        className={clsx(
          'flex items-center justify-center px-2.5 py-1.5 border-l border-stone-300 dark:border-stone-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
          layout === 'table'
            ? 'bg-primary-600 text-white'
            : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800',
        )}
      >
        <LayoutList size={14} aria-hidden />
      </button>
    </div>

    <div className="flex-1" />

    <Button
      variant="secondary"
      size="sm"
      icon={<FileSpreadsheet size={14} />}
      onClick={() => setShowImportExcel(true)}
    >
      Importar Excel
    </Button>

    <Button size="sm" onClick={() => setShowNewRoute(true)} icon={<Plus size={14} />}>
      Nueva ruta
    </Button>
  </div>
  );
}
