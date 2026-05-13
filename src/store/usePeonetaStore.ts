import { create } from 'zustand';
import type { Peoneta } from '../types';
import { api, isNetworkError } from '../lib/api';

interface PeonetaStore {
  peonetas: Peoneta[];
  loading: boolean;
  loaded: boolean;
  fetchPeonetas: () => Promise<void>;
  createPeoneta: (data: Omit<Peoneta, 'id' | 'tenantId' | 'createdAt'>) => Promise<Peoneta | null>;
  updatePeoneta: (id: string, patch: Partial<Peoneta>) => Promise<Peoneta | null>;
  deletePeoneta: (id: string) => Promise<boolean>;
}

export const usePeonetaStore = create<PeonetaStore>((set, get) => ({
  peonetas: [],
  loading: false,
  loaded: false,

  fetchPeonetas: async () => {
    set({ loading: true });
    try {
      const data = await api.get<Peoneta[]>('/peonetas');
      set({
        peonetas: Array.isArray(data) ? data : [],
        loaded: true,
      });
    } catch (err) {
      if (isNetworkError(err)) {
        set({ peonetas: [] });
        return;
      }
      set({ peonetas: [], loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  createPeoneta: async (data) => {
    try {
      const created = await api.post<Peoneta>('/peonetas', data);
      set((state) => ({ peonetas: [created, ...state.peonetas] }));
      return created;
    } catch {
      return null;
    }
  },

  updatePeoneta: async (id, patch) => {
    try {
      const updated = await api.patch<Peoneta>(`/peonetas/${id}`, patch);
      set((state) => ({
        peonetas: state.peonetas.map((p) => (p.id === id ? updated : p)),
      }));
      return updated;
    } catch {
      const current = get().peonetas.find((p) => p.id === id);
      if (current) {
        const merged = { ...current, ...patch };
        set((state) => ({
          peonetas: state.peonetas.map((p) => (p.id === id ? merged : p)),
        }));
      }
      return null;
    }
  },

  deletePeoneta: async (id) => {
    try {
      await api.del(`/peonetas/${id}`);
      set((state) => ({
        peonetas: state.peonetas.filter((p) => p.id !== id),
      }));
      return true;
    } catch {
      return false;
    }
  },
}));
