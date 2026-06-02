import { create } from 'zustand';
import type { Vehicle, VehicleType, VehicleDocument, VehicleDocumentKind } from '../types';
import { api, isNetworkError } from '../lib/api';
import type { DbVehicle, DbVehicleDocument } from '../types/api';
import { normalizeVehiclePlate, normalizeVehicleVin } from '../lib/vehicleIdentity';

function toVehicleDocument(r: DbVehicleDocument): VehicleDocument {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    vehicleId: r.vehicle_id,
    kind: r.kind as VehicleDocumentKind,
    storageKey: r.storage_key,
    fileUrl: r.file_url,
    mimeType: r.mime_type,
    fileName: r.file_name ?? null,
    fileSize: r.file_size ?? null,
    uploadedBy: r.uploaded_by ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

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
    documents: Array.isArray(r.documents) ? r.documents.map(toVehicleDocument) : undefined,
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
  fetchVehicle: (id: string) => Promise<Vehicle>;
  uploadVehicleDocument: (
    vehicleId: string,
    kind: VehicleDocumentKind,
    file: File,
  ) => Promise<VehicleDocument>;
  deleteVehicleDocument: (vehicleId: string, kind: VehicleDocumentKind) => Promise<void>;
  createVehicle: (input: CreateVehicleInput) => Promise<Vehicle>;
  updateVehicle: (id: string, patch: UpdateVehicleInput) => Promise<Vehicle>;
  deleteVehicle: (id: string) => Promise<void>;
}

function buildVehicleBody(input: CreateVehicleInput | UpdateVehicleInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if ('plate' in input && input.plate !== undefined) {
    body.plate = normalizeVehiclePlate(input.plate);
  }
  if ('brand' in input && input.brand !== undefined) body.brand = input.brand.trim();
  if ('model' in input && input.model !== undefined) body.model = input.model.trim();
  if ('year' in input && input.year !== undefined) body.year = input.year;
  if ('type' in input && input.type !== undefined) body.type = input.type;
  if ('capacity' in input && input.capacity !== undefined) body.capacity = input.capacity;
  if ('available' in input && input.available !== undefined) body.available = input.available;
  if ('vin' in input && input.vin !== undefined) {
    const v = input.vin?.trim() ?? '';
    body.vin = v.length > 0 ? normalizeVehicleVin(v) : null;
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

  fetchVehicle: async (id) => {
    const row = await api.get<DbVehicle>(`/vehicles/${id}`);
    const vehicle = toVehicle(row);
    set((s) => ({
      vehicles: s.vehicles.some((v) => v.id === id)
        ? s.vehicles.map((v) => (v.id === id ? vehicle : v))
        : [vehicle, ...s.vehicles],
    }));
    return vehicle;
  },

  uploadVehicleDocument: async (vehicleId, kind, file) => {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    const row = await api.postForm<DbVehicleDocument>(`/vehicles/${vehicleId}/documents`, form);
    const doc = toVehicleDocument(row);
    set((s) => ({
      vehicles: s.vehicles.map((v) => {
        if (v.id !== vehicleId) return v;
        const prev = v.documents ?? [];
        const next = [...prev.filter((d) => d.kind !== kind), doc];
        return { ...v, documents: next };
      }),
    }));
    return doc;
  },

  deleteVehicleDocument: async (vehicleId, kind) => {
    await api.del(`/vehicles/${vehicleId}/documents/${kind}`);
    set((s) => ({
      vehicles: s.vehicles.map((v) => {
        if (v.id !== vehicleId) return v;
        return {
          ...v,
          documents: (v.documents ?? []).filter((d) => d.kind !== kind),
        };
      }),
    }));
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
