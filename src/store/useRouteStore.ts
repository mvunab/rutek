import { create } from 'zustand';
import type { Route, RouteFilters, RouteStop } from '../types';
import { normalizeRouteStatus } from '../lib/routeStatusLabels';
import { api, isNetworkError } from '../lib/api';
import { useOrderStore } from './useOrderStore';

export type DeleteRouteResult = {
  deleted: boolean;
  orders_deleted: number;
};

/** Cuerpo que espera `POST /routes` (`CreateRouteDto` en rutek-api, snake_case). */
export type CreateRouteInput = {
  name: string;
  /** Folio / código legible; si se omite, se genera en el servidor. */
  code?: string;
  notes?: string;
  /** UUID del cliente al que pertenece esta ruta (RM-3). Opcional: si se omite, se infiere del primer pedido asignado. */
  clientId?: string;
};

/** Campos PATCH /routes/:id; `null` en chofer/vehículo los desasigna en el servidor. */
export type PatchRouteInput = Omit<
  Partial<Route>,
  'driverId' | 'driverName' | 'vehicleId' | 'vehiclePlate'
> & {
  driverId?: string | null;
  driverName?: string | null;
  vehicleId?: string | null;
  vehiclePlate?: string | null;
};

function mapRouteFromApi(row: Record<string, unknown>): Route {
  const stops = (Array.isArray(row.stops) ? row.stops : []) as RouteStop[];
  return {
    id: String(row.id ?? ''),
    tenantId: String(row.tenant_id ?? ''),
    code: String(row.code ?? ''),
    name: String(row.name ?? ''),
    status: normalizeRouteStatus(String(row.status ?? '')),
    driverId: row.driver_id ? String(row.driver_id) : undefined,
    driverName: row.driver_name ? String(row.driver_name) : undefined,
    vehicleId: row.vehicle_id ? String(row.vehicle_id) : undefined,
    vehiclePlate: row.vehicle_plate ? String(row.vehicle_plate) : undefined,
    stops,
    orderIds: stops.map((s) => s.orderId).filter(Boolean),
    startTime: row.start_time != null ? String(row.start_time) : undefined,
    endTime: row.end_time != null ? String(row.end_time) : undefined,
    estimatedDistance: Number(row.estimated_distance ?? 0),
    estimatedDuration: Number(row.estimated_duration ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    notes: row.notes != null ? String(row.notes) : undefined,
    clientId: row.client_id != null ? String(row.client_id) : null,
  };
}

function routePatchToApi(data: PatchRouteInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.name !== undefined) out.name = data.name;
  if (data.status !== undefined) out.status = data.status;
  if (data.clientId !== undefined) out.client_id = data.clientId;
  if (data.driverId !== undefined) out.driver_id = data.driverId;
  if (data.driverName !== undefined) out.driver_name = data.driverName;
  if (data.vehicleId !== undefined) out.vehicle_id = data.vehicleId;
  if (data.vehiclePlate !== undefined) out.vehicle_plate = data.vehiclePlate;
  if (data.stops !== undefined) out.stops = data.stops;
  if (data.estimatedDistance !== undefined) out.estimated_distance = data.estimatedDistance;
  if (data.estimatedDuration !== undefined) out.estimated_duration = data.estimatedDuration;
  if (data.notes !== undefined) out.notes = data.notes;
  return out;
}

/** Body para PATCH /routes/:id/assign-driver (RM-1). */
export type AssignDriverToRouteInput = {
  /** UUID del driver; null para desasignar. */
  driverId: string | null;
  driverName?: string | null;
  /** UUID de la peoneta (opcional). */
  peonetaId?: string | null;
  peonetaName?: string | null;
  /** UUID del vehículo (opcional). */
  vehicleId?: string | null;
  vehiclePlate?: string | null;
  /** Si se indica, solo esos pedidos de la ruta (asignación masiva parcial). */
  orderIds?: string[];
};

interface RouteStore {
  routes: Route[];
  selectedRoute: Route | null;
  filters: RouteFilters;
  loading: boolean;
  loaded: boolean;
  fetchRoutes: () => Promise<void>;
  setFilters: (filters: Partial<RouteFilters>) => void;
  resetFilters: () => void;
  selectRoute: (route: Route | null) => void;
  addRoute: (input: CreateRouteInput) => Promise<void>;
  updateRoute: (id: string, data: PatchRouteInput) => Promise<void>;
  updateRouteStatus: (id: string, status: 'cancelled') => Promise<void>;
  /**
   * RM-1: llama PATCH /routes/:id/assign-driver.
   * Actualiza driver_id / peoneta_id en TODOS los pedidos de la ruta.
   */
  assignDriverToOrders: (routeId: string, input: AssignDriverToRouteInput) => Promise<void>;
  assignDriver: (routeId: string, driverId: string, driverName: string) => Promise<void>;
  assignVehicle: (routeId: string, vehicleId: string, vehiclePlate: string) => Promise<void>;
  addOrderToRoute: (routeId: string, orderId: string) => Promise<void>;
  deleteRoute: (id: string) => Promise<DeleteRouteResult | undefined>;
  getFilteredRoutes: () => Route[];
}

