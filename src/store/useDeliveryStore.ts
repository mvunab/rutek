import { create } from 'zustand';
import type { DeliveryRecord, DeliveryStatus } from '../types';
import { api, isNetworkError } from '../lib/api';
import type { DbDeliveryRecord } from '../types/api';

const VALID_STATUS: DeliveryStatus[] = [
  'entregado',
  'pendiente',
  'en_ruta',
  'reprogramado',
  'rechazado',
  'parcial',
];

function normalizeEstado(raw: string): DeliveryStatus {
  const k = raw.trim().toLowerCase().replace(/\s+/g, '_') as DeliveryStatus;
  return VALID_STATUS.includes(k) ? k : 'pendiente';
}

function toDeliveryRecord(r: DbDeliveryRecord): DeliveryRecord {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    estado: normalizeEstado(r.estado),
    cliente: r.cliente,
    entrega: r.entrega,
    pedido: r.pedido,
    factura: r.factura ?? '',
    tipo: r.tipo,
    ref: r.ref,
    bultos: r.bultos,
    rut: r.rut,
    recepcion: r.recepcion ?? '',
    fechaHora: r.fecha_hora ?? undefined,
    chofer: r.chofer ?? '',
    vehiculo: r.vehiculo ?? '',
    peoneta: r.peoneta ?? '',
    obs: r.obs ?? '',
    zona: r.zona ?? '',
    routeId: r.route_id ?? undefined,
    orderId: r.order_id ?? undefined,
  };
}

interface DeliveryStore {
  records: DeliveryRecord[];
  loading: boolean;
  loaded: boolean;
  fetchRecords: (opts?: { routeId?: string; estado?: string }) => Promise<void>;
}

export const useDeliveryStore = create<DeliveryStore>((set) => ({
  records: [],
  loading: false,
  loaded: false,

  fetchRecords: async (opts) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (opts?.estado) params.set('estado', opts.estado);
      if (opts?.routeId) params.set('route_id', opts.routeId);
      const qs = params.toString();
      const path = qs ? `/delivery-records?${qs}` : '/delivery-records';
      const data = await api.get<DbDeliveryRecord[]>(path);
      set({
        records: Array.isArray(data) ? data.map(toDeliveryRecord) : [],
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
