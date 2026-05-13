import { create } from 'zustand';
import type { RoutePhoto } from '../types';
import { api, isNetworkError } from '../lib/api';

interface PhotoStore {
  photos: RoutePhoto[];
  loading: boolean;
  loaded: boolean;
  fetchPhotos: () => Promise<void>;
}

export const usePhotoStore = create<PhotoStore>((set) => ({
  photos: [],
  loading: false,
  loaded: false,

  fetchPhotos: async () => {
    set({ loading: true });
    try {
      const data = await api.get<RoutePhoto[]>('/route-photos');
      set({
        photos: Array.isArray(data) ? data : [],
        loaded: true,
      });
    } catch (err) {
      if (isNetworkError(err)) {
        set({ photos: [] });
        return;
      }
      set({ photos: [], loaded: true });
    } finally {
      set({ loading: false });
    }
  },
}));