const defaultFilters: RouteFilters = {
  status: 'all',
  search: '',
};

export const useRouteStore = create<RouteStore>((set, get) => ({
  routes: [],
  selectedRoute: null,
  filters: defaultFilters,
  loading: false,
  loaded: false,

  fetchRoutes: async () => {
    set({ loading: true });
    try {
      const data = await api.get<Record<string, unknown>[]>('/routes');
      set({
        routes: Array.isArray(data) ? data.map(mapRouteFromApi) : [],
        loaded: true,
      });
    } catch (err) {
      if (isNetworkError(err)) {
        set({ routes: [] });
        return;
      }
      set({ routes: [], loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  resetFilters: () => set({ filters: defaultFilters }),

  selectRoute: (route) => set({ selectedRoute: route }),

  addRoute: async (input) => {
    const body: Record<string, unknown> = {
      name: input.name.trim(),
    };
    if (input.code?.trim()) body.code = input.code.trim();
    if (input.notes?.trim()) body.notes = input.notes.trim();
    if (input.clientId?.trim()) body.client_id = input.clientId.trim();
    try {
      const created = await api.post<Record<string, unknown>>('/routes', body);
      set((state) => ({
        routes: [mapRouteFromApi(created), ...state.routes],
      }));
    } catch (err) {
      if (isNetworkError(err)) return;
      throw err;
    }
  },

  updateRoute: async (id, data) => {
    try {
      const body = routePatchToApi(data);
      if (Object.keys(body).length === 0) return;
      const updated = await api.patch<Record<string, unknown>>(
        `/routes/${id}`,
        body,
      );
      const mapped = mapRouteFromApi(updated);
      set((state) => ({
        routes: state.routes.map((r) => (r.id === id ? mapped : r)),
        selectedRoute:
          state.selectedRoute?.id === id ? mapped : state.selectedRoute,
      }));
    } catch (err) {
      if (isNetworkError(err)) return;
      throw err;
    }
  },

  updateRouteStatus: async (id, status) => {
    if (status !== 'cancelled') return;
    await get().updateRoute(id, { status: 'cancelled' });
  },

  assignDriverToOrders: async (routeId, input) => {
    try {
      const body: Record<string, unknown> = {
        driver_id: input.driverId,
      };
      if (input.driverName !== undefined) body.driver_name = input.driverName;
      if (input.peonetaId !== undefined) body.peoneta_id = input.peonetaId;
      if (input.peonetaName !== undefined) body.peoneta_name = input.peonetaName;
      if (input.vehicleId !== undefined) body.vehicle_id = input.vehicleId;
      if (input.vehiclePlate !== undefined) body.vehicle_plate = input.vehiclePlate;
      if (input.orderIds?.length) body.order_ids = input.orderIds;
      await api.patch(`/routes/${routeId}/assign-driver`, body);
      // No llama fetchRoutes aquí — el caller es responsable de refrescar.
    } catch (err) {
      if (isNetworkError(err)) return;
      throw err;
    }
  },

  assignDriver: async (routeId, driverId, driverName) => {
    await get().assignDriverToOrders(routeId, { driverId, driverName });
  },

  assignVehicle: async (routeId, vehicleId, vehiclePlate) => {
    await get().updateRoute(routeId, { vehicleId, vehiclePlate });
  },

  addOrderToRoute: async (routeId, orderId) => {
    const current = get().routes.find((r) => r.id === routeId);
    if (!current) return;
    // La vinculación real es `orders.route_id` (PATCH /orders); acá solo
    // actualizamos el estado local para reflejar el pedido en la lista.
    set((state) => ({
      routes: state.routes.map((r) =>
        r.id === routeId
          ? {
              ...r,
              orderIds: r.orderIds.includes(orderId)
                ? r.orderIds
                : [...r.orderIds, orderId],
            }
          : r,
      ),
    }));
  },

  deleteRoute: async (id) => {
    try {
      const res = await api.del<DeleteRouteResult>(`/routes/${id}`);
      useOrderStore.getState().removeOrdersForRoute(id);
      set((state) => ({
        routes: state.routes.filter((r) => r.id !== id),
        selectedRoute: state.selectedRoute?.id === id ? null : state.selectedRoute,
      }));
      return res;
    } catch (err) {
      if (isNetworkError(err)) return;
      throw err;
    }
  },

  getFilteredRoutes: () => {
    const { routes, filters } = get();
    return routes.filter((route) => {
      if (filters.status && filters.status !== 'all' && route.status !== filters.status) return false;
      if (filters.driverId && route.driverId !== filters.driverId) return false;
      if (filters.search) {
        const term = filters.search.toLowerCase();
        return (
          route.code.toLowerCase().includes(term) ||
          route.name.toLowerCase().includes(term) ||
          (route.driverName?.toLowerCase().includes(term) ?? false)
        );
      }
      return true;
    });
  },
}));
