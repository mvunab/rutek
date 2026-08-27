import { Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { resolveOrderStatusLabel } from '../../lib/orderStatusLabels';
import type { DateRange, StatusFilter } from './valuationUtils';

type FilterUser = { id: string; name: string };
type FilterClient = { id: string; companyName: string };

export function ValuationFiltersPanel({
  tenant,
  drivers,
  peonetas,
  clients,
  filterDriverId,
  filterPeonetaId,
  filterClientId,
  filterStatus,
  filterDateRange,
  hasActiveFilters,
  onDriverChange,
  onPeonetaChange,
  onClientChange,
  onStatusChange,
  onDateRangeChange,
  onClear,
}: {
  tenant: Parameters<typeof resolveOrderStatusLabel>[1];
  drivers: FilterUser[];
  peonetas: FilterUser[];
  clients: FilterClient[];
  filterDriverId: string;
  filterPeonetaId: string;
  filterClientId: string;
  filterStatus: StatusFilter;
  filterDateRange: DateRange;
  hasActiveFilters: boolean;
  onDriverChange: (value: string) => void;
  onPeonetaChange: (value: string) => void;
  onClientChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onDateRangeChange: (value: DateRange) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <Select
        label="Chofer"
        value={filterDriverId}
        onChange={(e) => onDriverChange(e.target.value)}
        options={[
          { value: 'all', label: 'Todos los choferes' },
          ...drivers.map((d) => ({ value: d.id, label: d.name })),
        ]}
        autoComplete="off"
      />
      <Select
        label="Peoneta"
        value={filterPeonetaId}
        onChange={(e) => onPeonetaChange(e.target.value)}
        options={[
          { value: 'all', label: 'Todas las peonetas' },
          ...peonetas.map((p) => ({ value: p.id, label: p.name })),
        ]}
        autoComplete="off"
      />
      <Select
        label="Cuenta (mandante)"
        value={filterClientId}
        onChange={(e) => onClientChange(e.target.value)}
        options={[
          { value: 'all', label: 'Todas las cuentas' },
          ...clients.map((c) => ({ value: c.id, label: c.companyName })),
        ]}
        autoComplete="off"
      />
      <Select
        label="Estado del pedido"
        value={filterStatus}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        options={[
          { value: 'all', label: 'Todos' },
          { value: 'delivered', label: resolveOrderStatusLabel('delivered', tenant) },
          { value: 'rejected', label: resolveOrderStatusLabel('rejected', tenant) },
          { value: 'in_transit', label: resolveOrderStatusLabel('in_transit', tenant) },
          { value: 'pending', label: resolveOrderStatusLabel('pending', tenant) },
        ]}
        autoComplete="off"
      />
      <Select
        label="Período (fecha ruta)"
        value={filterDateRange}
        onChange={(e) => onDateRangeChange(e.target.value as DateRange)}
        options={[
          { value: '7d', label: 'Últimos 7 días' },
          { value: '30d', label: 'Últimos 30 días' },
          { value: '90d', label: 'Últimos 90 días' },
          { value: 'all', label: 'Todo el historial' },
        ]}
        autoComplete="off"
      />
      {hasActiveFilters ? (
        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5 flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Limpiar filtros
          </Button>
        </div>
      ) : null}
    </div>
  );
}
