import { OrderForm, type OrderFormData } from '../../components/orders/OrderForm';
import type { Order } from '../../types';
import { orderToFormData } from './routesShared';

type Props = {
  order: Order;
  routeClientId?: string;
  routeClientLabel: string;
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
};

export function RouteDetailOrderEditPanel({
  order,
  routeClientId,
  routeClientLabel,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <div className="border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900/40 px-3 py-3">
      <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
        Editar pedido
      </p>
      <OrderForm
        key={`edit-${order.id}`}
        initial={orderToFormData(order)}
        submitLabel="Guardar cambios"
        onSubmit={onSubmit}
        onCancel={onCancel}
        lockedClientId={routeClientId}
        lockedClientName={routeClientLabel !== '—' ? routeClientLabel : undefined}
      />
    </div>
  );
}
