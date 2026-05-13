import { create } from 'zustand';
import type { DeliveryRecord } from '../types';
import { api, isNetworkError } from '../lib/api';

interface DeliveryStore {
  records: DeliveryRecord[];
  loading: boolean;
  loaded: boolean;
  fetchRecords: () => Promise<void>;
}

export const useDeliveryStore = create<DeliveryStore>((set) => ({
  records: [],
  loading: false,
  loaded: false,

  fetchRecords: async () => {
    set({ loading: true });
    try {
      const data = await api.get<DeliveryRecord[]>('/deliveries');
      set({
        records: Array.isArray(data) ? data : [],
        loaded: true,
      });
    } catch (err) {
      if (isNetworkError(err)) {
        set({ records: [] });
        return;
      }
      set({ records: [], loaded: true });
    } finally {
      set({ loading: false });
    }
  },
}));
