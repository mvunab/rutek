import { ExternalLink } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { OrderStatusBadge, PriorityBadge } from '../ui/Badge';
import type { Order } from '../../types';

export function OrderDetailModal({
  order,
  onClose,
  routeLabel,
}: {
  order: Order;
  onClose: () => void;
  routeLabel?: string;
}) {
  const guide = order.dispatchGuideUrl?.trim();
  const guideIsLikelyImg =
    !!guide &&
    /\.(png|jpe?g|gif|webp)(\?|$)/i.test(guide);

  return (
    <Modal open onClose={onClose} title={`Pedido ${order.code}`} size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <PriorityBadge priority={order.priority} />
          <span className="text-xs text-stone-400 dark:text-stone-500">Creado: {order.createdAt}</span>
        </div>

        {routeLabel?.trim() ? (
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/50 px-3 py-2">
            <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              Ruta
            </p>
            <p className="text-sm text-stone-800 dark:text-stone-100">{routeLabel.trim()}</p>
          </div>
        ) : null}

        <div className="bg-stone-50 dark:bg-stone-800/70 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
            Dirección
          </p>
          <p className="text-sm text-stone-800 dark:text-stone-100">{order.destination.street}</p>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            {order.destination.city}, {order.destination.region}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
            Cliente
          </p>
          <p className="text-sm text-stone-800 dark:text-stone-100">{order.clientName}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2">
            <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              Bultos (este pedido)
            </p>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 tabular-nums">{order.bultos}</p>
          </div>
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 min-w-0">
            <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              Guía de despacho
            </p>
            {guide ? (
              <a
                href={guide}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1 min-w-0"
              >
                <ExternalLink size={14} className="shrink-0" aria-hidden />
                <span className="truncate">Ver guía</span>
              </a>
            ) : (
              <p className="text-sm text-stone-400 dark:text-stone-500">Sin guía</p>
            )}
          </div>
        </div>

        {guideIsLikelyImg && guide && (
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden bg-stone-50 dark:bg-stone-900/80">
            <img
              src={guide}
              alt={`Guía de despacho del pedido ${order.code}`}
              className="w-full max-h-64 object-contain"
              loading="lazy"
              width={800}
              height={400}
            />
          </div>
        )}

        {order.notes && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Notas</p>
            <p className="text-xs text-stone-700 dark:text-stone-300">{order.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-stone-50 dark:bg-stone-800/70 rounded-lg border border-stone-200 dark:border-stone-700">
            <p className="text-xs text-stone-400 dark:text-stone-500">Entrega estimada</p>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{order.estimatedDelivery}</p>
          </div>
          <div className="text-center p-3 bg-stone-50 dark:bg-stone-800/70 rounded-lg border border-stone-200 dark:border-stone-700">
            <p className="text-xs text-stone-400 dark:text-stone-500">Entrega real</p>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{order.actualDelivery ?? '—'}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
