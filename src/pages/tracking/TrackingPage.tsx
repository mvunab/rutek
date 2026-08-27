import { Suspense, use, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Truck,
  MapPin,
  Flag,
  Home,
  Share2,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  XCircle,
  Check,
  Package,
  Loader2,
} from 'lucide-react';
import {
  type TrackingInfo,
  PROGRESS_STEPS,
  getActiveStepIndex,
  getStatusHeadline,
  buildTimeline,
  groupTimelineByDate,
  formatTime,
} from '../../lib/trackingReport';
import { formatDeliveryDateTime } from '../../lib/deliveryReceiver';
import { TRACKING_BRAND } from '../../lib/trackingTheme';
import { useForceLightTheme } from '../../hooks/useForceLightTheme';
import { TrackingOrderStatusMarker } from '../../components/tracking/TrackingOrderStatusMarker';
import { TrackingEvidenceGallery } from '../../components/tracking/TrackingEvidenceGallery';
import { TrackingLoadErrorBoundary } from './TrackingLoadErrorBoundary';
import { loadOrderTracking } from './trackingPublicLoaders';

/** Azul corporativo estilo referencia */
const BX_BLUE = TRACKING_BRAND.blue;
const BX_LIGHT = TRACKING_BRAND.light;
const BX_DEW = TRACKING_BRAND.dew;

