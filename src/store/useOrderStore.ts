import { create } from 'zustand';
import type { Order, OrderFilters, OrderStatus } from '../types';
import { mockOrders } from '../data/mockData';

interface OrderStore {
  orders: Order[];
  selectedOrder: Order | null;
  filters: OrderFilters;
  setFilters: (filters: Partial<OrderFilters>) => void;
  resetFilters: () => void;
  selectOrder: (order: Order | null) => void;
  addOrder: (order: Omit<Order, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'tenantId'>) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  assignToRoute: (orderId: string, routeId: string) => void;
  deleteOrder: (id: string) => void;
  getFilteredOrders: () => Order[];
}

const defaultFilters: OrderFilters = {
  status: 'all',
  priority: 'all',
  search: '',
};

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: mockOrders,
  selectedOrder: null,
  filters: defaultFilters,

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  resetFilters: () => set({ filters: defaultFilters }),

  selectOrder: (order) => set({ selectedOrder: order }),

  addOrder: (data) => {
    const count = get().orders.length + 1;
    const code = `PED-2024-${String(count).padStart(4, '0')}`;
    const newOrder: Order = {
      ...data,
      id: `order-${Date.now()}`,
      code,
      tenantId: 'tenant-001',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ orders: [newOrder, ...state.orders] }));
  },

  updateOrder: (id, data) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, ...data, updatedAt: new Date().toISOString().split('T')[0] } : o
      ),
      selectedOrder: state.selectedOrder?.id === id
        ? { ...state.selectedOrder, ...data }
        : state.selectedOrder,
    }));
  },

  updateOrderStatus: (id, status) => {
    get().updateOrder(id, {
      status,
      ...(status === 'delivered' ? { actualDelivery: new Date().toISOString().split('T')[0] } : {}),
    });
  },

  assignToRoute: (orderId, routeId) => {
    get().updateOrder(orderId, { routeId, status: 'confirmed' });
  },

  deleteOrder: (id) => {
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
      selectedOrder: state.selectedOrder?.id === id ? null : state.selectedOrder,
    }));
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
