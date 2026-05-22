import { create } from 'zustand';
import type { Vehicle, VehicleType } from '../types';
import { api, isNetworkError } from '../lib/api';
import type { DbVehicle } from '../types/api';

function toVehicle(r: DbVehicle): Vehicle {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    plate: r.plate,
    type: r.type as VehicleType,
    brand: r.brand,
    model: r.model,
    year: r.year,
    capacity: r.capacity,
    available: r.available,
    vin: r.vin ?? null,
    maintenanceDueDate: r.maintenance_due_date ?? null,
    circulationPermitDueDate: r.circulation_permit_due_date ?? null,
    technicalReviewDueDate: r.technical_review_due_date ?? null,
    createdAt: r.created_at,
  };
}

export interface CreateVehicleInput {
  plate: string;
  brand: string;
  model: string;
  year: number;
  type?: VehicleType;
  capacity?: number;
  available?: boolean;
  vin?: string | null;
  maintenanceDueDate?: string | null;
  circulationPermitDueDate?: string | null;
  technicalReviewDueDate?: string | null;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

interface VehicleStore {
  vehicles: Vehicle[];
  loading: boolean;
  loaded: boolean;
  fetchVehicles: () => Promise<void>;
  createVehicle: (input: CreateVehicleInput) => Promise<Vehicle>;
  updateVehicle: (id: string, patch: UpdateVehicleInput) => Promise<Vehicle>;
  deleteVehicle: (id: string) => Promise<void>;
}

function buildVehicleBody(input: CreateVehicleInput | UpdateVehicleInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if ('plate' in input && input.plate !== undefined) body.plate = input.plate.trim();
  if ('brand' in input && input.brand !== undefined) body.brand = input.brand.trim();
  if ('model' in input && input.model !== undefined) body.model = input.model.trim();
  if ('year' in input && input.year !== undefined) body.year = input.year;
  if ('type' in input && input.type !== undefined) body.type = input.type;
  if ('capacity' in input && input.capacity !== undefined) body.capacity = input.capacity;
  if ('available' in input && input.available !== undefined) body.available = input.available;
  if ('vin' in input && input.vin !== undefined) {
    const v = input.vin?.trim().toUpperCase() ?? '';
    body.vin = v.length > 0 ? v : null;
  }
  if ('maintenanceDueDate' in input && input.maintenanceDueDate !== undefined) {
    body.maintenanceDueDate = input.maintenanceDueDate?.trim() ? input.maintenanceDueDate.trim() : null;
  }
  if ('circulationPermitDueDate' in input && input.circulationPermitDueDate !== undefined) {
    body.circulationPermitDueDate = input.circulationPermitDueDate?.trim()
      ? input.circulationPermitDueDate.trim()
      : null;
  }
  if ('technicalReviewDueDate' in input && input.technicalReviewDueDate !== undefined) {
    body.technicalReviewDueDate = input.technicalReviewDueDate?.trim()
      ? input.technicalReviewDueDate.trim()
      : null;
  }
  return body;
}

export const useVehicleStore = create<VehicleStore>((set) => ({
  vehicles: [],
  loading: false,
  loaded: false,

  fetchVehicles: async () => {
    set({ loading: true });
    try {
      const data = await api.get<DbVehicle[]>('/vehicles');
      set({
        vehicles: Array.isArray(data) ? data.map(toVehicle) : [],
        loaded: true,
      });
    } catch (err) {
      if (isNetworkError(err)) {
        set({ vehicles: [] });
        return;
      }
      set({ vehicles: [], loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  createVehicle: async (input) => {
    const body = buildVehicleBody({
      plate: input.plate,
      brand: input.brand,
      model: input.model,
      year: input.year,
      type: input.type ?? 'cargo_truck',
      capacity: input.capacity ?? 0,
      available: input.available ?? true,
      vin: input.vin,
      maintenanceDueDate: input.maintenanceDueDate,
      circulationPermitDueDate: input.circulationPermitDueDate,
      technicalReviewDueDate: input.technicalReviewDueDate,
    });
    const inserted = await api.post<DbVehicle>('/vehicles', body);
    const v = toVehicle(inserted);
    set((s) => ({ vehicles: [v, ...s.vehicles] }));
    return v;
  },

  updateVehicle: async (id, patch) => {
    const body = buildVehicleBody(patch);
    const updated = await api.patch<DbVehicle>(`/vehicles/${id}`, body);
    const v = toVehicle(updated);
    set((s) => ({
      vehicles: s.vehicles.map((x) => (x.id === id ? v : x)),
    }));
    return v;
  },

  deleteVehicle: async (id) => {
    await api.del(`/vehicles/${id}`);
    set((s) => ({
      vehicles: s.vehicles.filter((x) => x.id !== id),
    }));
  },
}));
