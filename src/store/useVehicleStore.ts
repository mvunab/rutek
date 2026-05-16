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
    const body = {
      plate: input.plate.trim(),
      brand: input.brand.trim(),
      model: input.model.trim(),
      year: input.year,
      ...(input.type !== undefined && { type: input.type }),
      ...(input.capacity !== undefined && { capacity: input.capacity }),
      ...(input.available !== undefined && { available: input.available }),
    };
    const inserted = await api.post<DbVehicle>('/vehicles', body);
    const v = toVehicle(inserted);
    set((s) => ({ vehicles: [v, ...s.vehicles] }));
    return v;
  },

  updateVehicle: async (id, patch) => {
    const body: Record<string, unknown> = {};
    if (patch.plate !== undefined) body.plate = patch.plate.trim();
    if (patch.brand !== undefined) body.brand = patch.brand.trim();
    if (patch.model !== undefined) body.model = patch.model.trim();
    if (patch.year !== undefined) body.year = patch.year;
    if (patch.type !== undefined) body.type = patch.type;
    if (patch.capacity !== undefined) body.capacity = patch.capacity;
    if (patch.available !== undefined) body.available = patch.available;

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
