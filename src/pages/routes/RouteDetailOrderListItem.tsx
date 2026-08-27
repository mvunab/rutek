import { clsx } from 'clsx';
import { pickDeliveryReceiverForOrder, pickRejectionInfoForOrder } from '../../lib/deliveryReceiver';
import { parseOrderReferenceFields } from '../../lib/orderReferenceFields';
import { photosForOrderOnRoute } from '../../lib/orderPhotos';
import { orderAddressParts } from './routesShared';
import { RouteDetailOrderAssignPanel } from './RouteDetailOrderAssignPanel';
import { RouteDetailOrderCardContent } from './RouteDetailOrderCardContent';
import { RouteDetailOrderEditPanel } from './RouteDetailOrderEditPanel';
import type { Order } from '../../types';
import type { RouteDetailPanelState } from './useRouteDetailSidePanel';

type Props = RouteDetailPanelState & { o: Order; orderIndex: number };

export function RouteDetailOrderListItem({ o, orderIndex, ...s }: Props) {
  const {
    route,
    canManage,
    bulkAssignOpen,
    orderSelectMode,
    selectedOrderIds,
    expandedOrderId,
    editingOrderId,
    busyId,
    orderAssignSaved,
    orderDraftDriver,
    setOrderDraftDriver,
    orderDraftPeoneta,
    setOrderDraftPeoneta,
    orderDraftVehicle,
    setOrderDraftVehicle,
    orderApplyToAll,
    setOrderApplyToAll,
    orderAssignBusy,
    driverSelectOpts,
    peonetaSelectOpts,
    vehicleSelectOpts,
    routeClientLabel,
    routePhotos,
    getSameVehicleConflict,
    handleCancelOrderAssign,
    handleOpenOrderAssign,
    handleOpenOrderEdit,
    handleSaveOrderAssignment,
    handleUpdateOrder,
    handleReactivateOrder,
    setDetailOrder,
    setRemoveOrderId,
    setEditingOrderId,
    setInspectionLightbox,
    toggleOrderSelected,
  } = s;

  const destinatario = o.clientName?.trim() || 'Por confirmar';
  const originParts = orderAddressParts(o.origin);
  const destParts = orderAddressParts(o.destination);
  const hasOrigin = originParts.location !== '—';
  const isAssignOpen = expandedOrderId === o.id;
  const isEditOpen = editingOrderId === o.id;
  const vehicleWarn = isAssignOpen ? getSameVehicleConflict(o.id) : null;
  const hasAssignment =
    Boolean(o.driverName?.trim()) ||
    Boolean(o.peonetaName?.trim()) ||
    Boolean(o.vehiclePlate?.trim());
  const isDelivered = o.status === 'delivered';
  const isRejected = o.status === 'rejected';
  const isInTransit = o.status === 'in_transit';
  const showStatusOnCard = isDelivered || isRejected || isInTransit;
  const inspectionPhotos =
    isDelivered || isRejected ? photosForOrderOnRoute(routePhotos, route, o) : [];
  const deliveryReceiver = isDelivered
    ? pickDeliveryReceiverForOrder(s.routeDeliveryRecords, o.id, o.code)
    : null;
  const rejectionInfo = isRejected
    ? pickRejectionInfoForOrder(s.routeDeliveryRecords, o.id, o.code)
    : null;
  const referenceFields = parseOrderReferenceFields(o.notes);

  return (
    <li
      className={clsx(
        'glass-card-order overflow-hidden',
        isDelivered && 'glass-card-order--delivered',
        isRejected && 'glass-card-order--rejected',
        isInTransit && 'glass-card-order--in-transit',
        orderSelectMode &&
          selectedOrderIds.has(o.id) &&
          'ring-2 ring-primary-500/50 dark:ring-primary-400/40',
      )}
    >
      <RouteDetailOrderCardContent
        route={route}
        o={o}
        orderIndex={orderIndex}
        orderSelectMode={orderSelectMode}
        selectedOrderIds={selectedOrderIds}
        toggleOrderSelected={toggleOrderSelected}
        isDelivered={isDelivered}
        isRejected={isRejected}
        isInTransit={isInTransit}
        showStatusOnCard={showStatusOnCard}
        hasOrigin={hasOrigin}
        originParts={originParts}
        destParts={destParts}
        destinatario={destinatario}
        referenceFields={referenceFields}
        deliveryReceiver={deliveryReceiver}
        rejectionInfo={rejectionInfo}
        inspectionPhotos={inspectionPhotos}
        canManage={canManage}
        bulkAssignOpen={bulkAssignOpen}
        hasAssignment={hasAssignment}
        orderAssignSaved={orderAssignSaved}
        isAssignOpen={isAssignOpen}
        isEditOpen={isEditOpen}
        busyId={busyId}
        setEditingOrderId={setEditingOrderId}
        setDetailOrder={setDetailOrder}
        setInspectionLightbox={setInspectionLightbox}
        handleReactivateOrder={handleReactivateOrder}
        handleCancelOrderAssign={handleCancelOrderAssign}
        handleOpenOrderAssign={handleOpenOrderAssign}
        handleOpenOrderEdit={handleOpenOrderEdit}
        setRemoveOrderId={setRemoveOrderId}
      />

      {isAssignOpen ? (
        <RouteDetailOrderAssignPanel
          order={o}
          orderDraftDriver={orderDraftDriver}
          setOrderDraftDriver={setOrderDraftDriver}
          orderDraftPeoneta={orderDraftPeoneta}
          setOrderDraftPeoneta={setOrderDraftPeoneta}
          orderDraftVehicle={orderDraftVehicle}
          setOrderDraftVehicle={setOrderDraftVehicle}
          orderApplyToAll={orderApplyToAll}
          setOrderApplyToAll={setOrderApplyToAll}
          orderAssignBusy={orderAssignBusy}
          driverSelectOpts={driverSelectOpts}
          peonetaSelectOpts={peonetaSelectOpts}
          vehicleSelectOpts={vehicleSelectOpts}
          vehicleWarn={vehicleWarn}
          onSave={() => void handleSaveOrderAssignment(o.id)}
          onCancel={handleCancelOrderAssign}
        />
      ) : null}

      {isEditOpen ? (
        <RouteDetailOrderEditPanel
          order={o}
          routeClientId={route.clientId?.trim() || undefined}
          routeClientLabel={routeClientLabel}
          onSubmit={(d) => void handleUpdateOrder(o.id, d)}
          onCancel={() => setEditingOrderId(null)}
        />
      ) : null}
    </li>
  );
}
