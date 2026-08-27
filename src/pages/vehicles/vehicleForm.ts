import type { Vehicle, VehicleType } from '../../types';
import type { CreateVehicleInput } from '../../store/useVehicleStore';
import { ApiError } from '../../lib/api';
import { normalizeVehiclePlate, normalizeVehicleVin } from '../../lib/vehicleIdentity';

export type SortKey = keyof Pick<Vehicle, 'plate' | 'brand' | 'model' | 'year' | 'available'>;
export type SortDir = 'asc' | 'desc' | 'none';

export const PAGE_SIZE = 10;

export const TYPE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'cargo_truck', label: 'Camión de carga' },
  { value: 'truck', label: 'Camión' },
  { value: 'van', label: 'Furgón' },
  { value: 'motorcycle', label: 'Motocicleta' },
];

export interface VehicleFormState {
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

export function emptyForm(): VehicleFormState {
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

export function vehicleToForm(v: Vehicle): VehicleFormState {
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

export function getApiMessage(err: unknown, fallback: string): string {
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

export function parseVehicleForm(
  form: VehicleFormState,
  vehicles: Vehicle[],
  editing: Vehicle | null,
): { data: CreateVehicleInput } | { error: string } {
  const plate = form.plate.trim();
  const brand = form.brand.trim();
  const model = form.model.trim();
  const year = Number.parseInt(form.year, 10);
  const cap = Number.parseFloat(form.capacity.replace(',', '.'));
  if (!plate) {
    return { error: 'La patente es obligatoria.' };
  }
  if (!brand) {
    return { error: 'La marca es obligatoria.' };
  }
  if (!model) {
    return { error: 'El modelo es obligatorio.' };
  }
  if (!Number.isFinite(year) || year < 1980 || year > new Date().getFullYear() + 1) {
    return { error: 'Indica un año válido.' };
  }
  if (!Number.isFinite(cap) || cap < 0) {
    return { error: 'La capacidad debe ser un número ≥ 0 (usa 0 si no aplica).' };
  }
  const vin = form.vin.trim().toUpperCase();
  if (vin && !VIN_RE.test(vin)) {
    return { error: 'VIN inválido: usa 11–17 caracteres (sin I, O ni Q).' };
  }

  const normalizedPlate = normalizeVehiclePlate(plate);
  const normalizedVin = normalizeVehicleVin(vin || null);

  const plateDup = vehicles.find(
    (v) =>
      normalizeVehiclePlate(v.plate) === normalizedPlate &&
      v.id !== editing?.id,
  );
  if (plateDup) {
    return { error: `Ya existe un vehículo con la patente ${plateDup.plate}.` };
  }

  if (normalizedVin) {
    const vinDup = vehicles.find(
      (v) =>
        v.vin &&
        normalizeVehicleVin(v.vin) === normalizedVin &&
        v.id !== editing?.id,
    );
    if (vinDup) {
      return {
        error: `El VIN ${normalizedVin} ya está registrado en el vehículo ${vinDup.plate}.`,
      };
    }
  }

  return {
    data: {
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
    },
  };
}
