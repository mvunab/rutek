import { create } from 'zustand';
import type { Route, RouteFilters, RouteStatus } from '../types';
import { mockRoutes } from '../data/mockData';

interface RouteStore {
  routes: Route[];
  selectedRoute: Route | null;
  filters: RouteFilters;
  setFilters: (filters: Partial<RouteFilters>) => void;
  resetFilters: () => void;
  selectRoute: (route: Route | null) => void;
  addRoute: (route: Omit<Route, 'id' | 'code' | 'createdAt' | 'tenantId'>) => void;
  updateRoute: (id: string, data: Partial<Route>) => void;
  updateRouteStatus: (id: string, status: RouteStatus) => void;
  assignDriver: (routeId: string, driverId: string, driverName: string) => void;
  assignVehicle: (routeId: string, vehicleId: string, vehiclePlate: string) => void;
  addOrderToRoute: (routeId: string, orderId: string) => void;
  deleteRoute: (id: string) => void;
  getFilteredRoutes: () => Route[];
}

const defaultFilters: RouteFilters = {
  status: 'all',
  search: '',
};

export const useRouteStore = create<RouteStore>((set, get) => ({
  routes: mockRoutes,
  selectedRoute: null,
  filters: defaultFilters,

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  resetFilters: () => set({ filters: defaultFilters }),

  selectRoute: (route) => set({ selectedRoute: route }),

  addRoute: (data) => {
    const count = get().routes.length + 1;
    const code = `RUT-2024-${String(count).padStart(3, '0')}`;
    const newRoute: Route = {
      ...data,
      id: `route-${Date.now()}`,
      code,
      tenantId: 'tenant-001',
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ routes: [newRoute, ...state.routes] }));
  },

  updateRoute: (id, data) => {
    set((state) => ({
      routes: state.routes.map((r) => (r.id === id ? { ...r, ...data } : r)),
      selectedRoute: state.selectedRoute?.id === id
        ? { ...state.selectedRoute, ...data }
        : state.selectedRoute,
    }));
  },

  updateRouteStatus: (id, status) => {
    const updates: Partial<Route> = { status };
    if (status === 'active') updates.startTime = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    if (status === 'completed') updates.endTime = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    get().updateRoute(id, updates);
  },

  assignDriver: (routeId, driverId, driverName) => {
    get().updateRoute(routeId, { driverId, driverName });
  },

  assignVehicle: (routeId, vehicleId, vehiclePlate) => {
    get().updateRoute(routeId, { vehicleId, vehiclePlate });
  },

  addOrderToRoute: (routeId, orderId) => {
    set((state) => ({
      routes: state.routes.map((r) =>
        r.id === routeId
          ? { ...r, orderIds: [...r.orderIds, orderId] }
          : r
      ),
    }));
  },

  deleteRoute: (id) => {
    set((state) => ({
      routes: state.routes.filter((r) => r.id !== id),
      selectedRoute: state.selectedRoute?.id === id ? null : state.selectedRoute,
    }));
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
