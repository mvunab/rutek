import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2,
  Building2,
  MapPin,
  Package,
  Copy,
  Check,
  HelpCircle,
  Truck,
  XCircle,
} from 'lucide-react';
import { TRACKING_BRAND } from '../../lib/trackingTheme';
import { useForceLightTheme } from '../../hooks/useForceLightTheme';
import {
  TrackingOrderStatusMarker,
  trackingOrderAccentClass,
} from '../../components/tracking/TrackingOrderStatusMarker';
import { TrackingStatusLegend } from '../../components/tracking/TrackingStatusLegend';
import { RouteProgressWay } from '../../components/tracking/RouteProgressWay';
import { computeRouteProgress, orderWayStepIndex, ROUTE_WAY_STEP_LABELS } from '../../lib/routeTrackingReport';
import { formatDeliveryDateTime } from '../../lib/deliveryReceiver';
import { TrackingEvidenceGallery, type TrackingPhoto } from '../../components/tracking/TrackingEvidenceGallery';

const BX_BLUE = TRACKING_BRAND.blue;
const BX_LIGHT = TRACKING_BRAND.light;
const BX_DEW = TRACKING_BRAND.dew;

function resolveApi(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim().replace(/\/$/, '');
  if (import.meta.env.MODE === 'development') return 'http://localhost:4000';
  return '';
}

/** El token incluye un punto (body.sig); useParams() a veces lo trunca — leer desde pathname. */
function resolveRouteTrackingToken(paramToken?: string): string {
  const prefix = '/tracking/route/';
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path.startsWith(prefix)) {
    const fromPath = decodeURIComponent(path.slice(prefix.length));
    if (fromPath.includes('.')) return fromPath;
    if (fromPath.length > 0) return fromPath;
  }
  return paramToken ? decodeURIComponent(paramToken) : '';
}

