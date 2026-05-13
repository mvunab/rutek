import { create } from 'zustand';
import type { ChartDataPoint, DashboardStats } from '../types';
import { api, isNetworkError } from '../lib/api';

const emptyStats: DashboardStats = {
  totalOrders: 0,
  ordersInTransit: 0,
  ordersDelivered: 0,
  ordersPending: 0,
  activeRoutes: 0,
  totalClients: 0,
  deliveryRate: 0,
  avgDeliveryTime: 0,
};

interface DashboardResponse {
  stats?: Partial<DashboardStats>;
  ordersChart?: ChartDataPoint[];
  statusChart?: ChartDataPoint[];
}

interface DashboardStore {
  stats: DashboardStats;
  ordersChart: ChartDataPoint[];
  statusChart: ChartDataPoint[];
  loading: boolean;
  loaded: boolean;
  fetchDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: emptyStats,
  ordersChart: [],
  statusChart: [],
  loading: false,
  loaded: false,

  fetchDashboard: async () => {
    set({ loading: true });
    try {
      const data = await api.get<DashboardResponse>('/dashboard/stats');
      set({
        stats: { ...emptyStats, ...(data?.stats ?? {}) },
        ordersChart: Array.isArray(data?.ordersChart) ? data.ordersChart : [],
        statusChart: Array.isArray(data?.statusChart) ? data.statusChart : [],
        loaded: true,
      });
    } catch (err) {
      if (isNetworkError(err)) {
        set({ stats: emptyStats, ordersChart: [], statusChart: [] });
        return;
      }
      set({
        stats: emptyStats,
        ordersChart: [],
        statusChart: [],
        loaded: true,
      });
    } finally {
      set({ loading: false });
    }
  },
}));
