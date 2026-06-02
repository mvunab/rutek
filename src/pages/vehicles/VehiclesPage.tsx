import { useEffect, useId, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Pencil,
  X,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Vehicle, VehicleType } from '../../types';
import { useVehicleStore, type CreateVehicleInput } from '../../store/useVehicleStore';
import {
  summarizeVehicleCompliance,
  formatComplianceHint,
  VEHICLE_COMPLIANCE_WARN_DAYS,
  type VehicleComplianceSummary,
} from '../../lib/vehicleCompliance';
import { Button } from '../../components/ui/Button';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ApiError } from '../../lib/api';
import { normalizeVehiclePlate, normalizeVehicleVin } from '../../lib/vehicleIdentity';

type SortKey = keyof Pick<Vehicle, 'plate' | 'brand' | 'model' | 'year' | 'available'>;
type SortDir = 'asc' | 'desc' | 'none';

const PAGE_SIZE = 10;

const TYPE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'cargo_truck', label: 'Camión de carga' },
  { value: 'truck', label: 'Camión' },
  { value: 'van', label: 'Furgón' },
  { value: 'motorcycle', label: 'Motocicleta' },
];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active || dir === 'none') {
    return <ChevronsUpDown size={12} className="text-stone-300 dark:text-stone-600 ml-1" aria-hidden />;
  }
  return dir === 'asc' ? (
    <ChevronUp size={12} className="text-primary-600 ml-1" aria-hidden />
  ) : (
    <ChevronDown size={12} className="text-primary-600 ml-1" aria-hidden />
  );
}

interface ColProps {
  colKey: SortKey;
  label: string;
  className?: string;
  sortCol: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}