function HorizontalTimeline({
  activeIndex,
  rejected,
  headline,
}: {
  activeIndex: number;
  rejected: boolean;
  headline: { title: string; subtitle: string };
}) {
  if (rejected) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
        <XCircle className="size-12 text-red-500 mx-auto mb-3" aria-hidden />
        <p className="font-extrabold text-red-900">{headline.title}</p>
        <p className="text-sm text-red-700 mt-2 max-w-md mx-auto">{headline.subtitle}</p>
      </div>
    );
  }

  const lastIdx = PROGRESS_STEPS.length - 1;

  return (
    <div className="w-full overflow-x-auto py-2">
      <ul
        className="flex min-w-[640px] w-full items-start justify-between gap-0 list-none m-0 p-0"
        role="list"
        aria-label="Etapas del envío"
      >
        {PROGRESS_STEPS.map((step, i) => {
          const done = i <= activeIndex;
          const current = i === activeIndex;
          const Icon = step.icon;
          const isLast = i === lastIdx;

          return (
            <li
              key={step.id}
              className="flex flex-1 flex-col items-center min-w-0 relative"
              aria-current={current ? 'step' : undefined}
            >
              {i > 0 && (
                <span
                  className="absolute top-[25px] right-1/2 w-full h-[3px] -z-0"
                  style={{ background: i <= activeIndex ? BX_BLUE : BX_LIGHT }}
                  aria-hidden
                />
              )}
              <div
                className="relative z-10 flex size-[50px] shrink-0 items-center justify-center rounded-full transition-colors"
                style={{
                  background: current ? BX_BLUE : done ? BX_LIGHT : '#fff',
                  border: `2px solid ${done || current ? BX_BLUE : BX_LIGHT}`,
                }}
              >
                <Icon
                  className="size-7"
                  style={{ color: current ? '#fff' : BX_BLUE }}
                  aria-hidden
                />
              </div>
              <p
                className="mt-2 text-center text-xs sm:text-sm font-extrabold leading-tight px-1"
                style={{ color: current ? BX_BLUE : done ? '#1a1a1a' : '#9ca3af' }}
              >
                {step.label}
              </p>
              {current && isLast && (
                <p className="mt-1 text-center text-xs font-normal text-stone-600 max-w-[140px] leading-snug px-1 hidden sm:block">
                  {headline.subtitle}
                </p>
              )}
              {current && isLast && (
                <p className="mt-1 text-center text-xs font-normal text-stone-600 max-w-[200px] leading-snug px-1 sm:hidden">
                  {headline.subtitle}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ShipmentDetailsCard({ info }: { info: TrackingInfo }) {
  const origin = [info.origin.city, info.origin.region].filter(Boolean).join(', ') || '—';
  const dest = info.destination.city.toUpperCase();

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{ background: BX_DEW }}
    >
      <div className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="shrink-0 flex flex-col items-center md:items-start text-center md:text-left">
            <h2 className="text-sm font-bold text-stone-600">Detalles del envío</h2>
            <p className="text-base font-bold mt-1 tabular-nums" style={{ color: BX_BLUE }}>
              {info.orderCode}
            </p>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="size-5 shrink-0 text-stone-500 mt-0.5" aria-hidden />
              <div>
                <span className="text-sm font-bold text-stone-600">Origen: </span>
                <span className="text-sm text-stone-600">{origin}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 min-w-0">
              <Flag className="size-5 shrink-0 text-stone-500 mt-0.5" aria-hidden />
              <div>
                <span className="text-sm font-bold text-stone-600">Destino: </span>
                <span className="text-sm text-stone-600">{dest}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <Home className="size-5 shrink-0 text-stone-500 mt-0.5" aria-hidden />
              <div>
                <p className="text-sm text-stone-600">
                  <span className="font-extrabold">Entrega en: </span>
                  Domicilio
                </p>
                <p className="text-xs text-stone-500 mt-0.5 break-words">{info.destination.street}</p>
              </div>
            </div>
            {(info.receiverName || info.receiverRut) ? (
              <div className="flex items-start gap-2 sm:col-span-2">
                <Check className="size-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm text-emerald-800">
                    <span className="font-extrabold">Recibido por: </span>
                    {info.receiverName?.trim() || '—'}
                    {info.receiverRut?.trim() ? (
                      <span translate="no" className="tabular-nums"> · RUT {info.receiverRut.trim()}</span>
                    ) : null}
                  </p>
                </div>
              </div>
            ) : null}
            {info.deliveredAt || info.actualDelivery ? (
              <div className="flex items-start gap-2 sm:col-span-2">
                <Package className="size-5 shrink-0 text-stone-500 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm text-stone-600">
                    <span className="font-extrabold">Entregado: </span>
                    <span className="tabular-nums">
                      {formatDeliveryDateTime(info.deliveredAt ?? info.actualDelivery)}
                    </span>
                  </p>
                </div>
              </div>
            ) : null}
            {info.status === 'rejected' && (info.rejectionMotive || info.rejectedAt) ? (
              <div className="flex items-start gap-2 sm:col-span-2">
                <XCircle className="size-5 shrink-0 text-red-500 mt-0.5" aria-hidden />
                <div>
                  {info.rejectionMotive ? (
                    <p className="text-sm text-red-800">
                      <span className="font-extrabold">Motivo: </span>
                      {info.rejectionMotive}
                    </p>
                  ) : null}
                  {info.rejectionObs ? (
                    <p className="text-xs text-stone-500 mt-0.5">{info.rejectionObs}</p>
                  ) : null}
                  {info.rejectedAt ? (
                    <p className="text-xs text-stone-500 mt-0.5 tabular-nums">
                      Registrado: {formatDeliveryDateTime(info.rejectedAt)}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
            {info.deliveryObs ? (
              <div className="sm:col-span-2">
                <p className="text-sm text-stone-600">
                  <span className="font-extrabold">Observaciones: </span>
                  {info.deliveryObs}
                </p>
              </div>
            ) : null}
            <TrackingEvidenceGallery
              photos={info.photos}
              title={
                info.status === 'rejected'
                  ? 'Evidencias del rechazo'
                  : 'Evidencias de entrega'
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryTimeline({ info }: { info: TrackingInfo }) {
  const [expanded, setExpanded] = useState(true);
  const grouped = useMemo(() => groupTimelineByDate(buildTimeline(info)), [info]);

  return (
    <div className="max-w-lg mx-auto w-full">
      <div className="p-2 flex flex-col items-center">
        {expanded &&
          Array.from(grouped.entries()).map(([dateLabel, events]) => (
            <div key={dateLabel} className="mb-4 p-4 rounded-lg w-full">
              <div className="text-lg font-bold mb-2 text-stone-800">{dateLabel}</div>
              <ul className="space-y-3">
                {events.map((ev) => (
                  <li
                    key={`${dateLabel}-${ev.at.toISOString()}-${ev.title}`}
                    className="text-sm text-stone-700 flex items-center gap-4"
                  >
                    <strong className="tabular-nums w-12 shrink-0 text-stone-800">
                      {formatTime(ev.at)}
                    </strong>
                    <span
                      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full ${
                        ev.highlight ? 'bg-emerald-500 text-white' : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    </span>
                    <div className="flex flex-col justify-center min-w-0">
                      <p className={ev.highlight ? 'font-semibold text-emerald-800' : ''}>
                        {ev.title}
                      </p>
                      {ev.location && ev.location !== '—' && (
                        <p className="text-stone-500">{ev.location}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex items-center gap-2 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-lg px-2 py-1"
          style={{ color: BX_BLUE }}
          aria-expanded={expanded}
        >
          {expanded ? 'Ocultar el historial de seguimiento' : 'Ver historial de seguimiento'}
          {expanded ? (
            <ChevronUp className="size-4" aria-hidden />
          ) : (
            <ChevronDown className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

async function handleShare() {
  try {
    await navigator.clipboard.writeText(window.location.href);
  } catch {
    /* ignore */
  }
}

function TrackingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-stone-900" style={{ colorScheme: 'light' }}>
      <div className="flex flex-col items-center gap-3 text-stone-500" role="status" aria-live="polite">
        <Loader2 className="size-10 animate-spin motion-reduce:animate-none" style={{ color: BX_BLUE }} aria-hidden />
        <p className="text-sm font-medium">Cargando seguimiento…</p>
      </div>
    </div>
  );
}

function TrackingError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 text-stone-900" style={{ colorScheme: 'light' }}>
      <article className="max-w-md w-full text-center bg-white rounded-2xl shadow-md p-8 border border-stone-100">
        <XCircle className="size-14 text-red-400 mx-auto mb-4" aria-hidden />
        <h1 className="text-xl font-extrabold text-stone-900">Link inválido o expirado</h1>
        <p className="text-sm text-stone-500 mt-2">{message}</p>
      </article>
    </div>
  );
}

function TrackingPageContent({ token }: { token: string }) {
  const info = use(loadOrderTracking(token));
  const activeIndex = getActiveStepIndex(info);
  const rejected = info.status === 'rejected' || info.status === 'cancelled';
  const headline = getStatusHeadline(info);

  return (
    <div className="min-h-screen bg-gray-50 text-stone-900" style={{ colorScheme: 'light' }}>
      <div className="mx-auto py-6 sm:py-8 px-4">
        <main className="max-w-[1256px] mx-auto space-y-6">
          {/* Encabezado tenant */}
          <div className="w-full max-w-[1256px] mx-auto rounded-2xl bg-white shadow-md overflow-hidden p-4 sm:p-6">
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
                <h1 className="font-bold text-base text-stone-900">Seguimiento en línea</h1>
                <p className="text-sm text-stone-600 mt-0.5">{info.tenant.name}</p>
              </div>
            </div>
          </div>

          {/* Tarjeta principal */}
          <div
            className="flex flex-col rounded-2xl bg-white p-4 sm:p-6 space-y-6 overflow-hidden"
            style={{ boxShadow: '0 4px 12px 0 rgba(0,0,0,0.08)' }}
          >
            <div className="flex w-full items-start justify-between gap-3 flex-wrap">
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-xl sm:text-2xl font-extrabold leading-tight text-stone-900">
                  Seguimiento del envío{' '}
                  <span className="block sm:inline break-words tabular-nums" style={{ color: BX_BLUE }}>
                    {info.orderCode}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Box className="size-5 text-stone-400" aria-hidden />
                  <span className="text-xs font-extrabold text-stone-500 uppercase tracking-wide">
                    {info.clientName}
                  </span>
                  <TrackingOrderStatusMarker status={info.status} size="md" />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  aria-label="Compartir"
                  className="inline-flex items-center justify-center rounded-xl border w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 font-medium bg-white hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ borderColor: BX_BLUE, color: BX_BLUE }}
                >
                  <Share2 className="size-5 sm:mr-2" aria-hidden />
                  <span className="hidden sm:inline">Compartir</span>
                </button>
                <button
                  type="button"
                  aria-label="Ayuda"
                  className="inline-flex items-center justify-center rounded-xl border w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 font-medium bg-white hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ borderColor: BX_BLUE, color: BX_BLUE }}
                >
                  <HelpCircle className="size-5 sm:mr-2" aria-hidden />
                  <span className="hidden sm:inline">Ayuda</span>
                </button>
              </div>
            </div>

            <div className="w-full rounded-xl border-[1.5px] p-3 sm:p-4" style={{ borderColor: BX_BLUE }}>
              <HorizontalTimeline
                activeIndex={activeIndex}
                rejected={rejected}
                headline={headline}
              />
            </div>

            {!rejected && activeIndex < PROGRESS_STEPS.length - 1 && (
              <p className="text-sm font-semibold text-center sm:hidden" style={{ color: BX_BLUE }}>
                {headline.title}
              </p>
            )}
          </div>

          <ShipmentDetailsCard info={info} />

          <HistoryTimeline info={info} />
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

export function TrackingPage() {
  useForceLightTheme();
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return <TrackingError message="Token inválido" />;
  }

  return (
    <TrackingLoadErrorBoundary
      fallback={(error) => (
        <TrackingError
          message={error.message || 'Error al cargar el seguimiento'}
        />
      )}
    >
      <Suspense fallback={<TrackingLoading />}>
        <TrackingPageContent token={token} />
      </Suspense>
    </TrackingLoadErrorBoundary>
  );
}
