import { Search } from 'lucide-react';
import { Select } from '../../components/ui/Input';

export function VehiclesFiltersPanel({
  formBaseId,
  search,
  estadoFilter,
  complianceFilter,
  onSearchChange,
  onEstadoFilterChange,
  onComplianceFilterChange,
}: {
  formBaseId: string;
  search: string;
  estadoFilter: 'all' | 'active' | 'inactive';
  complianceFilter: 'all' | 'alerts';
  onSearchChange: (value: string) => void;
  onEstadoFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  onComplianceFilterChange: (value: 'all' | 'alerts') => void;
}) {
  return (
    <div
      id="vehicle-filters"
      role="region"
      aria-label="Filtros de vehículos"
      className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex flex-col sm:flex-row gap-4 flex-wrap"
    >
      <div className="flex-1 min-w-[200px]">
        <label
          htmlFor="vehicles-search"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5"
        >
          Buscar
        </label>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none"
            aria-hidden
          />
          <input
            id="vehicles-search"
            type="search"
            name="vehicle-search"
            autoComplete="off"
            placeholder="Buscar por patente, marca, modelo, VIN…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          />
        </div>
      </div>
      <div className="w-full sm:w-48">
        <Select
          label="Estado"
          id={`${formBaseId}-estado-filter`}
          value={estadoFilter}
          onChange={(e) => onEstadoFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'active', label: 'Activo' },
            { value: 'inactive', label: 'Inactivo' },
          ]}
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          label="Vencimientos"
          id={`${formBaseId}-compliance-filter`}
          value={complianceFilter}
          onChange={(e) => onComplianceFilterChange(e.target.value as 'all' | 'alerts')}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'alerts', label: 'Con alertas' },
          ]}
        />
      </div>
    </div>
  );
}
