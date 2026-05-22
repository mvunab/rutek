import { create } from 'zustand';
import type { Order, OrderFilters, OrderItem } from '../types';
import { api, isNetworkError } from '../lib/api';

/** Alta de pedido: siempre incluye la ruta (`route_id` obligatorio en API). */
export type OrderCreatePayload = Omit<
  Order,
  'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'code'
> & { routeId: string };

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
  addOrder: (input: OrderCreatePayload) => Promise<Order | undefined>;
  updateOrder: (id: string, data: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  assignToRoute: (orderId: string, routeId: string) => Promise<void>;
  /** Quita el pedido de la ruta (`route_id` null) y lo deja pendiente. */
  detachOrderFromRoute: (orderId: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getFilteredOrders: () => Order[];
}

const defaultFilters: OrderFilters = {
  status: 'all',
  priority: 'all',
  search: '',
};

function isoDateOnlyFromDelivery(raw: string): string {
  const d = raw.includes('T') ? raw.split('T')[0] : raw.slice(0, 10);
  return d ?? raw;
}

function mapOrderFromApi(row: Record<string, unknown>): Order {
  const itemsRaw = row.items;
  const items = Array.isArray(itemsRaw)
    ? (itemsRaw as OrderItem[])
    : ([] as OrderItem[]);
  const est = row.estimated_delivery;
  const estStr =
    typeof est === 'string'
      ? isoDateOnlyFromDelivery(est)
      : '';

  const act = row.actual_delivery;

  return {
    id: String(row.id ?? ''),
    tenantId: String(row.tenant_id ?? ''),
    code: String(row.code ?? ''),
    clientId: String(row.client_id ?? ''),
    clientName: String(row.client_name ?? ''),
    status: row.status as Order['status'],
    priority: row.priority as Order['priority'],
    origin: {
      street: String(row.origin_street ?? ''),
      city: String(row.origin_city ?? ''),
      region: String(row.origin_region ?? ''),
    },
    destination: {
      street: String(row.destination_street ?? ''),
      city: String(row.destination_city ?? ''),
      region: String(row.destination_region ?? ''),
    },
    items,
    totalWeight: Number(row.total_weight ?? 0),
    totalVolume: Number(row.total_volume ?? 0),
    estimatedDelivery: estStr,
    actualDelivery:
      act != null && String(act)
        ? isoDateOnlyFromDelivery(String(act))
        : undefined,
    routeId:
      row.route_id != null && String(row.route_id)
        ? String(row.route_id)
        : undefined,
    bultos: Number(row.bultos ?? 0),
    dispatchGuideUrl:
      row.dispatch_guide_url != null && String(row.dispatch_guide_url).trim()
        ? String(row.dispatch_guide_url).trim()
        : undefined,
    notes: row.notes != null ? String(row.notes) : undefined,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
    driverId: row.driver_id != null ? String(row.driver_id) : null,
    driverName: row.driver_name != null ? String(row.driver_name) : null,
    peonetaId: row.peoneta_id != null ? String(row.peoneta_id) : null,
    peonetaName: row.peoneta_name != null ? String(row.peoneta_name) : null,
    vehicleId: row.vehicle_id != null ? String(row.vehicle_id) : null,
    vehiclePlate: row.vehicle_plate != null ? String(row.vehicle_plate) : null,
  };
}

function buildCreateOrderBody(input: OrderCreatePayload): Record<string, unknown> {
  const code = `ENT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  let estimatedIso: string;
  try {
    estimatedIso =
      input.estimatedDelivery?.length >= 10
        ? new Date(`${input.estimatedDelivery}T12:00:00`).toISOString()
        : new Date().toISOString();
  } catch {
    estimatedIso = new Date().toISOString();
  }

  return {
    code,
    client_id: input.clientId,
    client_name: input.clientName,
    status: input.status,
    priority: input.priority,
    origin_street: input.origin.street,
    origin_city: input.origin.city,
    origin_region: input.origin.region,
    destination_street: input.destination.street,
    destination_city: input.destination.city,
    destination_region: input.destination.region,
    items: input.items ?? [],
    total_weight: input.totalWeight,
    total_volume: input.totalVolume,
    estimated_delivery: estimatedIso,
    route_id: input.routeId,
    bultos: Number(input.bultos ?? 0),
    ...(input.dispatchGuideUrl?.trim()
      ? { dispatch_guide_url: input.dispatchGuideUrl.trim() }
      : {}),
    ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
  };
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  selectedOrder: null,
  filters: defaultFilters,
  loading: false,
  loaded: false,

  fetchOrders: async () => {
    set({ loading: true });
    try {
      const data = await api.get<Record<string, unknown>[]>('/orders');
      set({
        orders: Array.isArray(data) ? data.map(mapOrderFromApi) : [],
        loaded: true,
      });
    } catch (err) {
      if (isNetworkError(err)) {
        set({ orders: [] });
        return;
      }
      set({ orders: [], loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  resetFilters: () => set({ filters: defaultFilters }),

  selectOrder: (order) => set({ selectedOrder: order }),

  addOrder: async (input) => {
    try {
      const body = buildCreateOrderBody(input);
      const created = await api.post<Record<string, unknown>>('/orders', body);
      const mapped = mapOrderFromApi(created);
      set((state) => ({
        orders: [mapped, ...state.orders],
      }));
      return mapped;
    } catch (err) {
      if (isNetworkError(err)) return undefined;
      throw err;
    }
  },

  updateOrder: async (id, data) => {
    try {
      const body: Record<string, unknown> = {};
      if (data.status !== undefined) body.status = data.status;
      if (data.priority !== undefined) body.priority = data.priority;
      if (data.routeId !== undefined) body.route_id = data.routeId;
      if (data.actualDelivery !== undefined) {
        body.actual_delivery = data.actualDelivery;
      }
      if (data.notes !== undefined) body.notes = data.notes ?? null;
      if (data.bultos !== undefined) body.bultos = data.bultos;
      if (data.dispatchGuideUrl !== undefined) {
        body.dispatch_guide_url =
          data.dispatchGuideUrl.trim() === '' ? null : data.dispatchGuideUrl.trim();
      }

      if (data.clientId !== undefined) body.client_id = data.clientId;
      if (data.clientName !== undefined) body.client_name = data.clientName;
      if (data.driverId !== undefined) body.driver_id = data.driverId;
      if (data.driverName !== undefined) body.driver_name = data.driverName;
      if (data.peonetaId !== undefined) body.peoneta_id = data.peonetaId;
      if (data.peonetaName !== undefined) body.peoneta_name = data.peonetaName;
      if (data.vehicleId !== undefined) body.vehicle_id = data.vehicleId;
      if (data.vehiclePlate !== undefined) body.vehicle_plate = data.vehiclePlate;
      if (data.origin !== undefined) {
        body.origin_street = data.origin.street;
        body.origin_city = data.origin.city;
        body.origin_region = data.origin.region;
      }
      if (data.destination !== undefined) {
        body.destination_street = data.destination.street;
        body.destination_city = data.destination.city;
        body.destination_region = data.destination.region;
      }
      if (data.items !== undefined) body.items = data.items;
      if (data.totalWeight !== undefined) body.total_weight = data.totalWeight;
      if (data.totalVolume !== undefined) body.total_volume = data.totalVolume;
      if (
        data.estimatedDelivery !== undefined &&
        data.estimatedDelivery.length >= 10
      ) {
        try {
          body.estimated_delivery = new Date(
            `${data.estimatedDelivery}T12:00:00`,
          ).toISOString();
        } catch {
          // omit invalid date
        }
      }

      if (Object.keys(body).length === 0) return;

      const updated = await api.patch<Record<string, unknown>>(
        `/orders/${id}`,
        body,
      );
      const mapped = mapOrderFromApi(updated);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? mapped : o)),
        selectedOrder:
          state.selectedOrder?.id === id ? mapped : state.selectedOrder,
      }));
    } catch (err) {
      if (isNetworkError(err)) return;
      throw err;
    }
  },

  updateOrderStatus: async (id, status) => {
    await get().updateOrder(id, {
      status,
      ...(status === 'delivered'
        ? {
            actualDelivery:
              new Date().toISOString().split('T')[0],
          }
        : {}),
    });
  },

  assignToRoute: async (orderId, routeId) => {
    await get().updateOrder(orderId, { routeId, status: 'pending' });
  },

  detachOrderFromRoute: async (orderId) => {
    try {
      const updated = await api.patch<Record<string, unknown>>(
        `/orders/${orderId}`,
        { route_id: null, status: 'pending' },
      );
      const mapped = mapOrderFromApi(updated);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? mapped : o)),
        selectedOrder:
          state.selectedOrder?.id === orderId ? mapped : state.selectedOrder,
      }));
    } catch (err) {
      if (isNetworkError(err)) return;
      throw err;
    }
  },

  deleteOrder: async (id) => {
    try {
      await api.del(`/orders/${id}`);
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id),
        selectedOrder:
          state.selectedOrder?.id === id ? null : state.selectedOrder,
      }));
    } catch (err) {
      if (isNetworkError(err)) return;
      throw err;
    }
  },

  getFilteredOrders: () => {
    const { orders, filters } = get();
    return orders.filter((order) => {
      if (
        filters.status &&
        filters.status !== 'all' &&
        order.status !== filters.status
      )
        return false;
      if (
        filters.priority &&
        filters.priority !== 'all' &&
        order.priority !== filters.priority
      )
        return false;
      if (filters.clientId && order.clientId !== filters.clientId)
        return false;
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
