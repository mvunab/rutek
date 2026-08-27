import type { TrackingInfo } from '../../lib/trackingReport';
import type { TrackingPhoto } from '../../components/tracking/TrackingEvidenceGallery';

function resolveApi(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim().replace(/\/$/, '');
  if (import.meta.env.MODE === 'development') return 'http://localhost:4000';
  return '';
}

export type RouteTrackingInfo = {
  routeCode: string;
  routeNumber?: string;
  routeDisplay?: string;
  routeName: string;
  clientName: string;
  tenant: { name: string; logo: string | null };
  orders: Array<{
    code: string;
    status: string;
    bultos: number;
    clientName: string;
    destination: { city: string };
    numeroOc?: string | null;
    factura?: string | null;
    referencia?: string | null;
    receiverName?: string | null;
    receiverRut?: string | null;
    deliveredAt?: string | null;
    photos?: TrackingPhoto[];
  }>;
  expiresAt: string;
};

const orderTrackingCache = new Map<string, Promise<TrackingInfo>>();
const routeTrackingCache = new Map<string, Promise<RouteTrackingInfo>>();

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const ct = res.headers.get('content-type') ?? '';
  if (!res.ok) throw new Error('Token inválido o expirado');
  if (!ct.includes('application/json')) {
    throw new Error('Respuesta inválida del servidor');
  }
  return res.json() as Promise<T>;
}

/** Promise cache para `use()` — fuera de effects, sin carrera de setState. */
export function loadOrderTracking(token: string): Promise<TrackingInfo> {
  let pending = orderTrackingCache.get(token);
  if (!pending) {
    pending = fetchJson<TrackingInfo>(
      `${resolveApi()}/public/tracking/${encodeURIComponent(token)}`,
    ).catch((err) => {
      orderTrackingCache.delete(token);
      throw err;
    });
    orderTrackingCache.set(token, pending);
  }
  return pending;
}

export function loadRouteTracking(token: string): Promise<RouteTrackingInfo> {
  let pending = routeTrackingCache.get(token);
  if (!pending) {
    pending = fetchJson<RouteTrackingInfo>(
      `${resolveApi()}/public/route-tracking/${encodeURIComponent(token)}`,
    ).catch((err) => {
      routeTrackingCache.delete(token);
      throw err;
    });
    routeTrackingCache.set(token, pending);
  }
  return pending;
}
