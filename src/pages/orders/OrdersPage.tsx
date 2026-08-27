import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Search, Package, MapPin, ExternalLink, Eye } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import type { Order } from '../../types';

/**
 * Solo usuarios **cliente**: consulta de pedidos.
 * Alta y edición operativa ocurre en **Rutas → Pedidos** por ruta.
 */
export function OrdersPage() {
  const { user, tenant } = useAuthStore();
  const { getFilteredOrders, filters, setFilters, fetchOrders } = useOrderStore();

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos los estados' },
      { value: 'pending', label: 'Pendiente' },
      { value: 'in_transit', label: 'En ruta' },
      { value: 'delivered', label: 'Entregado' },
      { value: 'rejected', label: 'Rechazada' },
      ...(tenant?.customOrderStatuses ?? []).map((c) => ({
        value: c.slug,
        label: c.label,
      })),
    ],
    [tenant?.customOrderStatuses],
  );

  if (!user || user.role !== 'client') {
    return <Navigate to="/rutas" replace />;
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/60 px-4 py-3 text-sm text-stone-600 dark:text-stone-300">
        <p className="font-medium text-stone-800 dark:text-stone-100">Mis pedidos</p>
        <p className="text-xs mt-1 text-stone-500 dark:text-stone-400">
          Vista de seguimiento. La planificación y el alta de pedidos las gestiona tu operador desde la pantalla <strong className="font-medium text-stone-700 dark:text-stone-300">Rutas</strong>.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label
              htmlFor="orders-search"
              className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5"
            >
              Buscar
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" aria-hidden />
              <input
                id="orders-search"
                type="text"
                placeholder="Buscar por código o ciudad…"
                value={filters.search ?? ''}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
              />
            </div>
          </div>
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            Filtros
            {filters.status !== 'all' && (
              <span aria-hidden="true" className="ml-1 size-1.5 rounded-full bg-primary-500" />
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm">
            <Select
              value={filters.status ?? 'all'}
              onChange={(e) =>
                setFilters({ status: e.target.value === 'all' ? 'all' : e.target.value })
              }
              options={statusOptions}
              containerClassName="w-48"
            />
            <Button variant="ghost" size="sm" onClick={() => { setFilters({ status: 'all' }); setShowFilters(false); }}>
              Limpiar
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
        <span className="font-semibold text-stone-800 dark:text-stone-200">{filteredOrders.length}</span> pedidos
        {filters.status !== 'all' && <span>· filtrado por estado</span>}
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={<Package size={32} />}
          title="No hay pedidos para mostrar"
          description="Cuando tu operador registre envíos asociados a tu cuenta, aparecerán aquí."
        />
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/90">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Código</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Ciudad</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide tabular-nums">Bultos</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Guía</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Prevista</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs font-semibold text-stone-700 dark:text-stone-200">{order.code}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                      <MapPin size={11} className="text-stone-400 dark:text-stone-500" aria-hidden />
                      <span className="truncate max-w-[140px]">{order.destination.city}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 tabular-nums">{order.bultos}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {order.dispatchGuideUrl ? (
                      <a
                        href={order.dispatchGuideUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-1.5 rounded-md text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
                        aria-label={`Abrir guía del pedido ${order.code}`}
                      >
                        <ExternalLink size={16} aria-hidden />
                      </a>
                    ) : (
                      <span className="text-xs text-stone-300 dark:text-stone-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-stone-500 dark:text-stone-400">{order.estimatedDelivery}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setDetailOrder(order)}
                        icon={<Eye size={13} />}
                        aria-label={`Ver detalle del pedido ${order.code}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailOrder && (
        <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
      )}
    </div>
  );
}
