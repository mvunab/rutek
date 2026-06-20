import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Gauge,
  Hash,
  MapPin,
  Package,
  Pencil,
  Trash2,
  Truck,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Order, Route, Vehicle, VehicleDocument, VehicleDocumentKind } from '../../types';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useRouteStore } from '../../store/useRouteStore';
import { useOrderStore } from '../../store/useOrderStore';
import { ApiError } from '../../lib/api';
import {
  COMPLIANCE_SUPPORTS_DOCUMENT_UPLOAD,
  COMPLIANCE_TO_DOCUMENT_KIND,
  listVehicleComplianceDetails,
  summarizeVehicleCompliance,
} from '../../lib/vehicleCompliance';
import {
  formatVehicleCapacity,
  formatVehicleDate,
  VEHICLE_TYPE_LABELS,
} from '../../lib/vehicleLabels';
import { routeStatusLabel } from '../../lib/routeStatusLabels';
import { formatRouteDisplayLabel, formatRouteDisplayTitle } from '../../lib/routeSequence';
import { OrderStatusBadge, RouteStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/Modal';
import { VehicleComplianceDocumentCard } from '../../components/vehicles/VehicleComplianceDocumentCard';

const RECENT_LIMIT = 8;

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-stone-500 dark:text-stone-400">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{value}</p>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-3 border-b border-stone-100 dark:border-stone-800 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {label}
      </dt>
      <dd className="text-sm text-stone-900 dark:text-stone-100 min-w-0">{children}</dd>
    </div>
  );
}

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchVehicle, deleteVehicle, uploadVehicleDocument, deleteVehicleDocument } =
    useVehicleStore();
  const { routes, fetchRoutes } = useRouteStore();
  const { orders, fetchOrders } = useOrderStore();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [v] = await Promise.all([
          fetchVehicle(id),
          fetchRoutes(),
          fetchOrders(),
        ]);
        if (!cancelled) setVehicle(v);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            setError('No encontramos este vehículo.');
          } else {
            setError('No se pudo cargar la ficha del vehículo.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, fetchVehicle, fetchRoutes, fetchOrders]);

  const complianceItems = useMemo(
    () =>
      vehicle
        ? listVehicleComplianceDetails({
            maintenanceDueDate: vehicle.maintenanceDueDate,
            circulationPermitDueDate: vehicle.circulationPermitDueDate,
            technicalReviewDueDate: vehicle.technicalReviewDueDate,
          })
        : [],
    [vehicle],
  );

  const documentsByKind = useMemo(() => {
    const map = new Map<VehicleDocumentKind, VehicleDocument>();
    for (const doc of vehicle?.documents ?? []) {
      map.set(doc.kind, doc);
    }
    return map;
  }, [vehicle?.documents]);

  const refreshVehicle = async () => {
    if (!id) return;
    const v = await fetchVehicle(id);
    setVehicle(v);
  };

  const complianceSummary = useMemo(
    () =>
      vehicle
        ? summarizeVehicleCompliance({
            maintenanceDueDate: vehicle.maintenanceDueDate,
            circulationPermitDueDate: vehicle.circulationPermitDueDate,
            technicalReviewDueDate: vehicle.technicalReviewDueDate,
          })
        : null,
    [vehicle],
  );

  const relatedRoutes = useMemo(() => {
    if (!vehicle) return [] as Route[];
    return routes
      .filter((r) => r.vehicleId === vehicle.id)
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, RECENT_LIMIT);
  }, [routes, vehicle]);

  const relatedOrders = useMemo(() => {
    if (!vehicle) return [] as Order[];
    return orders
      .filter((o) => o.vehicleId === vehicle.id)
      .toSorted((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt))
      .slice(0, RECENT_LIMIT);
  }, [orders, vehicle]);

  const routeCount = useMemo(
    () => (vehicle ? routes.filter((r) => r.vehicleId === vehicle.id).length : 0),
    [routes, vehicle],
  );

  const orderCount = useMemo(
    () => (vehicle ? orders.filter((o) => o.vehicleId === vehicle.id).length : 0),
    [orders, vehicle],
  );

  const handleDelete = async () => {
    if (!vehicle) return;
    setDeleting(true);
    try {
      await deleteVehicle(vehicle.id);
      navigate('/vehiculos');
    } catch {
      window.alert('No se pudo eliminar el vehículo.');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-sm text-stone-500" role="status" aria-live="polite">
          Cargando ficha del vehículo…
        </p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate('/vehiculos')}
          icon={<ArrowLeft size={16} aria-hidden />}
        >
          Volver a vehículos
        </Button>
        <div
          className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-200">{error ?? 'Vehículo no encontrado.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate('/vehiculos')}
          icon={<ArrowLeft size={16} aria-hidden />}
        >
          Volver a vehículos
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/vehiculos?edit=${vehicle.id}`)}
            icon={<Pencil size={16} aria-hidden />}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            icon={<Trash2 size={16} aria-hidden />}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="size-14 shrink-0 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center"
              aria-hidden
            >
              <Truck size={28} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">
                Patente
              </p>
              <h1
                className="text-3xl font-bold font-mono text-stone-900 dark:text-stone-100 tracking-wide"
                translate="no"
              >
                {vehicle.plate}
              </h1>
              <p className="text-base text-stone-600 dark:text-stone-300 mt-1">
                {vehicle.brand} {vehicle.model}{' '}
                <span className="tabular-nums text-stone-500 dark:text-stone-400">{vehicle.year}</span>
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                {VEHICLE_TYPE_LABELS[vehicle.type]}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                'inline-flex px-3 py-1.5 rounded-full text-xs font-medium border',
                vehicle.available
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700',
              )}
            >
              {vehicle.available ? 'Activo' : 'Inactivo'}
            </span>
            {(complianceSummary?.alertCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                <AlertTriangle size={14} aria-hidden />
                {complianceSummary!.alertCount}{' '}
                {complianceSummary!.alertCount === 1 ? 'alerta' : 'alertas'}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Rutas asignadas"
          value={routeCount}
          icon={<MapPin size={16} className="text-blue-600 dark:text-blue-400" aria-hidden />}
        />
        <StatCard
          label="Pedidos con este vehículo"
          value={orderCount}
          icon={<Package size={16} className="text-amber-600 dark:text-amber-400" aria-hidden />}
        />
        <StatCard
          label="Capacidad"
          value={formatVehicleCapacity(vehicle.capacity)}
          icon={<Gauge size={16} className="text-violet-600 dark:text-violet-400" aria-hidden />}
        />
        <StatCard
          label="Alertas documentación"
          value={complianceSummary?.alertCount ?? 0}
          icon={<AlertTriangle size={16} className="text-red-600 dark:text-red-400" aria-hidden />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Identificación</h2>
          </div>
          <dl className="px-5">
            <InfoRow label="VIN">
              <span translate="no" className="font-mono text-sm break-all">
                {vehicle.vin?.trim() || '—'}
              </span>
            </InfoRow>
            <InfoRow label="Tipo">{VEHICLE_TYPE_LABELS[vehicle.type]}</InfoRow>
            <InfoRow label="Capacidad">
              <span className="tabular-nums">{formatVehicleCapacity(vehicle.capacity)}</span>
            </InfoRow>
            <InfoRow label="Año">
              <span className="tabular-nums">{vehicle.year}</span>
            </InfoRow>
            <InfoRow label="Alta en sistema">
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Calendar size={14} className="text-stone-400 shrink-0" aria-hidden />
                {formatVehicleDate(vehicle.createdAt)}
              </span>
            </InfoRow>
          </dl>
        </section>

        <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
            <Hash size={16} className="text-stone-400" aria-hidden />
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Resumen operativo</h2>
          </div>
          <div className="p-5 space-y-3 text-sm text-stone-600 dark:text-stone-300">
            <p>
              Este vehículo aparece en{' '}
              <strong className="text-stone-900 dark:text-stone-100 tabular-nums">{routeCount}</strong>{' '}
              {routeCount === 1 ? 'ruta' : 'rutas'} y en{' '}
              <strong className="text-stone-900 dark:text-stone-100 tabular-nums">{orderCount}</strong>{' '}
              {orderCount === 1 ? 'pedido' : 'pedidos'}.
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Los contadores incluyen asignaciones a nivel de ruta y de pedido individual.
            </p>
          </div>
        </section>
      </div>

      <section aria-labelledby="vehicle-compliance-heading">
        <div className="mb-3">
          <h2 id="vehicle-compliance-heading" className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Documentación y vencimientos
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Mantención, permiso de circulación y revisión técnica. Puedes adjuntar foto o PDF en cada tarjeta (almacenado en MinIO).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {complianceItems.map((item) => {
            const docKind = COMPLIANCE_TO_DOCUMENT_KIND[item.kind];
            const allowUpload = COMPLIANCE_SUPPORTS_DOCUMENT_UPLOAD.includes(item.kind);
            return (
              <VehicleComplianceDocumentCard
                key={item.kind}
                item={item}
                allowUpload={allowUpload}
                document={documentsByKind.get(docKind)}
                onUpload={async (file) => {
                  if (!vehicle) return;
                  await uploadVehicleDocument(vehicle.id, docKind, file);
                  await refreshVehicle();
                }}
                onDelete={async () => {
                  if (!vehicle) return;
                  await deleteVehicleDocument(vehicle.id, docKind);
                  await refreshVehicle();
                }}
              />
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Rutas recientes</h2>
            {routeCount > RECENT_LIMIT && (
              <span className="text-xs text-stone-500 tabular-nums">Mostrando {RECENT_LIMIT} de {routeCount}</span>
            )}
          </div>
          {relatedRoutes.length === 0 ? (
            <p className="px-5 py-8 text-sm text-stone-500 dark:text-stone-400 text-center">
              Sin rutas asignadas a este vehículo.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {relatedRoutes.map((route) => (
                <li key={route.id}>
                  <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate" translate="no">
                        {formatRouteDisplayTitle(route)}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate tabular-nums">
                        N° {formatRouteDisplayLabel(route)} · {formatVehicleDate(route.createdAt)} ·{' '}
                        {routeStatusLabel(route.status)}
                      </p>
                    </div>
                    <RouteStatusBadge status={route.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Pedidos recientes</h2>
            {orderCount > RECENT_LIMIT && (
              <span className="text-xs text-stone-500 tabular-nums">Mostrando {RECENT_LIMIT} de {orderCount}</span>
            )}
          </div>
          {relatedOrders.length === 0 ? (
            <p className="px-5 py-8 text-sm text-stone-500 dark:text-stone-400 text-center">
              Sin pedidos asignados a este vehículo.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {relatedOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate" translate="no">
                      {order.code}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {order.clientName} · {order.destination?.city || '—'}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
        title="Eliminar vehículo"
        message={`¿Eliminar el vehículo patente ${vehicle.plate} (${vehicle.brand} ${vehicle.model})? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
