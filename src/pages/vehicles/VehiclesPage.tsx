import { useEffect, useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import type { Vehicle } from '../../types';
import { useVehicleStore } from '../../store/useVehicleStore';
import {
  summarizeVehicleCompliance,
  VEHICLE_COMPLIANCE_WARN_DAYS,
  type VehicleComplianceSummary,
} from '../../lib/vehicleCompliance';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/Modal';
import { VehiclesFiltersPanel } from './VehiclesFiltersPanel';
import { VehiclesFleetAlertsBanner } from './VehiclesFleetAlertsBanner';
import { VehiclesSummaryChips } from './VehiclesSummaryChips';
import { VehiclesTable } from './VehiclesTable';
import { VehicleFormModal } from './VehicleFormModal';
import {
  PAGE_SIZE,
  emptyForm,
  getApiMessage,
  parseVehicleForm,
  vehicleToForm,
  type SortDir,
  type SortKey,
  type VehicleFormState,
} from './vehicleForm';

export function VehiclesPage() {
  const { vehicles, loading, loaded, fetchVehicles, createVehicle, updateVehicle, deleteVehicle } =
    useVehicleStore();
  const [sortCol, setSortCol] = useState<SortKey>('plate');
  const [sortDir, setSortDir] = useState<SortDir>('none');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'alerts'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [alertsExpanded, setAlertsExpanded] = useState(false);

  const formBaseId = useId();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    void fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || !loaded) return;
    const target = vehicles.find((v) => v.id === editId);
    if (!target) return;
    setEditing(target);
    setForm(vehicleToForm(target));
    setFormError(null);
    setModalOpen(true);
    setSearchParams({}, { replace: true });
  }, [loaded, vehicles, searchParams, setSearchParams]);

  const handleSort = (col: SortKey) => {
    if (sortCol !== col) {
      setSortCol(col);
      setSortDir('asc');
      return;
    }
    setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? 'none' : 'asc'));
  };

  const complianceByVehicleId = useMemo(() => {
    const map = new Map<string, VehicleComplianceSummary>();
    for (const v of vehicles) {
      map.set(
        v.id,
        summarizeVehicleCompliance({
          maintenanceDueDate: v.maintenanceDueDate,
          circulationPermitDueDate: v.circulationPermitDueDate,
          technicalReviewDueDate: v.technicalReviewDueDate,
        }),
      );
    }
    return map;
  }, [vehicles]);

  const fleetAlertCount = useMemo(
    () => vehicles.filter((v) => (complianceByVehicleId.get(v.id)?.alertCount ?? 0) > 0).length,
    [vehicles, complianceByVehicleId],
  );

  const vehiclesWithAlerts = useMemo(() => {
    const rows: { vehicle: (typeof vehicles)[number]; compliance: NonNullable<ReturnType<typeof complianceByVehicleId.get>> }[] = [];
    for (const v of vehicles) {
      if ((complianceByVehicleId.get(v.id)?.alertCount ?? 0) > 0) {
        rows.push({ vehicle: v, compliance: complianceByVehicleId.get(v.id)! });
      }
    }
    const rank = { expired: 0, warning: 1, ok: 2, none: 3 };
    return rows.sort((a, b) => rank[a.compliance.worst] - rank[b.compliance.worst]);
  }, [vehicles, complianceByVehicleId]);

  const filtered = useMemo(() => {
    let rows = vehicles.filter((v) => {
      if (estadoFilter === 'active' && !v.available) return false;
      if (estadoFilter === 'inactive' && v.available) return false;
      if (complianceFilter === 'alerts' && (complianceByVehicleId.get(v.id)?.alertCount ?? 0) === 0) {
        return false;
      }
      if (!search.trim()) return true;
      const t = search.toLowerCase();
      return (
        v.plate.toLowerCase().includes(t) ||
        v.brand.toLowerCase().includes(t) ||
        v.model.toLowerCase().includes(t) ||
        String(v.year).includes(t) ||
        (v.vin?.toLowerCase().includes(t) ?? false)
      );
    });
    if (sortDir !== 'none') {
      rows = rows.toSorted((a, b) => {
        if (sortCol === 'year') {
          return sortDir === 'asc' ? a.year - b.year : b.year - a.year;
        }
        if (sortCol === 'available') {
          const av = a.available ? 1 : 0;
          const bv = b.available ? 1 : 0;
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        const av = (a[sortCol] ?? '').toString().toLowerCase();
        const bv = (b[sortCol] ?? '').toString().toLowerCase();
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [vehicles, search, estadoFilter, complianceFilter, complianceByVehicleId, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm(vehicleToForm(v));
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    const parsed = parseVehicleForm(form, vehicles, editing);
    if ('error' in parsed) {
      setFormError(parsed.error);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updateVehicle(editing.id, parsed.data);
      } else {
        await createVehicle(parsed.data);
      }
      closeModal();
    } catch (err) {
      setFormError(getApiMessage(err, 'No se pudo guardar el vehículo.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVehicle(deleteTarget.id);
    } catch (err) {
      window.alert(getApiMessage(err, 'No se pudo eliminar el vehículo.'));
    }
    setDeleteTarget(null);
  };

  const activos = vehicles.filter((v) => v.available).length;
  const inactivos = vehicles.length - activos;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-primary-700 dark:text-primary-400 tracking-tight">
            Vehículos
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Flota con VIN opcional, fechas de mantención y documentación. Alertas {VEHICLE_COMPLIANCE_WARN_DAYS} días antes del vencimiento.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" onClick={openCreate} icon={<Plus size={16} aria-hidden />}>
            Agregar
          </Button>
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            aria-expanded={filterOpen}
            aria-controls="vehicle-filters"
            aria-label={filterOpen ? 'Cerrar filtros' : 'Abrir filtros'}
            title="Filtros"
            className={clsx(
              'size-10 flex items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900',
              filterOpen
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800',
            )}
          >
            <Filter size={18} aria-hidden />
          </button>
        </div>
      </div>

      {filterOpen && (
        <VehiclesFiltersPanel
          formBaseId={formBaseId}
          search={search}
          estadoFilter={estadoFilter}
          complianceFilter={complianceFilter}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onEstadoFilterChange={(value) => {
            setEstadoFilter(value);
            setPage(1);
          }}
          onComplianceFilterChange={(value) => {
            setComplianceFilter(value);
            setPage(1);
          }}
        />
      )}

      <VehiclesFleetAlertsBanner
        fleetAlertCount={fleetAlertCount}
        alertsExpanded={alertsExpanded}
        vehiclesWithAlerts={vehiclesWithAlerts}
        onToggle={() => setAlertsExpanded((v) => !v)}
      />

      <VehiclesSummaryChips total={vehicles.length} activos={activos} inactivos={inactivos} />

      <VehiclesTable
        loading={loading}
        loaded={loaded}
        paginated={paginated}
        sortCol={sortCol}
        sortDir={sortDir}
        onSort={handleSort}
        complianceByVehicleId={complianceByVehicleId}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 text-sm text-stone-600 dark:text-stone-300">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="tabular-nums px-2">
            Página {page} de {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      )}

      <VehicleFormModal
        open={modalOpen}
        editing={!!editing}
        form={form}
        formError={formError}
        saving={saving}
        formBaseId={formBaseId}
        onClose={closeModal}
        onSave={() => void handleSave()}
        onFormChange={setForm}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Eliminar vehículo"
        message={
          deleteTarget
            ? `¿Eliminar el vehículo patente ${deleteTarget.plate} (${deleteTarget.brand} ${deleteTarget.model})? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
