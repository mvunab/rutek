import { create } from 'zustand';
import type { PhotoType, RoutePhoto } from '../types';
import { api, isNetworkError } from '../lib/api';
import { normalizeMediaUrl } from '../lib/mediaUrl';

interface PhotoStore {
  photos: RoutePhoto[];
  loading: boolean;
  loaded: boolean;
  fetchPhotos: () => Promise<void>;
}

function mapPhotoType(raw: string): PhotoType {
  if (raw === 'evidence') return 'entrega';
  if (raw === 'signature') return 'firma';
  if (['entrega', 'recepcion', 'dano', 'firma', 'otro'].includes(raw)) {
    return raw as PhotoType;
  }
  return 'otro';
}

export function mapRoutePhotoFromApi(row: Record<string, unknown>): RoutePhoto {
  return {
    id: String(row.id ?? ''),
    tenantId: String(row.tenant_id ?? ''),
    routeCode: String(row.route_code ?? ''),
    routeId: String(row.route_id ?? ''),
    routeName: row.route_name != null ? String(row.route_name) : undefined,
    routeStatus: row.route_status != null ? String(row.route_status) : undefined,
    orderId: String(row.order_id ?? ''),
    orderCode: String(row.order_code ?? ''),
    orderStatus: row.order_status != null ? String(row.order_status) : undefined,
    driverName: String(row.driver_name ?? ''),
    vehiclePlate: String(row.vehicle_plate ?? ''),
    fecha: String(row.fecha ?? ''),
    hora: String(row.hora ?? ''),
    photoUrl: normalizeMediaUrl(String(row.photo_url ?? '')),
    thumbnailUrl: normalizeMediaUrl(String(row.thumbnail_url ?? '')),
    type: mapPhotoType(String(row.type ?? 'otro')),
    description: String(row.description ?? ''),
    clientName: String(row.client_name ?? ''),
  };
}

export const usePhotoStore = create<PhotoStore>((set) => ({
  photos: [],
  loading: false,
  loaded: false,

  fetchPhotos: async () => {
    set({ loading: true });
    try {
      const data = await api.get<Record<string, unknown>[]>('/route-photos');
      const rows = Array.isArray(data) ? data : [];
      set({
        photos: rows.map(mapRoutePhotoFromApi),
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
