import { create } from 'zustand';
import type { Route, RouteFilters, RouteStatus } from '../types';
import { api, isNetworkError } from '../lib/api';

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
  addRoute: (route: Omit<Route, 'id' | 'code' | 'createdAt' | 'tenantId'>) => Promise<void>;
  updateRoute: (id: string, data: Partial<Route>) => Promise<void>;
  updateRouteStatus: (id: string, status: RouteStatus) => Promise<void>;
  assignDriver: (routeId: string, driverId: string, driverName: string) => Promise<void>;
  assignVehicle: (routeId: string, vehicleId: string, vehiclePlate: string) => Promise<void>;
  addOrderToRoute: (routeId: string, orderId: string) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
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
      const data = await api.get<Route[]>('/routes');
      set({ routes: Array.isArray(data) ? data : [], loaded: true });
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

  addRoute: async (data) => {
    try {
      const created = await api.post<Route>('/routes', data);
      set((state) => ({ routes: [created, ...state.routes] }));
    } catch (err) {
      if (isNetworkError(err)) return;
      throw err;
    }
  },

  updateRoute: async (id, data) => {
    try {
      const updated = await api.patch<Route>(`/routes/${id}`, data);
      set((state) => ({
        routes: state.routes.map((r) => (r.id === id ? updated : r)),
        selectedRoute: state.selectedRoute?.id === id ? updated : state.selectedRoute,
      }));
    } catch (err) {
      if (isNetworkError(err)) return;
      throw err;
    }
  },

  updateRouteStatus: async (id, status) => {
    const updates: Partial<Route> = { status };
    if (status === 'active') updates.startTime = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    if (status === 'completed') updates.endTime = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    await get().updateRoute(id, updates);
  },

  assignDriver: async (routeId, driverId, driverName) => {
    await get().updateRoute(routeId, { driverId, driverName });
  },

  assignVehicle: async (routeId, vehicleId, vehiclePlate) => {
    await get().updateRoute(routeId, { vehicleId, vehiclePlate });
  },

  addOrderToRoute: async (routeId, orderId) => {
    const current = get().routes.find((r) => r.id === routeId);
    if (!current) return;
    await get().updateRoute(routeId, { orderIds: [...current.orderIds, orderId] });
  },

  deleteRoute: async (id) => {
    try {
      await api.del(`/routes/${id}`);
      set((state) => ({
        routes: state.routes.filter((r) => r.id !== id),
        selectedRoute: state.selectedRoute?.id === id ? null : state.selectedRoute,
      }));
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
