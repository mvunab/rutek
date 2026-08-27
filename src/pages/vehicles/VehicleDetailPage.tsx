import { Suspense, use, useMemo, useRef, useState, type ReactNode, Component } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Vehicle, VehicleDocumentKind } from '../../types';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useRouteStore } from '../../store/useRouteStore';
import { useOrderStore } from '../../store/useOrderStore';
import { ApiError } from '../../lib/api';
import {
  listVehicleComplianceDetails,
  summarizeVehicleCompliance,
} from '../../lib/vehicleCompliance';
import { ConfirmModal } from '../../components/ui/Modal';
import { VehicleDetailLoading } from './VehicleDetailLoading';
import { VehicleDetailError } from './VehicleDetailError';
import { VehicleDetailHeader } from './VehicleDetailHeader';
import { VehicleDetailStatsGrid } from './VehicleDetailStatsGrid';
import { VehicleDetailInfoPanels } from './VehicleDetailInfoPanels';
import { VehicleDetailComplianceSection } from './VehicleDetailComplianceSection';
import { VehicleDetailRecentLists } from './VehicleDetailRecentLists';
import { invalidateVehicleDetail, loadVehicleDetail } from './vehicleDetailLoader';

const RECENT_LIMIT = 8;

class VehicleDetailErrorBoundary extends Component<
  { children: ReactNode; fallback: (error: Error) => ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <VehicleDetailError error="No encontramos este vehículo." onBack={() => navigate('/vehiculos')} />
    );
  }

  return (
    <VehicleDetailErrorBoundary
      fallback={(error) => (
        <VehicleDetailError
          error={
            error instanceof ApiError && error.status === 404
              ? 'No encontramos este vehículo.'
              : 'No se pudo cargar la ficha del vehículo.'
          }
          onBack={() => navigate('/vehiculos')}
        />
      )}
    >
      <Suspense key={id} fallback={<VehicleDetailLoading />}>
        <VehicleDetailContent id={id} />
      </Suspense>
    </VehicleDetailErrorBoundary>
  );
}

function VehicleDetailContent({ id }: { id: string }) {
  const navigate = useNavigate();
  const initial = use(loadVehicleDetail(id));
  const [vehicle, setVehicle] = useState<Vehicle>(initial);
  const { deleteVehicle, uploadVehicleDocument, deleteVehicleDocument, fetchVehicle } =
    useVehicleStore();
  const { routes } = useRouteStore();
  const { orders } = useOrderStore();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const deletingRef = useRef(false);

  const refreshVehicle = async () => {
    invalidateVehicleDetail(id);
    const next = await fetchVehicle(id);
    setVehicle(next);
  };

  const complianceItems = useMemo(
    () =>
      listVehicleComplianceDetails({
        maintenanceDueDate: vehicle.maintenanceDueDate,
        circulationPermitDueDate: vehicle.circulationPermitDueDate,
        technicalReviewDueDate: vehicle.technicalReviewDueDate,
      }),
    [vehicle],
  );

  const complianceSummary = useMemo(
    () =>
      summarizeVehicleCompliance({
        maintenanceDueDate: vehicle.maintenanceDueDate,
        circulationPermitDueDate: vehicle.circulationPermitDueDate,
        technicalReviewDueDate: vehicle.technicalReviewDueDate,
      }),
    [vehicle],
  );

  const documentsByKind = useMemo(() => {
    return new Map((vehicle.documents ?? []).map((d) => [d.kind, d] as const));
  }, [vehicle]);

  const relatedRoutes = useMemo(
    () =>
      routes
        .filter((r) => r.vehicleId === vehicle.id)
        .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, RECENT_LIMIT),
    [routes, vehicle],
  );

  const relatedOrders = useMemo(
    () =>
      orders
        .filter((o) => o.vehicleId === vehicle.id)
        .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, RECENT_LIMIT),
    [orders, vehicle],
  );

  const routeCount = useMemo(
    () => routes.filter((r) => r.vehicleId === vehicle.id).length,
    [routes, vehicle],
  );

  const orderCount = useMemo(
    () => orders.filter((o) => o.vehicleId === vehicle.id).length,
    [orders, vehicle],
  );

  const handleDelete = async () => {
    deletingRef.current = true;
    try {
      await deleteVehicle(vehicle.id);
      invalidateVehicleDetail(id);
      navigate('/vehiculos');
    } catch {
      window.alert('No se pudo eliminar el vehículo.');
    } finally {
      deletingRef.current = false;
      setDeleteOpen(false);
    }
  };

  const handleUploadDocument = async (kind: VehicleDocumentKind, file: File) => {
    await uploadVehicleDocument(vehicle.id, kind, file);
    await refreshVehicle();
  };

  const handleDeleteDocument = async (kind: VehicleDocumentKind) => {
    await deleteVehicleDocument(vehicle.id, kind);
    await refreshVehicle();
  };

  const alertCount = complianceSummary?.alertCount ?? 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <VehicleDetailHeader
        vehicle={vehicle}
        alertCount={alertCount}
        onBack={() => navigate('/vehiculos')}
        onEdit={() => navigate(`/vehiculos?edit=${vehicle.id}`)}
        onDelete={() => setDeleteOpen(true)}
      />

      <VehicleDetailStatsGrid
        routeCount={routeCount}
        orderCount={orderCount}
        vehicle={vehicle}
        alertCount={alertCount}
      />

      <VehicleDetailInfoPanels vehicle={vehicle} routeCount={routeCount} orderCount={orderCount} />

      <VehicleDetailComplianceSection
        complianceItems={complianceItems}
        documentsByKind={documentsByKind}
        onUpload={handleUploadDocument}
        onDeleteDocument={handleDeleteDocument}
      />

      <VehicleDetailRecentLists
        relatedRoutes={relatedRoutes}
        relatedOrders={relatedOrders}
        routeCount={routeCount}
        orderCount={orderCount}
        onNavigate={navigate}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => !deletingRef.current && setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
        title="Eliminar vehículo"
        message={`¿Eliminar el vehículo patente ${vehicle.plate} (${vehicle.brand} ${vehicle.model})? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
