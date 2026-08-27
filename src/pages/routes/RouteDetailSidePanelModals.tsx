import { ConfirmModal, Modal, TypeToConfirmModal } from '../../components/ui/Modal';
import { OrderForm } from '../../components/orders/OrderForm';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { SendTrackingModal } from '../../components/communications/SendTrackingModal';
import { PhotoLightbox } from '../../components/photos/PhotoLightbox';
import {
  formatRouteDisplayLabel,
  formatRouteDisplayTitle,
  formatRouteSequence,
  resolveRouteSequence,
} from '../../lib/routeSequence';
import { RouteForm } from './RouteForm';
import type { RouteDetailPanelState } from './useRouteDetailSidePanel';

export function RouteDetailSidePanelModals(s: RouteDetailPanelState) {
  const {
    route,
    canManage,
    assigned,
    busyId,
    detailOrder,
    setDetailOrder,
    inspectionLightbox,
    setInspectionLightbox,
    createOrderOpen,
    createFormKey,
    closeCreateOrder,
    handleCreateOrder,
    routeClientLabel,
    defaultOrderOrigin,
    editRouteOpen,
    setEditRouteOpen,
    editRouteBusy,
    editRouteError,
    setEditRouteError,
    handleEditRouteSubmit,
    deleteRouteOpen,
    setDeleteRouteOpen,
    deleteRouteBusy,
    handleConfirmDeleteRoute,
    sameVehicleConfirm,
    setSameVehicleConfirm,
    performAssignSelectedOrders,
    performBulkApplyRules,
    handleSaveOrderAssignment,
    orderApplyToAll,
    trackingRouteOpen,
    setTrackingRouteOpen,
    removeOrderId,
    setRemoveOrderId,
    handleRemove,
    handleReactivateOrder,
  } = s;

  return (
    <>
      {detailOrder ? (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          routeLabel={formatRouteDisplayTitle(route)}
          onReactivate={
            canManage && detailOrder.status === 'rejected'
              ? () => {
                  void handleReactivateOrder(detailOrder.id).then(() => {
                    setDetailOrder(null);
                  });
                }
              : undefined
          }
          reactivating={busyId === detailOrder.id}
        />
      ) : null}

      {inspectionLightbox ? (
        <PhotoLightbox
          photos={inspectionLightbox.photos}
          index={inspectionLightbox.index}
          onIndexChange={(index) =>
            setInspectionLightbox((prev) => (prev ? { ...prev, index } : prev))
          }
          onClose={() => setInspectionLightbox(null)}
        />
      ) : null}

      {createOrderOpen ? (
        <Modal
          open
          onClose={closeCreateOrder}
          title="Nuevo pedido"
          description={`${formatRouteDisplayTitle(route)} — se creará en esta ruta`}
          size="xl"
        >
          <OrderForm
            key={createFormKey}
            submitLabel={busyId === 'create' ? 'Creando…' : 'Crear pedido en la ruta'}
            onSubmit={(d) => void handleCreateOrder(d)}
            onCancel={closeCreateOrder}
            lockedClientId={route.clientId?.trim() || undefined}
            lockedClientName={routeClientLabel !== '—' ? routeClientLabel : undefined}
            defaultOrigin={{
              originStreet: defaultOrderOrigin.street,
              originCity: defaultOrderOrigin.city,
              originRegion: defaultOrderOrigin.region,
            }}
          />
        </Modal>
      ) : null}

      {editRouteOpen ? (
        <Modal
          open
          onClose={() => {
            if (editRouteBusy) return;
            setEditRouteOpen(false);
            setEditRouteError(null);
          }}
          title="Editar ruta"
          description={formatRouteDisplayTitle(route)}
          size="xl"
        >
          <RouteForm
            initial={{
              guiaInterna: String(resolveRouteSequence(route) ?? ''),
              name: route.name,
              notes: route.notes ?? '',
              clientId: route.clientId ?? '',
            }}
            onSubmit={handleEditRouteSubmit}
            onCancel={() => {
              if (editRouteBusy) return;
              setEditRouteOpen(false);
              setEditRouteError(null);
            }}
            submitLabel={editRouteBusy ? 'Guardando…' : 'Guardar cambios'}
            error={editRouteError}
          />
        </Modal>
      ) : null}

      <TypeToConfirmModal
        open={deleteRouteOpen}
        onClose={() => setDeleteRouteOpen(false)}
        onConfirm={handleConfirmDeleteRoute}
        title="Eliminar ruta"
        loading={deleteRouteBusy}
        confirmLabel="Eliminar ruta"
        message={
          <>
            <p>
              Se eliminará la ruta <strong translate="no">N° {formatRouteDisplayLabel(route)}</strong>
              {route.name ? (
                <>
                  {' '}
                  (<span translate="no">{route.name}</span>)
                </>
              ) : null}{' '}
              y todos sus pedidos asociados.
            </p>
            <p className="mt-2">
              {assigned.length === 0
                ? 'No hay pedidos en esta ruta.'
                : `${assigned.length} pedido${assigned.length === 1 ? '' : 's'} serán eliminados permanentemente.`}
            </p>
          </>
        }
      />

      <ConfirmModal
        open={sameVehicleConfirm !== null}
        onClose={() => setSameVehicleConfirm(null)}
        onConfirm={() => {
          const conf = sameVehicleConfirm;
          setSameVehicleConfirm(null);
          if (!conf) return;
          if (conf.bulkSelect) {
            void performAssignSelectedOrders();
            return;
          }
          if (conf.bulk) {
            void performBulkApplyRules();
            return;
          }
          if (conf.orderId) void handleSaveOrderAssignment(conf.orderId);
        }}
        title="Mismo vehículo en varios pedidos"
        message={
          sameVehicleConfirm
            ? sameVehicleConfirm.bulkSelect || sameVehicleConfirm.bulk
              ? `¿Asignar el mismo vehículo (${sameVehicleConfirm.plate}) a los pedidos ${sameVehicleConfirm.otherCodes.join(', ')}?`
              : orderApplyToAll
                ? `¿Estás seguro de asignar el mismo vehículo (${sameVehicleConfirm.plate}) a los ${sameVehicleConfirm.otherCodes.length} pedidos de esta ruta?`
                : `¿Estás seguro de asignar el mismo vehículo (${sameVehicleConfirm.plate})? Ya está en el pedido ${sameVehicleConfirm.otherCodes.join(', ')}.`
            : ''
        }
        confirmLabel="Sí, asignar igual"
        variant="warning"
      />

      {trackingRouteOpen ? (
        <SendTrackingModal
          routeId={route.id}
          routeCode={formatRouteSequence(route)}
          open
          onClose={() => setTrackingRouteOpen(false)}
        />
      ) : null}

      <ConfirmModal
        open={removeOrderId !== null}
        onClose={() => setRemoveOrderId(null)}
        onConfirm={() => {
          const id = removeOrderId;
          setRemoveOrderId(null);
          if (id) void handleRemove(id);
        }}
        title="Quitar pedido de la ruta"
        message="Esto solo desvincula el pedido de esta ruta. El pedido no se elimina."
        confirmLabel="Quitar de la ruta"
        variant="warning"
      />
    </>
  );
}
