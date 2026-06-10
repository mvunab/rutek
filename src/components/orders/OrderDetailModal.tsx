import { useEffect, useState } from 'react';
import { ExternalLink, Clock, CheckCircle2, TruckIcon, XCircle, CircleDot } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { OrderStatusBadge, PriorityBadge } from '../ui/Badge';
import type { Order, OrderStatusEvent } from '../../types';
import { api } from '../../lib/api';
import { resolveOrderStatusLabel } from '../../lib/orderStatusLabels';
import { formatAddressLabel } from '../../lib/orderAddress';
import { useAuthStore } from '../../store/useAuthStore';

function statusIcon(status: string) {
  if (status === 'delivered') return <CheckCircle2 size={14} className="text-emerald-500" aria-hidden />;
  if (status === 'in_transit') return <TruckIcon size={14} className="text-violet-500" aria-hidden />;
  if (status === 'rejected') return <XCircle size={14} className="text-red-500" aria-hidden />;
  if (status === 'pending') return <Clock size={14} className="text-stone-400" aria-hidden />;
  return <CircleDot size={14} className="text-primary-500" aria-hidden />;
}

function statusDotColor(status: string) {
  if (status === 'delivered') return 'bg-emerald-500';
  if (status === 'in_transit') return 'bg-violet-500';
  if (status === 'rejected') return 'bg-red-500';
  if (status === 'pending') return 'bg-stone-300 dark:bg-stone-600';
  return 'bg-primary-500';
}

function OrderStatusTimeline({ orderId }: { orderId: string }) {
  const { tenant } = useAuthStore();
  const [history, setHistory] = useState<OrderStatusEvent[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get<OrderStatusEvent[]>(`/orders/${orderId}/history`)
      .then((data) => { if (!cancelled) setHistory(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setHistory(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId]);

  if (loading) {
    return (
      <p className="text-xs text-stone-400 dark:text-stone-500 animate-pulse">
        Cargando historial…
      </p>
    );
  }

  if (!history || history.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
        Historial de estados
      </p>
      <ol className="relative border-l border-stone-200 dark:border-stone-700 space-y-0" aria-label="Historial de cambios de estado">
        {history.map((evt, i) => {
          const isLast = i === history.length - 1;
          const label = resolveOrderStatusLabel(evt.status, tenant);
          const date = evt.changedAt
            ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(evt.changedAt))
            : null;
          return (
            <li key={i} className="ml-4 pb-5 last:pb-0">
              <span
                className={`absolute -left-[5px] mt-1 flex size-2.5 items-center justify-center rounded-full ring-2 ring-white dark:ring-stone-900 ${isLast ? statusDotColor(evt.status) : 'bg-stone-300 dark:bg-stone-600'}`}
                aria-hidden
              />
              <div className="flex items-start gap-2">
                {statusIcon(evt.status)}
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${isLast ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'}`}>
                    {label}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    {date && (
                      <time dateTime={evt.changedAt} className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                        {date}
                      </time>
                    )}
                    {evt.changedBy && (
                      <span className="text-xs text-stone-400 dark:text-stone-500">
                        · {evt.changedBy}
                      </span>
                    )}
                  </div>
                  {evt.note && (
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 italic">{evt.note}</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-stone-50 dark:bg-stone-800/70 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
              Origen (retiro)
            </p>
            {order.origin.street?.trim() ? (
              <p className="text-sm text-stone-800 dark:text-stone-100">{order.origin.street}</p>
            ) : null}
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {formatAddressLabel(order.origin)}
            </p>
          </div>
          <div className="bg-stone-50 dark:bg-stone-800/70 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
              Destino (entrega)
            </p>
            {order.destination.street?.trim() ? (
              <p className="text-sm text-stone-800 dark:text-stone-100">{order.destination.street}</p>
            ) : null}
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {formatAddressLabel(order.destination)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
            Destinatario
          </p>
          <p className="text-sm text-stone-800 dark:text-stone-100">{order.clientName}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2">
            <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Chofer</p>
            <p className="text-stone-800 dark:text-stone-100">{order.driverName?.trim() || '—'}</p>
          </div>
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2">
            <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Peoneta</p>
            <p className="text-stone-800 dark:text-stone-100">{order.peonetaName?.trim() || '—'}</p>
          </div>
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2">
            <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Vehículo</p>
            <p translate="no" className="font-mono text-stone-800 dark:text-stone-100">
              {order.vehiclePlate?.trim() || '—'}
            </p>
          </div>
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

        <OrderStatusTimeline orderId={order.id} />

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