function Col({ colKey, label, className, sortCol, sortDir, onSort }: ColProps) {
  return (
    <th
      scope="col"
      className={clsx(
        'p-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(colKey)}
        className="inline-flex items-center cursor-pointer select-none hover:text-stone-700 dark:hover:text-stone-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-0.5"
      >
        {label}
        <SortIcon active={sortCol === colKey} dir={sortDir} />
      </button>
    </th>
  );
}

interface VehicleFormState {
  plate: string;
  brand: string;
  model: string;
  year: string;
  type: VehicleType;
  capacity: string;
  available: boolean;
  vin: string;
  maintenanceDueDate: string;
  circulationPermitDueDate: string;
  technicalReviewDueDate: string;
}

const VIN_RE = /^[A-HJ-NPR-Z0-9]{11,17}$/i;

function toDateInputValue(iso?: string | null): string {
  if (!iso?.trim()) return '';
  const d = iso.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
}

function emptyForm(): VehicleFormState {
  return {
    plate: '',
    brand: '',
    model: '',
    year: String(new Date().getFullYear()),
    type: 'cargo_truck',
    capacity: '0',
    available: true,
    vin: '',
    maintenanceDueDate: '',
    circulationPermitDueDate: '',
    technicalReviewDueDate: '',
  };
}

function vehicleToForm(v: Vehicle): VehicleFormState {
  return {
    plate: v.plate,
    brand: v.brand,
    model: v.model,
    year: String(v.year),
    type: v.type,
    capacity: String(v.capacity),
    available: v.available,
    vin: v.vin ?? '',
    maintenanceDueDate: toDateInputValue(v.maintenanceDueDate),
    circulationPermitDueDate: toDateInputValue(v.circulationPermitDueDate),
    technicalReviewDueDate: toDateInputValue(v.technicalReviewDueDate),
  };
}

function VehicleComplianceBadges({ summary }: { summary: VehicleComplianceSummary }) {
  if (summary.alertCount === 0) {
    return <span className="text-xs text-stone-400 dark:text-stone-500">Al día</span>;
  }
  return (
    <ul className="space-y-1 min-w-[140px]">
      {summary.items.map((item) => (
        <li key={item.kind}>
          <span
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border max-w-full',
              item.status === 'expired'
                ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900'
                : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900',
            )}
            title={formatComplianceHint(item)}
          >
            <AlertTriangle size={10} className="shrink-0" aria-hidden />
            <span className="truncate">{formatComplianceHint(item)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function getApiMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const j = JSON.parse(err.body) as { message?: string | string[] };
      if (Array.isArray(j.message)) return j.message.join(' ');
      if (typeof j.message === 'string') return j.message;
    } catch {
      if (err.body) return err.body.slice(0, 200);
    }
  }
  return fallback;
}

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

  const vehiclesWithAlerts = useMemo(
    () =>
      vehicles
        .filter((v) => (complianceByVehicleId.get(v.id)?.alertCount ?? 0) > 0)
        .map((v) => ({ vehicle: v, compliance: complianceByVehicleId.get(v.id)! }))
        .sort((a, b) => {
          const rank = { expired: 0, warning: 1, ok: 2, none: 3 };
          return rank[a.compliance.worst] - rank[b.compliance.worst];
        }),
    [vehicles, complianceByVehicleId],
  );

  const [alertsExpanded, setAlertsExpanded] = useState(false);

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

  const parseForm = (): CreateVehicleInput | null => {
    const plate = form.plate.trim();
    const brand = form.brand.trim();
    const model = form.model.trim();
    const year = Number.parseInt(form.year, 10);
    const cap = Number.parseFloat(form.capacity.replace(',', '.'));
    if (!plate) {
      setFormError('La patente es obligatoria.');
      return null;
    }
    if (!brand) {
      setFormError('La marca es obligatoria.');
      return null;
    }
    if (!model) {
      setFormError('El modelo es obligatorio.');
      return null;
    }
    if (!Number.isFinite(year) || year < 1980 || year > new Date().getFullYear() + 1) {
      setFormError('Indica un año válido.');
      return null;
    }
    if (!Number.isFinite(cap) || cap < 0) {
      setFormError('La capacidad debe ser un número ≥ 0 (usa 0 si no aplica).');
      return null;
    }
    const vin = form.vin.trim().toUpperCase();
    if (vin && !VIN_RE.test(vin)) {
      setFormError('VIN inválido: usa 11–17 caracteres (sin I, O ni Q).');
      return null;
    }

    const normalizedPlate = normalizeVehiclePlate(plate);
    const normalizedVin = normalizeVehicleVin(vin || null);

    const plateDup = vehicles.find(
      (v) =>
        normalizeVehiclePlate(v.plate) === normalizedPlate &&
        v.id !== editing?.id,
    );
    if (plateDup) {
      setFormError(`Ya existe un vehículo con la patente ${plateDup.plate}.`);
      return null;
    }

    if (normalizedVin) {
      const vinDup = vehicles.find(
        (v) =>
          v.vin &&
          normalizeVehicleVin(v.vin) === normalizedVin &&
          v.id !== editing?.id,
      );
      if (vinDup) {
        setFormError(
          `El VIN ${normalizedVin} ya está registrado en el vehículo ${vinDup.plate}.`,
        );
        return null;
      }
    }

    return {
      plate: normalizedPlate,
      brand,
      model,
      year,
      type: form.type,
      capacity: cap,
      available: form.available,
      vin: normalizedVin,
      maintenanceDueDate: form.maintenanceDueDate.trim() || null,
      circulationPermitDueDate: form.circulationPermitDueDate.trim() || null,
      technicalReviewDueDate: form.technicalReviewDueDate.trim() || null,
    };
  };

  const handleSave = async () => {
    const parsed = parseForm();
    if (!parsed) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updateVehicle(editing.id, parsed);
      } else {
        await createVehicle(parsed);
      }
      setModalOpen(false);
      setEditing(null);
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
        <div
          id="vehicle-filters"
          role="region"
          aria-label="Filtros de vehículos"
          className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex flex-col sm:flex-row gap-4 flex-wrap"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              name="vehicle-search"
              autoComplete="off"
              placeholder="Buscar por patente, marca, modelo, VIN…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              label="Estado"
              id={`${formBaseId}-estado-filter`}
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value as 'all' | 'active' | 'inactive');
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'active', label: 'Activo' },
                { value: 'inactive', label: 'Inactivo' },
              ]}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              label="Vencimientos"
              id={`${formBaseId}-compliance-filter`}
              value={complianceFilter}
              onChange={(e) => {
                setComplianceFilter(e.target.value as 'all' | 'alerts');
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'alerts', label: 'Con alertas' },
              ]}
            />
          </div>
        </div>
      )}


      {fleetAlertCount > 0 && (
        <div
          className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 overflow-hidden"
          role="region"
          aria-label="Alertas de vencimiento de flota"
        >
          <button
            type="button"
            onClick={() => setAlertsExpanded((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset"
            aria-expanded={alertsExpanded}
          >
            <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <p className="flex-1 text-sm text-amber-900 dark:text-amber-100">
              <strong className="font-semibold tabular-nums">{fleetAlertCount}</strong>{' '}
              {fleetAlertCount === 1 ? 'vehículo tiene' : 'vehículos tienen'} mantención o documentación por vencer o vencida.
            </p>
            <span className="text-xs text-amber-700 dark:text-amber-300 shrink-0">
              {alertsExpanded ? 'Ocultar' : 'Ver detalle'}
            </span>
            {alertsExpanded
              ? <ChevronUp size={14} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              : <ChevronDown size={14} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            }
          </button>

          {alertsExpanded && (
            <div className="border-t border-amber-200 dark:border-amber-900 divide-y divide-amber-100 dark:divide-amber-900/60">
              {vehiclesWithAlerts.map(({ vehicle, compliance }) => (
                <div key={vehicle.id} className="px-4 py-3 flex flex-wrap items-start gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <Link
                      to={`/vehiculos/${vehicle.id}`}
                      className="text-sm font-semibold text-stone-900 dark:text-stone-100 hover:text-primary-700 dark:hover:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                      translate="no"
                    >
                      {vehicle.plate}
                    </Link>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {vehicle.brand} {vehicle.model} {vehicle.year}
                    </p>
                  </div>
                  <ul className="flex flex-wrap gap-2 mt-0.5" aria-label={`Alertas de ${vehicle.plate}`}>
                    {compliance.items.map((item) => (
                      <li
                        key={item.kind}
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                          item.status === 'expired'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
                        )}
                      >
                        <AlertTriangle size={10} aria-hidden />
                        {formatComplianceHint(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300">
          <Truck size={14} className="text-stone-400" aria-hidden />
          Total: <strong className="text-stone-900 dark:text-stone-100 tabular-nums">{vehicles.length}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
          Activos: <strong className="tabular-nums">{activos}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
          Inactivos: <strong className="tabular-nums">{inactivos}</strong>
        </span>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/90">
                <th
                  scope="col"
                  className="px-3 py-3 w-20 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide"
                >
                  <span className="sr-only">Acciones</span>
                </th>
                <Col colKey="plate" label="Patente" className="w-28" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <Col colKey="brand" label="Marca" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <Col colKey="model" label="Modelo" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <Col colKey="year" label="Año" className="w-24 tabular-nums" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th scope="col" className="p-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide min-w-[120px]">
                  VIN
                </th>
                <th scope="col" className="p-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide min-w-[180px]">
                  Vencimientos
                </th>
                <Col colKey="available" label="Estado" className="w-28" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {loading && !loaded ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-stone-500" role="status" aria-live="polite">
                    Cargando vehículos…
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6">
                    <EmptyState
                      icon={<Truck className="size-10 text-stone-300 dark:text-stone-600" aria-hidden />}
                      title="Sin vehículos"
                      description="Agrega el primero con el botón Agregar o ajusta los filtros."
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((v, i) => (
                  <tr
                    key={v.id}
                    className={clsx(
                      'border-b border-stone-100 dark:border-stone-800 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-colors',
                      i % 2 === 0 ? 'bg-white dark:bg-stone-900' : 'bg-stone-50/50 dark:bg-stone-900/80',
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(v)}
                          className="size-7 flex items-center justify-center rounded border border-stone-200 dark:border-stone-600 text-stone-500 hover:text-primary-600 hover:border-primary-300 dark:hover:border-primary-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                          aria-label={`Editar vehículo ${v.plate}`}
                          title="Editar"
                        >
                          <Pencil size={13} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(v)}
                          className="size-7 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-950/60 dark:hover:bg-red-900/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          aria-label={`Eliminar vehículo ${v.plate}`}
                          title="Eliminar"
                        >
                          <X size={13} strokeWidth={2.5} aria-hidden />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        to={`/vehiculos/${v.id}`}
                        className="font-mono text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                        translate="no"
                      >
                        {v.plate}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-stone-700 dark:text-stone-200">{v.brand}</td>
                    <td className="px-3 py-2.5 text-sm text-stone-700 dark:text-stone-200 min-w-0 max-w-[220px] truncate" title={v.model}>
                      {v.model}
                    </td>
                    <td className="px-3 py-2.5 text-sm tabular-nums text-stone-700 dark:text-stone-200">{v.year}</td>
                    <td className="px-3 py-2.5">
                      <span translate="no" className="font-mono text-xs text-stone-600 dark:text-stone-300">
                        {v.vin?.trim() || '–'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <VehicleComplianceBadges summary={complianceByVehicleId.get(v.id)!} />
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={clsx(
                          'inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border',
                          v.available
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700',
                        )}
                      >
                        {v.available ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditing(null);
          }
        }}
        title={editing ? 'Editar vehículo' : 'Nuevo vehículo'}
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (!saving) {
                  setModalOpen(false);
                  setEditing(null);
                }
              }}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleSave()} loading={saving}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id={`${formBaseId}-plate`}
              label="Patente"
              name="plate"
              value={form.plate}
              onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value.toUpperCase() }))}
              placeholder="ABCD12"
              autoComplete="off"
              spellCheck={false}
              translate="no"
            />
            <Input
              id={`${formBaseId}-year`}
              label="Año"
              name="year"
              inputMode="numeric"
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="2024"
            />
            <Input
              id={`${formBaseId}-brand`}
              label="Marca"
              name="brand"
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              placeholder="PEUGEOT"
              autoComplete="off"
            />
            <Input
              id={`${formBaseId}-model`}
              label="Modelo"
              name="model"
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="BOXER"
              autoComplete="off"
            />
            <Select
              id={`${formBaseId}-type`}
              label="Tipo"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as VehicleType }))}
              options={TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
            <Input
              id={`${formBaseId}-capacity`}
              label="Capacidad (t)"
              name="capacity"
              inputMode="decimal"
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              placeholder="0"
              hint="Puedes usar 0 si no aplica."
            />
            <Input
              id={`${formBaseId}-vin`}
              label="VIN (opcional)"
              name="vin"
              value={form.vin}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  vin: e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, '').slice(0, 17),
                }))
              }
              placeholder="17 caracteres máx."
              autoComplete="off"
              spellCheck={false}
              translate="no"
              hint="Para futura carga automática de datos del vehículo vía scraping."
              containerClassName="sm:col-span-2"
            />
            <Input
              id={`${formBaseId}-maintenance`}
              label="Próxima mantención"
              name="maintenanceDueDate"
              type="date"
              value={form.maintenanceDueDate}
              onChange={(e) => setForm((f) => ({ ...f, maintenanceDueDate: e.target.value }))}
            />
            <Input
              id={`${formBaseId}-circulation`}
              label="Venc. permiso de circulación"
              name="circulationPermitDueDate"
              type="date"
              value={form.circulationPermitDueDate}
              onChange={(e) => setForm((f) => ({ ...f, circulationPermitDueDate: e.target.value }))}
            />
            <Input
              id={`${formBaseId}-technical`}
              label="Venc. revisión técnica"
              name="technicalReviewDueDate"
              type="date"
              value={form.technicalReviewDueDate}
              onChange={(e) => setForm((f) => ({ ...f, technicalReviewDueDate: e.target.value }))}
              containerClassName="sm:col-span-2"
            />
            <p className="sm:col-span-2 text-xs text-stone-500 dark:text-stone-400 -mt-1">
              Alerta amarilla {VEHICLE_COMPLIANCE_WARN_DAYS} días antes; roja si ya venció.
            </p>
            <div className="sm:col-span-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-t border-stone-100 dark:border-stone-800 pt-4 mt-1">
              <div className="min-w-0">
                <p id={`${formBaseId}-estado-label`} className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Estado
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400" aria-live="polite">
                  {form.available ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.available}
                aria-labelledby={`${formBaseId}-estado-label`}
                aria-label={form.available ? 'Desactivar vehículo' : 'Activar vehículo'}
                onClick={() => setForm((f) => ({ ...f, available: !f.available }))}
                className={clsx(
                  'relative shrink-0 h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900',
                  form.available ? 'bg-primary-500' : 'bg-stone-300 dark:bg-stone-600',
                )}
              >
                <span
                  className={clsx(
                    'pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-white shadow transition-[transform]',
                    form.available ? 'left-[22px]' : 'left-1',
                  )}
                  aria-hidden
                />
              </button>
            </div>
          </div>
        </div>
      </Modal>

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
