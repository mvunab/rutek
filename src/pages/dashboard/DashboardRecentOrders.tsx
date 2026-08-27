import { ArrowRight } from 'lucide-react';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { Order } from '../../types';

export function DashboardRecentOrders({
  recentOrders,
  onViewRoutes,
}: {
  recentOrders: Order[];
  onViewRoutes: () => void;
}) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
        <div>
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Pedidos recientes</h3>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            Últimos 7 días · para agrupar en rutas
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onViewRoutes}
          icon={<ArrowRight size={16} aria-hidden />}
          iconPosition="right"
        >
          Ir a rutas
        </Button>
      </div>
      <div className="divide-y divide-stone-50 dark:divide-stone-800">
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-400 dark:text-stone-500">
            Sin pedidos creados en los últimos 7 días
          </div>
        ) : (
          recentOrders.map((order) => (
            <div key={order.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-200">{order.code}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{order.clientName}</p>
              </div>
              <p className="text-xs text-stone-400 dark:text-stone-500 flex-shrink-0">{order.estimatedDelivery}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
