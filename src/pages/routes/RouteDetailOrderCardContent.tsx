import {
  ArrowRight, Check, CheckCircle2, CheckSquare, Package, Pencil, Square, Truck,
  Unlink, UserCircle, XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { OrderInspectionThumbnails } from '../../components/photos/OrderInspectionThumbnails';
import { OrderDeliveryReceiverInfo } from '../../components/orders/OrderDeliveryReceiverInfo';
import { OrderReferenceInfo } from '../../components/orders/OrderReferenceInfo';
import { OrderRejectionInfo } from '../../components/orders/OrderRejectionInfo';
import type { Route, Order, RoutePhoto } from '../../types';
import { formatOrderInRouteLabel } from '../../lib/routeSequence';
import { OrderCardAction } from './OrderCardAction';

export type RouteDetailOrderCardContentProps = {
  route: Route;
  o: Order;
  orderIndex: number;
  orderSelectMode: boolean;
  selectedOrderIds: Set<string>;
  toggleOrderSelected: (orderId: string) => void;
  isDelivered: boolean;
  isRejected: boolean;
  isInTransit: boolean;
  showStatusOnCard: boolean;
  hasOrigin: boolean;
  originParts: { location: string; street: string | null };
  destParts: { location: string; street: string | null };
  destinatario: string;
  referenceFields: ReturnType<typeof import('../../lib/orderReferenceFields').parseOrderReferenceFields>;
  deliveryReceiver: { name: string; rut?: string | null } | null;
  rejectionInfo: { motivo: string; obs: string } | null;
  inspectionPhotos: RoutePhoto[];
  canManage: boolean;
  bulkAssignOpen: boolean;
  hasAssignment: boolean;
  orderAssignSaved: string | null;
  isAssignOpen: boolean;
  isEditOpen: boolean;
  busyId: string | null;
  setEditingOrderId: (id: string | null) => void;
  setDetailOrder: (order: Order) => void;
  setInspectionLightbox: (value: { photos: RoutePhoto[]; index: number } | null) => void;
  handleReactivateOrder: (orderId: string) => Promise<void>;
  handleCancelOrderAssign: () => void;
  handleOpenOrderAssign: (order: Order) => void;
  handleOpenOrderEdit: (order: Order) => void;
  setRemoveOrderId: (id: string) => void;
};

export function RouteDetailOrderCardContent(p: RouteDetailOrderCardContentProps) {
  const {
    route,
    o,
    orderIndex,
    orderSelectMode,
    selectedOrderIds,
    toggleOrderSelected,
    isDelivered,
    isRejected,
    showStatusOnCard,
    hasOrigin,
    originParts,
    destParts,
    destinatario,
    referenceFields,
    deliveryReceiver,
    rejectionInfo,
    inspectionPhotos,
    canManage,
    bulkAssignOpen,
    hasAssignment,
    orderAssignSaved,
    isAssignOpen,
    isEditOpen,
    busyId,
    setEditingOrderId,
    setDetailOrder,
    setInspectionLightbox,
    handleReactivateOrder,
    handleCancelOrderAssign,
    handleOpenOrderAssign,
    handleOpenOrderEdit,
    setRemoveOrderId,
  } = p;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-start gap-3 min-w-0">
        {orderSelectMode ? (
          <button
            type="button"
            onClick={() => toggleOrderSelected(o.id)}
            aria-pressed={selectedOrderIds.has(o.id)}
            aria-label={
              selectedOrderIds.has(o.id)
                ? `Quitar selección del pedido ${orderIndex + 1}`
                : `Seleccionar pedido ${orderIndex + 1}`
            }
            className={clsx(
              'shrink-0 flex items-center justify-center size-8 rounded-lg border cursor-pointer transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
              selectedOrderIds.has(o.id)
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-950/50 dark:text-primary-300'
                : 'border-stone-200 bg-stone-100 text-stone-400 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-500',
            )}
          >
            {selectedOrderIds.has(o.id) ? (
              <CheckSquare size={18} aria-hidden />
            ) : (
              <Square size={18} aria-hidden />
            )}
          </button>
        ) : (
          <div
            className="shrink-0 flex items-center justify-center size-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-600 dark:text-stone-300 tabular-nums"
            aria-hidden
          >
            {orderIndex + 1}
          </div>
        )}
        <div
          className={clsx(
            'size-9 shrink-0 rounded-xl flex items-center justify-center',
            isDelivered && 'bg-emerald-100/90 dark:bg-emerald-950/50',
            isRejected && 'bg-red-100/90 dark:bg-red-950/40',
            !isDelivered && !isRejected && 'glass-icon-chip',
          )}
          aria-hidden
        >
          {isDelivered ? (
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
          ) : isRejected ? (
            <XCircle size={18} className="text-red-600 dark:text-red-400" />
          ) : (
            <Package size={16} className="text-stone-600 dark:text-stone-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              translate="no"
              onClick={() => {
                setEditingOrderId(null);
                setDetailOrder(o);
              }}
              className={clsx(
                'font-mono text-xs font-semibold hover:text-primary-600 dark:hover:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded',
                isDelivered
                  ? 'text-emerald-900 dark:text-emerald-100'
                  : 'text-stone-600 dark:text-stone-300',
              )}
              title="Ver detalle del pedido"
            >
              {formatOrderInRouteLabel(route, orderIndex)}
            </button>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {showStatusOnCard ? <OrderStatusBadge status={o.status} /> : null}
              <span
                className={clsx(
                  'rounded-lg px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                  isDelivered
                    ? 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'bg-stone-100/90 text-stone-600 dark:bg-stone-800/90 dark:text-stone-300',
                )}
              >
                {o.bultos} bulto{o.bultos === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div
            className={clsx(
              'mt-2.5 rounded-xl border px-2.5 py-2',
              isDelivered
                ? 'border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/25'
                : isRejected
                  ? 'border-red-200/70 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20'
                  : 'border-stone-200/80 bg-stone-50/70 dark:border-stone-700/60 dark:bg-stone-900/45',
            )}
          >
            <div
              className={clsx(
                'grid gap-2 min-w-0',
                hasOrigin ? 'grid-cols-[1fr_auto_1fr]' : 'grid-cols-1',
              )}
            >
              {hasOrigin ? (
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Origen
                  </p>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate leading-snug">
                    {originParts.location}
                  </p>
                  {originParts.street ? (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {originParts.street}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {hasOrigin ? (
                <div className="flex items-center justify-center self-center px-0.5" aria-hidden>
                  <ArrowRight size={16} className="text-stone-400 dark:text-stone-500 shrink-0" />
                </div>
              ) : null}
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-400">
                  Destino
                </p>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate leading-snug">
                  {destParts.location}
                </p>
                {destParts.street ? (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                    {destParts.street}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-2">
            <span className="font-medium text-stone-600 dark:text-stone-300">{destinatario}</span>
          </p>

          {referenceFields ? (
            <OrderReferenceInfo className="mt-2.5" fields={referenceFields} />
          ) : null}

          {deliveryReceiver ? (
            <OrderDeliveryReceiverInfo
              className="mt-2.5"
              name={deliveryReceiver.name}
              rut={deliveryReceiver.rut}
            />
          ) : null}

          {isRejected ? (
            <OrderRejectionInfo
              className="mt-2.5"
              info={rejectionInfo ?? { motivo: 'Pedido rechazado', obs: '' }}
              onReactivate={
                canManage
                  ? () => {
                      void handleReactivateOrder(o.id);
                    }
                  : undefined
              }
              reactivating={busyId === o.id}
            />
          ) : null}

          {inspectionPhotos.length > 0 ? (
            <OrderInspectionThumbnails
              className="mt-2.5"
              photos={inspectionPhotos}
              onPhotoClick={(index) =>
                setInspectionLightbox({ photos: inspectionPhotos, index })
              }
            />
          ) : null}
        </div>
      </div>

      {hasAssignment || orderAssignSaved === o.id ? (
        <div className="flex flex-wrap gap-1.5 pl-12">
          {o.driverName?.trim() ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50/90 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:text-blue-200">
              <UserCircle size={11} aria-hidden />
              <span className="truncate max-w-[8rem]">{o.driverName.trim()}</span>
            </span>
          ) : null}
          {o.peonetaName?.trim() ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-600/70 px-2 py-0.5 text-[11px] font-medium text-stone-700 dark:text-stone-200">
              <span className="truncate max-w-[8rem]">{o.peonetaName.trim()}</span>
            </span>
          ) : null}
          {o.vehiclePlate?.trim() ? (
            <span
              translate="no"
              className="inline-flex items-center gap-1 rounded-md bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700 px-2 py-0.5 text-[11px] font-mono font-medium text-stone-700 dark:text-stone-200"
            >
              <Truck size={11} aria-hidden />
              {o.vehiclePlate.trim()}
            </span>
          ) : null}
          {orderAssignSaved === o.id ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <Check size={11} aria-hidden />
              Guardado
            </span>
          ) : null}
        </div>
      ) : null}

      {canManage && !bulkAssignOpen && !orderSelectMode ? (
        <div className="flex gap-2 pt-1 border-t border-stone-200/70 dark:border-stone-800/70">
          <OrderCardAction
            icon={<UserCircle size={15} />}
            label="Asignar"
            active={isAssignOpen}
            onClick={() => (isAssignOpen ? handleCancelOrderAssign() : handleOpenOrderAssign(o))}
            disabled={busyId !== null && busyId !== o.id}
          />
          <OrderCardAction
            icon={<Pencil size={15} />}
            label="Editar"
            active={isEditOpen}
            onClick={() => handleOpenOrderEdit(o)}
            disabled={busyId !== null && busyId !== o.id}
          />
          <OrderCardAction
            icon={<Unlink size={15} />}
            label="Quitar"
            tone="danger"
            loading={busyId === o.id}
            onClick={() => setRemoveOrderId(o.id)}
            disabled={busyId !== null && busyId !== o.id}
          />
        </div>
      ) : canManage && orderSelectMode ? (
        <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/70 dark:border-stone-800/70">
          Marca la casilla y asigna chofer / peoneta / vehículo arriba.
        </p>
      ) : canManage && bulkAssignOpen ? (
        <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/70 dark:border-stone-800/70">
          Usa los rangos Desde–Hasta del panel superior para asignar por pedido.
        </p>
      ) : (
        <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => setDetailOrder(o)}>
          Ver detalle
        </Button>
      )}
    </div>
  );
}
