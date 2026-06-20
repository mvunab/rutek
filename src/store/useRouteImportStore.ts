import { create } from 'zustand';
import { api, ApiError, isNetworkError } from '../lib/api';

export interface ImportPreviewRow {
  client_name: string;
  entrega: string;
  numero_oc: string;
  factura: string;
  ref_factura: string;
  tipo: string;
  cajas: number;
  unidades: number;
}

export interface ImportPreview {
  route_number: number | string;
  transport_company: string;
  flete_type: string;
  total_bultos_declared: number;
  route_date: string | null;
  driver_name_hint: string;
  rows: ImportPreviewRow[];
}

export interface ImportConfirmResult {
  route_id: string;
  route_code: string;
  route_number?: number | string;
  route_name: string;
  orders_created: number;
  client_name: string;
  backup_url: string;
}

interface RouteImportStore {
  preview: ImportPreview | null;
  previewLoading: boolean;
  previewError: string | null;

  confirmLoading: boolean;
  confirmError: string | null;
  lastResult: ImportConfirmResult | null;

  fetchPreview: (file: File) => Promise<ImportPreview | null>;
  confirmImport: (
    file: File,
    opts?: {
      routeName?: string;
      routeDate?: string;
      driverNameHint?: string;
      clientId?: string;
    },
  ) => Promise<ImportConfirmResult | null>;
  reset: () => void;
}

export const useRouteImportStore = create<RouteImportStore>((set) => ({
  preview: null,
  previewLoading: false,
  previewError: null,
  confirmLoading: false,
  confirmError: null,
  lastResult: null,

  fetchPreview: async (file) => {
    set({ previewLoading: true, previewError: null, preview: null });
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await api.postForm<ImportPreview>('/route-import/preview', form);
      set({ preview: result, previewLoading: false });
      return result;
    } catch (err) {
      if (isNetworkError(err)) {
        set({ previewLoading: false, previewError: 'No se pudo conectar al servidor.' });
        return null;
      }
      const msg =
        err instanceof ApiError
          ? (() => {
              try {
                const p = JSON.parse(err.body) as { message?: string | string[] };
                if (typeof p.message === 'string') return p.message;
                if (Array.isArray(p.message)) return p.message.join(' · ');
              } catch { /* empty */ }
              return err.body || `Error ${err.status}`;
            })()
          : (err instanceof Error ? err.message : 'Error desconocido');
      set({ previewLoading: false, previewError: msg });
      return null;
    }
  },

  confirmImport: async (file, opts = {}) => {
    set({ confirmLoading: true, confirmError: null });
    try {
      const form = new FormData();
      form.append('file', file);
      const params = new URLSearchParams();
      if (opts.routeName) params.set('route_name', opts.routeName);
      if (opts.routeDate) params.set('route_date', opts.routeDate);
      if (opts.driverNameHint) params.set('driver_name_hint', opts.driverNameHint);
      if (opts.clientId) params.set('client_id', opts.clientId);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const result = await api.postForm<ImportConfirmResult>(
        `/route-import/confirm${qs}`,
        form,
      );
      set({ confirmLoading: false, lastResult: result });
      return result;
    } catch (err) {
      if (isNetworkError(err)) {
        set({ confirmLoading: false, confirmError: 'No se pudo conectar al servidor.' });
        return null;
      }
      const msg =
        err instanceof ApiError
          ? (() => {
              try {
                const p = JSON.parse(err.body) as { message?: string | string[] };
                if (typeof p.message === 'string') return p.message;
                if (Array.isArray(p.message)) return p.message.join(' · ');
              } catch { /* empty */ }
              return err.body || `Error ${err.status}`;
            })()
          : (err instanceof Error ? err.message : 'Error desconocido');
      set({ confirmLoading: false, confirmError: msg });
      return null;
    }
  },

  reset: () =>
    set({
      preview: null,
      previewLoading: false,
      previewError: null,
      confirmLoading: false,
      confirmError: null,
      lastResult: null,
    }),
}));
