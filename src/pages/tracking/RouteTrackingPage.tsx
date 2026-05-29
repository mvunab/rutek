import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Building2, MapPin, Package, Copy, Check, Share2, HelpCircle } from 'lucide-react';

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
  routeName: string;
  clientName: string;
  tenant: { name: string; logo: string | null };
  orders: Array<{
    code: string;
    status: string;
    bultos: number;
    clientName: string;
    destination: { city: string };
  }>;
  expiresAt: string;
};

export function RouteTrackingPage() {
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

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <div className="flex flex-col glass-card p-6 space-y-4 overflow-hidden">
          <div className="flex w-full items-start justify-between gap-3">
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-2xl font-extrabold leading-tight text-stone-900 dark:text-stone-50">
                Seguimiento de la ruta{' '}
                <span
                  translate="no"
                  className="block md:inline text-violet-700 dark:text-violet-300 font-mono text-2xl break-words"
                >
                  {info?.routeCode || '—'}
                </span>
              </p>
              <p className="mt-1 md:mt-2 text-stone-600 dark:text-stone-300 font-semibold break-words">
                {info?.routeName || '—'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Building2 size={16} className="text-stone-400" aria-hidden />
                <span className="text-stone-500 dark:text-stone-400 font-extrabold text-xs md:text-sm truncate">
                  {info?.tenant?.name || '—'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                aria-label="Compartir"
                onClick={handleCopy}
                className="inline-flex items-center justify-center rounded-xl border border-violet-600/60 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 text-violet-700 dark:text-violet-200 font-medium bg-white dark:bg-stone-900 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
                <span className="hidden md:inline ml-2">{copied ? 'Copiado' : 'Compartir'}</span>
              </button>
              <button
                type="button"
                aria-label="Preguntas frecuentes"
                onClick={() => {
                  alert('Si necesitas ver direcciones completas, solicita esa información a tu operador.');
                }}
                className="inline-flex items-center justify-center rounded-xl border border-violet-600/60 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 text-violet-700 dark:text-violet-200 font-medium bg-white dark:bg-stone-900 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <HelpCircle size={18} aria-hidden />
                <span className="hidden md:inline ml-2">Ayuda</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-violet-200/70 dark:border-violet-900/60 bg-violet-50/60 dark:bg-violet-950/25 px-4 py-3">
            <div className="flex flex-wrap gap-3 text-sm text-stone-700 dark:text-stone-200">
              <span className="inline-flex items-center gap-2">
                <Package size={16} aria-hidden />
                {info?.orders?.length ?? 0} pedido{(info?.orders?.length ?? 0) === 1 ? '' : 's'}
              </span>
              {info?.clientName ? (
                <span className="inline-flex items-center gap-2">
                  <Share2 size={16} aria-hidden />
                  Cuenta: {info.clientName}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2 text-stone-500 dark:text-stone-400">
                <MapPin size={16} aria-hidden />
                Solo estados & ciudad (sin direcciones)
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-6 text-center">
            <Loader2 className="size-6 animate-spin mx-auto text-stone-400" aria-hidden />
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-3">Cargando…</p>
          </div>
        ) : error ? (
          <div className="glass-card p-6 text-center border-red-200 dark:border-red-900">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">Solicita un nuevo link al operador.</p>
          </div>
        ) : info ? (
          <>
            <div className="space-y-3">
              {grouped.map(([city, orders]) => (
                <div
                  key={city}
                  className="glass-card overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
                    <MapPin size={14} className="text-stone-400" aria-hidden />
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{city}</p>
                    <span className="text-xs text-stone-400 dark:text-stone-500">({orders.length})</span>
                  </div>
                  <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                    {orders.map((o) => (
                      <li key={o.code} className="px-4 py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span translate="no" className="font-mono text-xs font-semibold text-stone-700 dark:text-stone-200">
                              {o.code}
                            </span>
                            <span className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                              · {Number(o.bultos) || 0} bultos
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                            Destinatario: {o.clientName?.trim() || 'Por confirmar'}
                          </p>
                        </div>
                        <span className="text-xs text-stone-500 dark:text-stone-400 shrink-0">
                          {String(o.status || '').replace(/_/g, ' ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

