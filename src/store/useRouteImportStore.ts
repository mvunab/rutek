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

export type FormatEvalSignals = {
  detection: number;
  headers: number;
  rows: number;
  metadata: number;
};

export type FormatEvalRanking = {
  format_id: string;
  format_name: string;
  confidence: number;
  signals: FormatEvalSignals;
  active: boolean;
};

export type FormatEvalResult = {
  rankings: FormatEvalRanking[];
  selected_format_id: string | null;
  needs_manual_choice: boolean;
  threshold: number;
  reason: string;
};

export type RouteImportOpts = {
  routeName?: string;
  routeDate?: string;
  driverNameHint?: string;
  clientId?: string;
  routeNumber?: string | number;
  /** Plantilla Excel del tenant; si no se envía, el API usa la activa. */
  formatId?: string;
};

function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const p = JSON.parse(err.body) as { message?: string | string[] };
      if (typeof p.message === 'string') return p.message;
      if (Array.isArray(p.message)) return p.message.join(' · ');
    } catch {
      /* empty */
    }
    return err.body || `Error ${err.status}`;
  }
  return err instanceof Error ? err.message : fallback;
}

interface RouteImportStore {
  preview: ImportPreview | null;
  previewLoading: boolean;
  previewError: string | null;

  confirmLoading: boolean;
  confirmError: string | null;
  lastResult: ImportConfirmResult | null;

  formatEval: FormatEvalResult | null;
  evaluateLoading: boolean;

  evaluateFormats: (file: File) => Promise<FormatEvalResult | null>;
  fetchPreview: (file: File, opts?: { formatId?: string }) => Promise<ImportPreview | null>;
  confirmImport: (
    file: File,
    opts?: RouteImportOpts,
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
  formatEval: null,
  evaluateLoading: false,

  evaluateFormats: async (file) => {
    set({ evaluateLoading: true, formatEval: null, previewError: null });
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await api.postForm<FormatEvalResult>(
        '/route-import/evaluate',
        form,
      );
      set({ formatEval: result, evaluateLoading: false });
      return result;
    } catch (err) {
      if (isNetworkError(err)) {
        set({
          evaluateLoading: false,
          previewError: 'No se pudo conectar al servidor.',
        });
        return null;
      }
      set({
        evaluateLoading: false,
        previewError: formatApiError(err, 'No se pudo evaluar el Excel.'),
      });
      return null;
    }
  },

  fetchPreview: async (file, opts = {}) => {
    set({ previewLoading: true, previewError: null, preview: null });
    try {
      const form = new FormData();
      form.append('file', file);
      const params = new URLSearchParams();
      if (opts.formatId?.trim()) params.set('format_id', opts.formatId.trim());
      const qs = params.toString() ? `?${params.toString()}` : '';
      const result = await api.postForm<ImportPreview>(
        `/route-import/preview${qs}`,
        form,
      );
      set({ preview: result, previewLoading: false });
      return result;
    } catch (err) {
      if (isNetworkError(err)) {
        set({ previewLoading: false, previewError: 'No se pudo conectar al servidor.' });
        return null;
      }
      set({
        previewLoading: false,
        previewError: formatApiError(err, 'Error desconocido'),
      });
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
      if (opts.routeNumber != null && String(opts.routeNumber).trim() !== '') {
        params.set('route_number', String(opts.routeNumber).trim());
      }
      if (opts.formatId?.trim()) params.set('format_id', opts.formatId.trim());
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
      set({
        confirmLoading: false,
        confirmError: formatApiError(err, 'Error desconocido'),
      });
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
      formatEval: null,
      evaluateLoading: false,
    }),
}));
