import { Select, Input } from '../../components/ui/Input';
import { resolveOrderStatusLabel } from '../../lib/orderStatusLabels';
import type { Client } from '../../types';
import type { StatusFilter } from './ordersMapConstants';

export function OrdersMapFilters({
  statusFilter,
  onStatusFilterChange,
  clientId,
  onClientIdChange,
  search,
  onSearchChange,
  clients,
  tenant,
}: {
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  clientId: string;
  onClientIdChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  clients: Client[];
  tenant: ReturnType<typeof import('../../store/useAuthStore').useAuthStore.getState>['tenant'];
}) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <Select
        label="Estado"
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
        options={[
          { value: 'all', label: 'Todos' },
          { value: 'open', label: 'Abiertos (pendiente + en ruta)' },
          { value: 'terminal', label: 'Cerrados (entregado + rechazado)' },
          { value: 'pending', label: resolveOrderStatusLabel('pending', tenant) },
          { value: 'in_transit', label: resolveOrderStatusLabel('in_transit', tenant) },
          { value: 'delivered', label: resolveOrderStatusLabel('delivered', tenant) },
          { value: 'rejected', label: resolveOrderStatusLabel('rejected', tenant) },
        ]}
      />
      <Select
        label="Cliente / destino"
        value={clientId}
        onChange={(e) => onClientIdChange(e.target.value)}
        options={[
          { value: 'all', label: 'Todos' },
          ...clients.map((c) => ({ value: c.id, label: c.companyName })),
        ]}
      />
      <Input
        label="Buscar"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Código, cliente, dirección…"
      />
    </div>
  );
}
