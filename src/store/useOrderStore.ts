import { create } from 'zustand';
import type { Order, OrderFilters, OrderStatus } from '../types';
import { api, isNetworkError } from '../lib/api';

interface OrderStore {
  orders: Order[];
  selectedOrder: Order | null;
  filters: OrderFilters;
  loading: boolean;
  loaded: boolean;
  fetchOrders: () => Promise<void>;
  setFilters: (filters: Partial<OrderFilters>) => void;
  resetFilters: () => void;
  selectOrder: (order: Order | null) => void;
  addOrder: (order: Omit<Order, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'tenantId'>) => Promise<void>;
  updateOrder: (id: string, data: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  assignToRoute: (orderId: string, routeId: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getFilteredOrders: () => Order[];
}

const defaultFilters: OrderFilters = {
  status: 'all',
  priority: 'all',
  search: '',
};

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  selectedOrder: null,
  filters: defaultFilters,
  loading: false,
  loaded: false,

  fetchOrders: async () => {
    set({ loading: true });
    try {
      const data = await api.get<Order[]>('/orders');
      set({ orders: Array.isArray(data) ? data : [], loaded: true });
    } catch (err) {
      if (isNetworkError(err)) {
        set({ orders: [] });
        return;
      }
      // Endpoint no disponible o error → lista vacía
      set({ orders: [], loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  resetFilters: () => set({ filters: defaultFilters }),

  selectOrder: (order) => set({ selectedOrder: order }),

  addOrder: async (data) => {
    try {
      const created = await api.post<Order>('/orders', data);
      set((state) => ({ orders: [created, ...state.orders] }));
    } catch (err) {
      if (isNetworkError(err)) return;
      throw err;
    }
  },

  updateOrder: async (id, data) => {
    try {
      const updated = await api.patch<Order>(`/orders/${id}`, data);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? updated : o)),
        selectedOrder: state.selectedOrder?.id === id ? updated : state.selectedOrder,
      }));
    } catch (err) {
      if (isNetworkError(err)) return;
      throw err;
    }
  },

  updateOrderStatus: async (id, status) => {
    await get().updateOrder(id, {
      status,
      ...(status === 'delivered' ? { actualDelivery: new Date().toISOString().split('T')[0] } : {}),
    });
  },

  assignToRoute: async (orderId, routeId) => {
    await get().updateOrder(orderId, { routeId, status: 'confirmed' });
  },

  deleteOrder: async (id) => {
    try {
      await api.del(`/orders/${id}`);
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id),
        selectedOrder: state.selectedOrder?.id === id ? null : state.selectedOrder,
      }));
    } catch (err) {
      if (isNetworkError(err)) return;
      throw err;
    }
  },

  getFilteredOrders: () => {
    const { orders, filters } = get();
    return orders.filter((order) => {
      if (filters.status && filters.status !== 'all' && order.status !== filters.status) return false;
      if (filters.priority && filters.priority !== 'all' && order.priority !== filters.priority) return false;
      if (filters.clientId && order.clientId !== filters.clientId) return false;
      if (filters.search) {
        const term = filters.search.toLowerCase();
        return (
          order.code.toLowerCase().includes(term) ||
          order.clientName.toLowerCase().includes(term) ||
          order.destination.city.toLowerCase().includes(term)
        );
      }
      return true;
    });
  },
}));