type RouteTrackingInfo = {
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

export function RouteTrackingPage() {
  useForceLightTheme();
  const { token: paramToken } = useParams();
  const token = useMemo(() => resolveRouteTrackingToken(paramToken), [paramToken]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<RouteTrackingInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError('Token inválido');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${resolveApi()}/public/route-tracking/${encodeURIComponent(token)}`,
          { headers: { Accept: 'application/json' } },
        );
        const ct = res.headers.get('content-type') ?? '';
        if (!res.ok) throw new Error('Token inválido o expirado');
        if (!ct.includes('application/json')) {
          throw new Error('Respuesta inválida del servidor');
        }
        const data = (await res.json()) as RouteTrackingInfo;
        setInfo(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Token inválido o expirado');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [token]);

  const grouped = useMemo(() => {
    const map = new Map<string, RouteTrackingInfo['orders']>();
    for (const o of info?.orders ?? []) {
      const city = o.destination?.city?.trim() || '—';
      map.set(city, [...(map.get(city) ?? []), o]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [info?.orders]);

  const routeProgress = useMemo(
    () => computeRouteProgress(info?.orders ?? []),
    [info?.orders],
  );

  const publicUrl = useMemo(() => {
    if (!token) return '';
    try {
      return `${window.location.origin}/tracking/route/${encodeURIComponent(token)}`;
    } catch {
      return '';
    }
  }, [token]);

  const handleCopy = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center text-stone-900"
        style={{ colorScheme: 'light' }}
      >
        <div className="flex flex-col items-center gap-3 text-stone-500" role="status" aria-live="polite">
          <Loader2
            className="size-10 animate-spin motion-reduce:animate-none"
            style={{ color: BX_BLUE }}
            aria-hidden
          />
          <p className="text-sm font-medium">Cargando seguimiento…</p>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4 text-stone-900"
        style={{ colorScheme: 'light' }}
      >
        <article className="max-w-md w-full text-center bg-white rounded-2xl shadow-md p-8 border border-stone-100">
          <XCircle className="size-14 text-red-400 mx-auto mb-4" aria-hidden />
          <h1 className="text-xl font-extrabold text-stone-900">Link inválido o expirado</h1>
          <p className="text-sm text-stone-500 mt-2">{error}</p>
          <p className="text-xs text-stone-400 mt-2">Solicita un nuevo link al operador.</p>
        </article>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-stone-900" style={{ colorScheme: 'light' }}>
      <div className="mx-auto py-6 sm:py-8 px-4 max-w-[1256px]">
        <main className="space-y-6">
          {/* Encabezado tenant */}
          <div className="rounded-2xl bg-white shadow-md overflow-hidden p-4 sm:p-6">
            <div className="flex items-center gap-3">
              {info.tenant.logo ? (
                <img src={info.tenant.logo} alt="" className="h-9 w-auto" width={90} height={36} />
              ) : (
                <div
                  className="size-9 rounded-lg flex items-center justify-center"
                  style={{ background: BX_BLUE }}
                >
                  <Truck className="size-5 text-white" aria-hidden />
                </div>
              )}
              <div>
                <h1 className="font-bold text-base text-stone-900">Seguimiento de ruta</h1>
                <p className="text-sm text-stone-600 mt-0.5">{info.tenant.name}</p>
              </div>
            </div>
          </div>

          {/* Tarjeta principal */}
          <div
            className="flex flex-col rounded-2xl bg-white p-4 sm:p-6 space-y-5 overflow-hidden"
            style={{ boxShadow: '0 4px 12px 0 rgba(0,0,0,0.08)' }}
          >
            <div className="flex w-full items-start justify-between gap-3 flex-wrap">
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-xl sm:text-2xl font-extrabold leading-tight text-stone-900">
                  <span translate="no" className="block sm:inline break-words tabular-nums" style={{ color: BX_BLUE }}>
                    {info.routeDisplay ?? info.routeName ?? info.routeCode}
                  </span>
                </p>
                {info.routeName && info.routeDisplay ? (
                  <p className="mt-1 text-sm font-semibold text-stone-600 break-words">{info.routeName}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={16} className="text-stone-400" aria-hidden />
                    {info.clientName || '—'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Package size={16} className="text-stone-400" aria-hidden />
                    {info.orders.length} pedido{info.orders.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  aria-label="Compartir"
                  onClick={() => void handleCopy()}
                  className="inline-flex items-center justify-center rounded-xl border w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 font-medium bg-white hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ borderColor: BX_BLUE, color: BX_BLUE }}
                >
                  {copied ? <Check className="size-5 sm:mr-2" aria-hidden /> : <Copy className="size-5 sm:mr-2" aria-hidden />}
                  <span className="hidden sm:inline">{copied ? 'Copiado' : 'Compartir'}</span>
                </button>
                <button
                  type="button"
                  aria-label="Ayuda"
                  onClick={() => {
                    alert('Si necesitas ver direcciones completas, solicita esa información a tu operador.');
                  }}
                  className="inline-flex items-center justify-center rounded-xl border w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 font-medium bg-white hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ borderColor: BX_BLUE, color: BX_BLUE }}
                >
                  <HelpCircle className="size-5 sm:mr-2" aria-hidden />
                  <span className="hidden sm:inline">Ayuda</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl px-4 py-3 text-sm text-stone-600" style={{ background: BX_DEW }}>
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} className="text-stone-500" aria-hidden />
                Solo estados y ciudad de destino (sin direcciones completas).
              </span>
            </div>

            <div className="w-full rounded-xl border-[1.5px] p-3 sm:p-4" style={{ borderColor: BX_BLUE }}>
              <RouteProgressWay progress={routeProgress} />
            </div>

            <TrackingStatusLegend orders={info.orders} />
          </div>

          <div className="space-y-4">
            {grouped.map(([city, orders]) => (
              <div
                key={city}
                className="rounded-2xl bg-white overflow-hidden border border-stone-100"
                style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)' }}
              >
                <div
                  className="px-4 py-3 border-b border-stone-100 flex items-center gap-2"
                  style={{ background: BX_LIGHT }}
                >
                  <MapPin size={14} className="text-stone-500" aria-hidden />
                  <p className="text-sm font-semibold text-stone-800">{city}</p>
                  <span className="text-xs text-stone-500 tabular-nums">({orders.length})</span>
                </div>
                <ul className="divide-y divide-stone-100" role="list">
                  {orders.map((o) => (
                    <li
                      key={o.code}
                      className={`px-4 py-3 border-l-4 bg-white ${trackingOrderAccentClass(o.status)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <span translate="no" className="font-mono text-xs font-bold text-stone-800">
                              {o.code}
                            </span>
                            <span className="text-[11px] text-stone-500 tabular-nums">
                              {Number(o.bultos) || 0} bulto{(Number(o.bultos) || 0) === 1 ? '' : 's'}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 truncate mt-0.5">
                            Destinatario: {o.clientName?.trim() || 'Por confirmar'}
                          </p>
                          {(o.numeroOc || o.factura || o.referencia) ? (
                            <p className="text-[11px] text-stone-600 mt-1 break-words">
                              {[
                                o.numeroOc ? `OC: ${o.numeroOc}` : null,
                                o.factura ? `Factura: ${o.factura}` : null,
                                o.referencia ? `Ref: ${o.referencia}` : null,
                              ].filter(Boolean).join(' · ')}
                            </p>
                          ) : null}
                          {(o.receiverName || o.receiverRut) ? (
                            <p className="text-[11px] text-emerald-700 mt-0.5 break-words">
                              Recibido por: {o.receiverName?.trim() || '—'}
                              {o.receiverRut?.trim() ? (
                                <span translate="no" className="tabular-nums"> · RUT {o.receiverRut.trim()}</span>
                              ) : null}
                            </p>
                          ) : null}
                          {o.deliveredAt ? (
                            <p className="text-[11px] text-stone-600 mt-0.5 tabular-nums">
                              Entregado: {formatDeliveryDateTime(o.deliveredAt)}
                            </p>
                          ) : null}
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Etapa ruta:{' '}
                            <span className="font-semibold text-stone-600">
                              {ROUTE_WAY_STEP_LABELS[orderWayStepIndex(o.status, routeProgress.activeIndex)] ?? '—'}
                            </span>
                          </p>
                          <TrackingEvidenceGallery
                            photos={o.photos}
                            compact
                            title={
                              o.status === 'rejected'
                                ? 'Evidencias del rechazo'
                                : 'Evidencias'
                            }
                          />
                        </div>
                        <TrackingOrderStatusMarker status={o.status} className="shrink-0" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </main>

        <footer className="text-center py-6 text-xs text-stone-400">
          <p>
            Reporte válido hasta{' '}
            {new Date(info.expiresAt).toLocaleDateString('es-CL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="mt-1">Powered by Rutek</p>
        </footer>
      </div>
    </div>
  );
}
