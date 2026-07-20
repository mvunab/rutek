import { useEffect, useState, useMemo, useRef, useCallback, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import {
  Plus, Search, ChevronUp, ChevronDown,
  Download, RefreshCw, SlidersHorizontal, Package, UserCircle, Route as RouteIcon, Truck,
  Pencil, Trash2, X, Copy, MapPin, Box, ArrowLeft, ArrowRight, Check, FileSpreadsheet, Unlink,
  CheckCircle2, XCircle, AlertCircle, AlertTriangle, Eye, LayoutGrid, LayoutList, Share2,
  CheckSquare, Square, ListChecks, Maximize2, Minimize2, Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { OrderStatusBadge, RouteStatusBadge } from '../../components/ui/Badge';
import { ConfirmModal, Modal, TypeToConfirmModal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRouteStore } from '../../store/useRouteStore';
import type { Route, RouteStatus, Order, OrderStatus } from '../../types';
import { routeStatusLabel } from '../../lib/routeStatusLabels';
import { clsx } from 'clsx';
import { ApiError } from '../../lib/api';
import { api } from '../../lib/api';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useClientStore } from '../../store/useClientStore';
import { useUserStore } from '../../store/useUserStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { OrderForm, type OrderFormData } from '../../components/orders/OrderForm';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { useRouteImportStore } from '../../store/useRouteImportStore';
import { toast } from '../../store/useToastStore';
import { normalizeExcelFormatsList } from '../../lib/excelFormat';
import type { ExcelFormatConfig } from '../../types';
import { formatAddressLabel, resolveDefaultPickupAddress } from '../../lib/orderAddress';
import { downloadRoutesExportXlsx, describeRoutesExportFilters, describeRoutesExportRange, routesExportCutoff, type RoutesDateRangeFilter } from '../../lib/routesExport';
import {
  formatOrderInRouteLabel,
  formatRouteDisplayLabel,
  formatRouteDisplayTitle,
  formatRouteSequence,
  parseRouteSequenceInput,
  resolveRouteSequence,
  suggestNextRouteSequence,
} from '../../lib/routeSequence';
import { resolveOrderStatusLabel } from '../../lib/orderStatusLabels';
import { orderStatusColors } from '../../lib/statusColors';
import { resolveAssignee, resolveVehicle, buildPartialTeamAssignPayload } from '../../lib/teamAssignment';
import { applyRangeRules, indicesCoveredByRules, type RangeAssignRule } from '../../lib/rangeAssignRules';
import { RangeAssignRulesPanel } from '../../components/routes/RangeAssignRulesPanel';
import { ImportExcelModal } from '../../modules/operations/route-import/ImportExcelModal';
import { isUuid } from '../../lib/uuid';
import { photosForOrderOnRoute } from '../../lib/orderPhotos';
import { RouteValuationPanel } from '../../components/pricing/RouteValuationPanel';
import { SendTrackingModal } from '../../components/communications/SendTrackingModal';
import { usePhotoStore } from '../../store/usePhotoStore';
import { PhotoLightbox } from '../../components/photos/PhotoLightbox';
import { OrderInspectionThumbnails } from '../../components/photos/OrderInspectionThumbnails';
import { OrderDeliveryReceiverInfo } from '../../components/orders/OrderDeliveryReceiverInfo';
import { OrderReferenceInfo } from '../../components/orders/OrderReferenceInfo';
import { OrderRejectionInfo } from '../../components/orders/OrderRejectionInfo';
import { pickDeliveryReceiverForOrder, pickRejectionInfoForOrder } from '../../lib/deliveryReceiver';
import { parseOrderReferenceFields } from '../../lib/orderReferenceFields';
import type { DbDeliveryRecord } from '../../types/api';
import type { RoutePhoto } from '../../types';

// ─── Panel resize ─────────────────────────────────────────────────────────────

const PANEL_WIDTH_KEY = 'rutek-route-panel-width';
const PANEL_MIN = 300;
const PANEL_DEFAULT = 440;

/** ~58% del viewport, hasta 820px — permite pasar un poco más de la mitad. */
function getPanelMaxPx(): number {
  if (typeof window === 'undefined') return 760;
  return Math.min(820, Math.max(520, Math.floor(window.innerWidth * 0.58)));
}

function clampPanelWidth(w: number): number {
  return Math.min(getPanelMaxPx(), Math.max(PANEL_MIN, w));
}

function usePanelWidth() {
  const [width, setWidth] = useState<number>(() => {
    const stored = localStorage.getItem(PANEL_WIDTH_KEY);
    const n = stored ? parseInt(stored, 10) : NaN;
    return isNaN(n) ? PANEL_DEFAULT : clampPanelWidth(n);
  });

  const commit = useCallback((w: number) => {
    const clamped = clampPanelWidth(w);
    setWidth(clamped);
    localStorage.setItem(PANEL_WIDTH_KEY, String(clamped));
  }, []);

  useEffect(() => {
    const onResize = () => setWidth((w) => clampPanelWidth(w));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return { width, commit };
}

function PanelResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    lastX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const delta = lastX.current - e.clientX; // arrastrar izquierda = panel más ancho
    lastX.current = e.clientX;
    onResize(delta);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      role="separator"
      aria-label="Ajustar ancho del panel de detalle"
      aria-orientation="vertical"
      tabIndex={0}
      className={clsx(
        'hidden lg:flex items-center justify-center',
        'w-3 shrink-0 self-stretch cursor-col-resize select-none',
        'group relative z-10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onResize(-16);
        if (e.key === 'ArrowRight') onResize(16);
      }}
    >
      <div className="w-px h-full bg-stone-200/80 dark:bg-stone-800 group-hover:bg-primary-400 dark:group-hover:bg-primary-500 transition-[background-color] duration-150" />
      <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
        <div className="w-0.5 h-3 rounded-full bg-stone-400 dark:bg-stone-500 group-hover:bg-primary-500" />
        <div className="w-1 h-6 rounded-full bg-stone-300 dark:bg-stone-600 group-hover:bg-primary-400 dark:group-hover:bg-primary-500 transition-[background-color] duration-150" />
        <div className="w-0.5 h-3 rounded-full bg-stone-400 dark:bg-stone-500 group-hover:bg-primary-500" />
      </div>
    </div>
  );
}


// ─── Fecha legible para cabecera de ruta ─────────────────────────────────────

/** Fecha legible para cabecera de ruta (planificación / inicio). */
function formatRouteDay(isoLike: string | undefined): string {
  if (!isoLike?.trim()) return '—';
  try {
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(d);
  } catch {
    return '—';
  }
}

/** Fecha estilo tarjeta del modal de ruta (ej. 20 - 05 - 2026). */
function formatRouteDayElegant(isoLike: string | undefined): string {
  if (!isoLike?.trim()) return '—';
  try {
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd} - ${mm} - ${d.getFullYear()}`;
  } catch {
    return '—';
  }
}

function orderAddressParts(addr: Order['origin'] | Order['destination']) {
  return {
    location: formatAddressLabel(addr),
    street: addr.street?.trim() || null,
  };
}

const CHILE_REGION_OPTIONS: { value: string; label: string }[] = [
  { value: 'Arica y Parinacota', label: 'Arica y Parinacota' },
  { value: 'Tarapacá', label: 'Tarapacá' },
  { value: 'Antofagasta', label: 'Antofagasta' },
  { value: 'Atacama', label: 'Atacama' },
  { value: 'Coquimbo', label: 'Coquimbo' },
  { value: 'Valparaíso', label: 'Valparaíso' },
  { value: 'Metropolitana', label: 'Región Metropolitana' },
  { value: "O'Higgins", label: "O'Higgins" },
  { value: 'Maule', label: 'Maule' },
  { value: 'Ñuble', label: 'Ñuble' },
  { value: 'Biobío', label: 'Biobío' },
  { value: 'Araucanía', label: 'La Araucanía' },
  { value: 'Los Ríos', label: 'Los Ríos' },
  { value: 'Los Lagos', label: 'Los Lagos' },
  { value: 'Aysén', label: 'Aysén' },
  { value: 'Magallanes', label: 'Magallanes' },
];

function getRegionSelectOptions(currentRegion?: string) {
  const current = currentRegion?.trim() || '';
  const empty = { value: '', label: 'Sin cambio…' };
  if (!current) return [empty, ...CHILE_REGION_OPTIONS];
  if (CHILE_REGION_OPTIONS.some((o) => o.value === current)) return [empty, ...CHILE_REGION_OPTIONS];
  return [empty, { value: current, label: current }, ...CHILE_REGION_OPTIONS];
}

const containerCard = clsx(
  'rounded-xl border shadow-sm',
  'bg-white border-stone-200 text-stone-900 shadow-stone-200/50',
  'dark:bg-[#161616] dark:border-stone-800/80 dark:text-stone-100 dark:shadow-md dark:shadow-black/15',
);

function RouteModalStat({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium text-stone-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="text-xs font-semibold text-stone-800 dark:text-stone-100 tabular-nums leading-snug">
        {children}
      </div>
    </div>
  );
}

function RoutePriorityChip({ status }: { status: RouteStatus }) {
  const styles: Record<RouteStatus, string> = {
    not_started:
      'border-stone-300 text-stone-600 bg-stone-100 dark:border-stone-600 dark:text-stone-400 dark:bg-stone-800/50',
    in_progress:
      'border-amber-300 text-amber-800 bg-amber-50 dark:border-amber-500/50 dark:text-amber-400 dark:bg-amber-950/30',
    completed:
      'border-emerald-300 text-emerald-800 bg-emerald-50 dark:border-emerald-500/50 dark:text-emerald-400 dark:bg-emerald-950/30',
    cancelled:
      'border-red-300 text-red-800 bg-red-50 dark:border-red-500/50 dark:text-red-400 dark:bg-red-950/30',
  };
  return (
    <span
      className={clsx(
        'shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide',
        styles[status],
      )}
    >
      {routeStatusLabel(status)}
    </span>
  );
}

function RouteListItem({
  route,
  agg,
  fecha,
  selected,
  onSelect,
  bulkMode,
  bulkChecked,
  onBulkToggle,
}: {
  route: Route;
  agg: { pedidos: number; bultos: number; delivered: number; rejected: number; vehiclesLabel: string };
  fecha: string;
  selected: boolean;
  onSelect: () => void;
  bulkMode?: boolean;
  bulkChecked?: boolean;
  onBulkToggle?: () => void;
}) {
  const terminalDone = agg.delivered + agg.rejected;
  const deliveryPct =
    agg.pedidos > 0 ? Math.round((terminalDone / agg.pedidos) * 100) : 0;
  const hasDeliveries = agg.delivered > 0;
  const hasRejections = agg.rejected > 0;
  const completedWithWarning = route.status === 'completed' && hasRejections;

  const handleClick = () => {
    if (bulkMode && onBulkToggle) onBulkToggle();
    else onSelect();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={bulkMode ? bulkChecked : selected}
      className={clsx(
        'w-full text-left rounded-xl px-4 py-3.5 transition-colors glass shadow-sm',
        'hover:bg-white/90 dark:hover:bg-stone-900/90 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950',
        bulkMode && bulkChecked
          ? 'border-primary-400/80 dark:border-primary-500/70 ring-2 ring-primary-400/20 dark:ring-primary-500/25 shadow-md'
          : !bulkMode && selected
            ? 'border-primary-400/80 dark:border-primary-500/70 ring-2 ring-primary-400/20 dark:ring-primary-500/25 shadow-md'
            : completedWithWarning
              ? 'border-red-300/90 dark:border-red-800/70'
              : 'border-stone-200/80 dark:border-stone-700/70',
      )}
    >
      <div className="flex items-start gap-3">
        {bulkMode ? (
          <span
            className="shrink-0 mt-2 text-primary-600 dark:text-primary-400"
            aria-hidden
          >
            {bulkChecked ? <CheckSquare size={20} /> : <Square size={20} className="text-stone-400" />}
          </span>
        ) : null}
        <div
          className={clsx(
            'size-11 shrink-0 rounded-xl flex items-center justify-center',
            !bulkMode && selected ? 'bg-primary-50/90 dark:bg-primary-950/40' : 'bg-stone-100/70 dark:bg-stone-800/60',
          )}
          aria-hidden
        >
          <RouteIcon
            size={20}
            className={!bulkMode && selected ? 'text-primary-600 dark:text-primary-400' : 'text-stone-500 dark:text-stone-400'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate">
            <span translate="no" className="tabular-nums">N° {formatRouteDisplayLabel(route)}</span>
            {route.name?.trim() ? (
              <span className="font-normal text-stone-500 dark:text-stone-400"> · {route.name}</span>
            ) : null}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
            <RouteStatusBadge status={route.status} />
            {hasRejections ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
                <AlertTriangle size={11} aria-hidden />
                {agg.rejected} rechazo{agg.rejected !== 1 ? 's' : ''}
                {route.status === 'completed' ? ' · revisar' : ''}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-stone-400 dark:text-stone-500 tabular-nums">
            <span>{fecha}</span>
            <span>{agg.pedidos} pedidos</span>
            <span>{agg.bultos} bultos</span>
            {hasDeliveries ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={12} aria-hidden />
                {agg.delivered}/{agg.pedidos} entregados
              </span>
            ) : null}
            {agg.vehiclesLabel ? (
              <span translate="no" className="font-mono">
                {agg.vehiclesLabel}
              </span>
            ) : null}
          </div>
          {agg.pedidos > 0 ? (
            <div
              className="mt-2 h-1 rounded-full bg-stone-200/90 dark:bg-stone-800 overflow-hidden"
              role="progressbar"
              aria-valuenow={deliveryPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${terminalDone} de ${agg.pedidos} pedidos resueltos`}
            >
              <div
                className={clsx(
                  'h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none',
                  hasRejections ? 'bg-red-500' : 'bg-emerald-500',
                )}
                style={{ width: `${deliveryPct}%` }}
              />
            </div>
          ) : null}
        </div>
        {!bulkMode ? (
          <ChevronDown
            size={18}
            className={clsx(
              'shrink-0 text-stone-300 dark:text-stone-600 transition-transform duration-200',
              selected && 'rotate-180 text-primary-600 dark:text-primary-400',
            )}
            aria-hidden
          />
        ) : null}
      </div>
    </button>
  );
}

const LAYOUT_KEY = 'rutek-routes-layout';
type RouteLayout = 'cards' | 'table';

function RouteTableRow({
  route,
  agg,
  fecha,
  selected,
  onSelect,
  bulkMode,
  bulkChecked,
  onBulkToggle,
}: {
  route: Route;
  agg: { pedidos: number; bultos: number; delivered: number; rejected: number; vehiclesLabel: string; driversLabel: string };
  fecha: string;
  selected: boolean;
  onSelect: () => void;
  bulkMode?: boolean;
  bulkChecked?: boolean;
  onBulkToggle?: () => void;
}) {
  const handleClick = () => {
    if (bulkMode && onBulkToggle) onBulkToggle();
    else onSelect();
  };

  const isHighlighted = bulkMode ? bulkChecked : selected;

  return (
    <tr
      onClick={handleClick}
      className={clsx(
        'cursor-pointer transition-colors border-b border-stone-100 dark:border-stone-800',
        isHighlighted
          ? 'bg-primary-50/80 dark:bg-primary-950/25 shadow-[inset_3px_0_0_0] shadow-primary-500 dark:shadow-primary-400'
          : 'hover:bg-stone-50 dark:hover:bg-stone-800/50',
      )}
    >
      {bulkMode ? (
        <td className="px-3 py-2.5 align-middle w-10">
          <span className="text-primary-600 dark:text-primary-400" aria-hidden>
            {bulkChecked ? <CheckSquare size={18} /> : <Square size={18} className="text-stone-400" />}
          </span>
        </td>
      ) : null}
      <td className="px-4 py-2.5 align-middle">
        <span
          translate="no"
          className={clsx(
            'font-mono text-xs font-semibold tabular-nums block truncate',
            isHighlighted ? 'text-primary-700 dark:text-primary-300' : 'text-stone-600 dark:text-stone-400',
          )}
        >
          {formatRouteSequence(route)}
        </span>
      </td>
      <td className="px-4 py-2.5 align-middle min-w-0">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{route.name}</p>
      </td>
      <td className="px-4 py-2.5 align-middle whitespace-nowrap">
        <div className="flex flex-col gap-1 items-start">
          <RouteStatusBadge status={route.status} />
          {agg.rejected > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
              <AlertTriangle size={10} aria-hidden />
              {agg.rejected} rechazo{agg.rejected !== 1 ? 's' : ''}
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-2.5 align-middle whitespace-nowrap text-xs text-stone-500 dark:text-stone-400 tabular-nums">
        {fecha}
      </td>
      <td className="px-4 py-2.5 align-middle whitespace-nowrap text-xs tabular-nums text-right">
        <span className="text-stone-600 dark:text-stone-300">{agg.pedidos}</span>
        {agg.delivered > 0 ? (
          <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={11} aria-hidden />
            {agg.delivered} entreg.
          </span>
        ) : null}
      </td>
      <td className="px-4 py-2.5 align-middle whitespace-nowrap text-xs text-stone-600 dark:text-stone-300 tabular-nums text-right">
        {agg.bultos}
      </td>
      <td className="px-4 py-2.5 align-middle min-w-0">
        <span translate="no" className="text-xs text-stone-500 dark:text-stone-400 font-mono truncate block">
          {agg.vehiclesLabel || '—'}
        </span>
      </td>
      <td className="px-4 py-2.5 align-middle min-w-0">
        <span className="text-xs text-stone-500 dark:text-stone-400 truncate block">
          {agg.driversLabel || '—'}
        </span>
      </td>
    </tr>
  );
}

function OrderCardAction({
  icon,
  label,
  onClick,
  active = false,
  loading = false,
  disabled = false,
  tone = 'default',
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  loading?: boolean;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      aria-pressed={active}
      title={
        disabled && !loading
          ? `${label} (no disponible mientras otra acción está en curso)`
          : active
            ? `${label} (abierta — pulsa de nuevo para cerrar)`
            : label
      }
      className={clsx(
        'glass-btn inline-flex flex-1 items-center justify-center gap-1.5 min-h-[2rem] rounded-lg px-2 py-1.5 text-xs font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950',
        tone === 'danger'
          ? 'glass-btn--danger focus-visible:ring-red-400'
          : active
            ? 'glass-btn--active focus-visible:ring-[#FF7B00]/50'
            : 'focus-visible:ring-[#FF7B00]/45',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span className="shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span>{loading ? '…' : label}</span>
    </button>
  );
}

/** Resumen de patentes en pedidos de una ruta (varios vehículos posibles). */
function summarizeRouteVehicles(
  routeOrders: Order[],
  legacyRoutePlate?: string,
): string {
  const plates = [
    ...new Set(
      routeOrders
        .map((o) => o.vehiclePlate?.trim())
        .filter((p): p is string => Boolean(p)),
    ),
  ];
  if (plates.length === 1) return plates[0]!;
  if (plates.length > 1) return `${plates.length} patentes`;
  return legacyRoutePlate?.trim() ?? '';
}

/** Choferes y peonetas viven en el pedido (RM-1), no en la ruta. */
function summarizeRouteAssignees(
  routeOrders: Order[],
  field: 'driverName' | 'peonetaName',
): string {
  const names = [
    ...new Set(
      routeOrders
        .map((o) => o[field]?.trim())
        .filter((n): n is string => Boolean(n)),
    ),
  ];
  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return names.join(' · ');
  return `${names[0]} +${names.length - 1}`;
}

function orderToFormData(order: Order): OrderFormData {
  return {
    clientId: order.clientId,
    destinatario: order.clientName ?? '',
    priority: order.priority,
    originStreet: order.origin.street,
    originCity: order.origin.city,
    originRegion: order.origin.region || 'Metropolitana',
    destStreet: order.destination.street,
    destCity: order.destination.city,
    destRegion: order.destination.region || 'Metropolitana',
    estimatedDelivery: order.estimatedDelivery,
    notes: order.notes ?? '',
    bultos: order.bultos,
  };
}

type SortDir = 'asc' | 'desc' | null;
type RouteSortKey = 'code' | 'name' | 'status' | 'pedidos' | 'bultos' | 'fecha' | 'createdAt' | 'driverName' | 'vehiclePlate';

const ROUTE_STATUSES: RouteStatus[] = ['not_started', 'in_progress', 'completed', 'cancelled'];

const routeStatusDot: Record<RouteStatus, string> = {
  not_started: 'bg-stone-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};

// ─── Route Form (create/edit) ─────────────────────────────────────────────────
interface RouteFormData {
  guiaInterna: string;
  name: string;
  notes: string;
  clientId: string;
}

function RouteForm({
  initial,
  suggestedSequence,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  error,
}: {
  initial?: Partial<RouteFormData>;
  suggestedSequence?: number;
  onSubmit: (data: RouteFormData) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  error?: string | null;
}) {
  const { clients, fetchClients } = useClientStore();
  const [form, setForm] = useState<RouteFormData>({
    guiaInterna: suggestedSequence != null ? String(suggestedSequence) : '',
    name: '',
    notes: '',
    clientId: '',
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [sequenceTouched, setSequenceTouched] = useState(Boolean(initial?.guiaInterna));

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (sequenceTouched || suggestedSequence == null) return;
    setForm((p) =>
      p.guiaInterna.trim() ? p : { ...p, guiaInterna: String(suggestedSequence) },
    );
  }, [suggestedSequence, sequenceTouched]);

  const f = (field: keyof RouteFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (field === 'guiaInterna') setSequenceTouched(true);
      setForm((p) => ({ ...p, [field]: e.target.value }));
    };

  const clientOptions = [
    { value: '', label: 'Sin cuenta (se asigna al primer pedido)…' },
    ...clients
      .filter((c) => c.active)
      .toSorted((a, b) => a.companyName.localeCompare(b.companyName, 'es'))
      .map((c) => ({ value: c.id, label: c.companyName })),
  ];

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    const sequence = parseRouteSequenceInput(form.guiaInterna);
    if (sequence == null) return;
    setSaving(true);
    try {
      await onSubmit({
        guiaInterna: String(sequence),
        name: form.name.trim(),
        notes: form.notes.trim(),
        clientId: form.clientId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <Select
        label="Cuenta (Mandante)"
        value={form.clientId}
        onChange={f('clientId')}
        options={clientOptions}
        autoComplete="off"
        hint="Todos los pedidos de la ruta deben pertenecer a la misma cuenta (mandante). Si no la seleccionás ahora, se inferirá del primer pedido que agregues."
      />
      <Input
        label="N° de ruta (consecutivo)"
        placeholder={suggestedSequence != null ? String(suggestedSequence) : 'Ej: 1246…'}
        value={form.guiaInterna}
        onChange={f('guiaInterna')}
        name="route_sequence"
        type="number"
        inputMode="numeric"
        min={1}
        autoComplete="off"
        spellCheck={false}
        hint={
          suggestedSequence != null
            ? `Sugerido: ${suggestedSequence} (último consecutivo + 1). Es el número de tu planilla / Excel.`
            : 'Número consecutivo de tu hoja de ruta (no es el folio interno del sistema).'
        }
      />
      <Input
        label="Nombre de la ruta"
        placeholder="Ej: Santiago Norte"
        value={form.name}
        onChange={f('name')}
        name="route_name"
      />
      <Textarea
        label="Notas"
        placeholder="Instrucciones opcionales…"
        value={form.notes}
        onChange={f('notes')}
        rows={3}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          loading={saving}
          disabled={!form.name.trim() || parseRouteSequenceInput(form.guiaInterna) == null}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}


function RouteDetailPlaceholder() {
  return (
    <div className="flex flex-1 min-h-0 flex-col items-center justify-center p-6">
      <div className="glass-card w-full max-w-sm p-8 text-center space-y-5">
        <div
          className="mx-auto size-14 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 flex items-center justify-center"
          aria-hidden
        >
          <RouteIcon size={28} className="text-stone-500 dark:text-stone-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">
            Selecciona una ruta
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 text-pretty leading-relaxed">
            El detalle, pedidos y asignaciones aparecerán en este panel.
          </p>
        </div>
        <ul className="text-left text-xs text-stone-500 dark:text-stone-400 space-y-2.5 pt-1">
          <li className="flex items-start gap-2">
            <LayoutList size={14} className="shrink-0 mt-0.5 text-primary-500" aria-hidden />
            <span>Haz clic en una ruta del listado central.</span>
          </li>
          <li className="flex items-start gap-2">
            <Package size={14} className="shrink-0 mt-0.5 text-primary-500" aria-hidden />
            <span>Gestiona pedidos, choferes y vehículos por entrega.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 w-3.5 h-3.5 rounded-sm border border-stone-300 dark:border-stone-600" aria-hidden />
            <span>Arrastra el borde izquierdo para ampliar este panel.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/** Pedido sin chofer, peoneta ni vehículo asignados. */
function isOrderUnassigned(o: Order): boolean {
  return !(
    (o.driverId && isUuid(o.driverId)) ||
    Boolean(o.driverName?.trim()) ||
    (o.peonetaId && isUuid(o.peonetaId)) ||
    Boolean(o.peonetaName?.trim()) ||
    (o.vehicleId && isUuid(o.vehicleId)) ||
    Boolean(o.vehiclePlate?.trim())
  );
}

/** Panel lateral: detalle de ruta y gestión de pedidos (estilo container). */
function RouteDetailSidePanel({
  route,
  onClose,
  fullscreen,
  onToggleFullscreen,
}: {
  route: Route;
  onClose: () => void;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}) {
  const { user, tenant } = useAuthStore();
  const canManage = user?.role === 'admin' || user?.role === 'operator';
  const { orders, detachOrderFromRoute, fetchOrders, addOrder, updateOrder, reactivateOrder } = useOrderStore();
  const { fetchRoutes, addOrderToRoute, assignDriverToOrders, deleteRoute, updateRoute } = useRouteStore();
  const { clients, fetchClients } = useClientStore();
  const { users, fetchUsers } = useUserStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { photos, fetchPhotos } = usePhotoStore();

  useEffect(() => {
    void fetchClients();
    void fetchUsers();
    void fetchVehicles();
    void fetchPhotos();
  }, [fetchClients, fetchUsers, fetchVehicles, fetchPhotos]);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [trackingRouteOpen, setTrackingRouteOpen] = useState(false);
  const [removeOrderId, setRemoveOrderId] = useState<string | null>(null);
  // Asignación por pedido individual
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDraftDriver, setOrderDraftDriver] = useState('');
  const [orderDraftPeoneta, setOrderDraftPeoneta] = useState('');
  const [orderDraftVehicle, setOrderDraftVehicle] = useState('');
  const [orderApplyToAll, setOrderApplyToAll] = useState(false);
  const [orderAssignBusy, setOrderAssignBusy] = useState<string | null>(null);
  const [orderAssignSaved, setOrderAssignSaved] = useState<string | null>(null);
  const [sameVehicleConfirm, setSameVehicleConfirm] = useState<{
    orderId: string;
    plate: string;
    otherCodes: string[];
    bulk?: boolean;
  } | null>(null);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignRules, setBulkAssignRules] = useState<RangeAssignRule[]>([]);
  const [bulkDraftCity, setBulkDraftCity] = useState('');
  const [bulkDraftRegion, setBulkDraftRegion] = useState('');
  const [bulkAssignBusy, setBulkAssignBusy] = useState(false);
  const [inspectionLightbox, setInspectionLightbox] = useState<{
    photos: RoutePhoto[];
    index: number;
  } | null>(null);
  const [routeDeliveryRecords, setRouteDeliveryRecords] = useState<DbDeliveryRecord[]>([]);
  type OrderListFilter = 'all' | 'open' | 'terminal' | 'unassigned' | OrderStatus;

  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderListFilter>('all');

  const assigned = useMemo(
    () =>
      orders
        .filter((o) => o.routeId === route.id)
        .toSorted((a, b) => a.code.localeCompare(b.code, 'es')),
    [orders, route.id],
  );

  const filteredAssigned = useMemo(() => {
    if (orderStatusFilter === 'all') return assigned;
    if (orderStatusFilter === 'unassigned') {
      return assigned.filter(isOrderUnassigned);
    }
    if (orderStatusFilter === 'open') {
      return assigned.filter((o) => o.status === 'pending' || o.status === 'in_transit');
    }
    if (orderStatusFilter === 'terminal') {
      return assigned.filter((o) => o.status === 'delivered' || o.status === 'rejected');
    }
    return assigned.filter((o) => o.status === orderStatusFilter);
  }, [assigned, orderStatusFilter]);

  const assignedIndexById = useMemo(() => {
    const map = new Map<string, number>();
    assigned.forEach((o, i) => map.set(o.id, i));
    return map;
  }, [assigned]);

  useEffect(() => {
    setOrderStatusFilter('all');
  }, [route.id]);

  const orderFilterChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of assigned) {
      counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
    }
    const openCount =
      (counts.get('pending') ?? 0) + (counts.get('in_transit') ?? 0);
    const terminalCount =
      (counts.get('delivered') ?? 0) + (counts.get('rejected') ?? 0);
    const unassignedCount = assigned.filter(isOrderUnassigned).length;

    type Chip = {
      value: OrderListFilter;
      label: string;
      count: number;
      dotClass?: string;
      accent?: 'amber' | 'stone' | 'status';
    };

    const chips: Chip[] = [
      { value: 'all', label: 'Todos', count: assigned.length, accent: 'stone' },
    ];
    if (unassignedCount > 0) {
      chips.push({
        value: 'unassigned',
        label: 'Sin asignar',
        count: unassignedCount,
        accent: 'amber',
        dotClass: 'bg-amber-500',
      });
    }
    if (openCount > 0) {
      chips.push({
        value: 'open',
        label: 'Abiertos',
        count: openCount,
        accent: 'stone',
        dotClass: 'bg-primary-500',
      });
    }
    if (terminalCount > 0) {
      chips.push({
        value: 'terminal',
        label: 'Cerrados',
        count: terminalCount,
        accent: 'stone',
        dotClass: 'bg-stone-400',
      });
    }
    const preferred = ['pending', 'in_transit', 'delivered', 'rejected'];
    const seen = new Set<string>();
    for (const slug of preferred) {
      const n = counts.get(slug);
      if (!n) continue;
      seen.add(slug);
      chips.push({
        value: slug,
        label: resolveOrderStatusLabel(slug, tenant),
        count: n,
        accent: 'status',
        dotClass: orderStatusColors(slug).dot,
      });
    }
    for (const [slug, n] of counts) {
      if (seen.has(slug)) continue;
      chips.push({
        value: slug,
        label: resolveOrderStatusLabel(slug, tenant),
        count: n,
        accent: 'status',
        dotClass: orderStatusColors(slug).dot,
      });
    }
    return chips;
  }, [assigned, tenant]);

  const assignedStatusKey = useMemo(
    () => assigned.map((o) => `${o.id}:${o.status}`).join('|'),
    [assigned],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await api.get<DbDeliveryRecord[]>(`/routes/${route.id}/delivery-records`);
        if (!cancelled) {
          setRouteDeliveryRecords(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) setRouteDeliveryRecords([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route.id, assignedStatusKey]);

  const handleExportRoute = useCallback(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c.companyName]));
    const { rowCount, filename } = downloadRoutesExportXlsx([route], orders, {
      clientNames: clientMap,
      tenant,
      dateRange: 'all',
      deliveryRecords: routeDeliveryRecords,
    });
    if (rowCount === 0) {
      toast.warning('Sin datos', 'No hay pedidos para exportar en esta ruta.');
      return;
    }
    toast.info('Exportado', `${filename} · ${rowCount} fila${rowCount === 1 ? '' : 's'}.`);
  }, [route, orders, clients, tenant, routeDeliveryRecords]);

  const totals = useMemo(() => {
    const bultos = assigned.reduce((s, o) => s + (Number(o.bultos) || 0), 0);
    return { pedidos: assigned.length, bultos };
  }, [assigned]);

  const driversList = useMemo(
    () =>
      users
        .filter((u) => u.role === 'driver' && u.active && isUuid(u.id))
        .toSorted((a, b) => a.name.localeCompare(b.name, 'es')),
    [users],
  );

  const peonetasList = useMemo(
    () =>
      users
        .filter((u) => u.role === 'peoneta' && u.active && isUuid(u.id))
        .toSorted((a, b) => a.name.localeCompare(b.name, 'es')),
    [users],
  );

  const driverSelectOpts = useMemo(
    () => [
      { value: '', label: 'Sin chofer asignado…' },
      ...driversList.map((d) => ({ value: d.id, label: d.name })),
    ],
    [driversList],
  );

  const peonetaSelectOpts = useMemo(
    () => [
      { value: '', label: 'Sin peoneta asignado…' },
      ...peonetasList.map((p) => ({ value: p.id, label: p.name })),
    ],
    [peonetasList],
  );

  const vehiclesSorted = useMemo(
    () => vehicles.toSorted((a, b) => a.plate.localeCompare(b.plate, 'es')),
    [vehicles],
  );

  const vehicleSelectOpts = useMemo(
    () => [
      { value: '', label: 'Sin vehículo asignado…' },
      ...vehiclesSorted.map((v) => ({
        value: v.id,
        label: `${v.plate} · ${v.brand} ${v.model}${v.available ? '' : ' (no disponible)'}`,
      })),
    ],
    [vehiclesSorted],
  );

  const bulkRegionSelectOpts = useMemo(
    () => getRegionSelectOptions(bulkDraftRegion),
    [bulkDraftRegion],
  );

  const handleCreateOrder = async (data: OrderFormData) => {
    const clientId = data.clientId?.trim();
    if (!clientId) {
      setActionError('Selecciona una cuenta para el pedido.');
      return;
    }
    const destinatario = data.destinatario?.trim() || '';
    if (!destinatario) {
      setActionError(
        'Indica el destinatario (cliente final) al que se le entrega este pedido.',
      );
      return;
    }
    setActionError(null);
    setBusyId('create');
    try {
      const created = await addOrder({
        clientId,
        clientName: destinatario,
        status: 'pending',
        priority: data.priority,
        routeId: route.id,
        origin: {
          street: data.originStreet.trim(),
          city: data.originCity.trim(),
          region: data.originRegion.trim(),
        },
        destination: {
          street: data.destStreet,
          city: data.destCity,
          region: data.destRegion,
        },
        items: [],
        totalWeight: 0,
        totalVolume: 0,
        estimatedDelivery: data.estimatedDelivery,
        notes: data.notes,
        bultos: data.bultos,
      });
      if (!created) {
        setActionError('No se pudo crear el pedido. Revisa la conexión con el servidor.');
        return;
      }
      addOrderToRoute(route.id, created.id);
      setCreateOrderOpen(false);
      setCreateFormKey((k) => k + 1);
      await fetchOrders();
      await fetchRoutes();
    } catch (err) {
      let msg = 'No se pudo crear el pedido en esta ruta.';
      if (err instanceof ApiError) {
        try {
          const parsed = JSON.parse(err.body) as { message?: string | string[] };
          const apiMsg = parsed.message;
          if (typeof apiMsg === 'string' && apiMsg.length > 0) msg = apiMsg;
          else if (Array.isArray(apiMsg) && apiMsg.length > 0) msg = apiMsg.join(' · ');
        } catch {
          if (err.body) msg = err.body;
        }
      } else if (err instanceof Error && err.message) {
        msg = err.message;
      }
      setActionError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (orderId: string) => {
    setActionError(null);
    setBusyId(orderId);
    try {
      await detachOrderFromRoute(orderId);
      setEditingOrderId((prev) => (prev === orderId ? null : prev));
      await fetchOrders();
      await fetchRoutes();
    } catch {
      setActionError('No se pudo quitar el pedido de la ruta.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReactivateOrder = async (orderId: string) => {
    setActionError(null);
    setBusyId(orderId);
    try {
      await reactivateOrder(orderId);
      await fetchOrders();
      await fetchRoutes();
      toast.info(
        'Pedido reactivado',
        'Volvió a pendiente y aparecerá de nuevo al repartidor.',
      );
    } catch {
      setActionError('No se pudo reactivar el pedido rechazado.');
      toast.error('No se pudo reactivar', 'Revisa la conexión e intenta de nuevo.');
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenOrderAssign = (o: Order) => {
    if (bulkAssignOpen) closeBulkAssign();
    setEditingOrderId(null);
    setExpandedOrderId(o.id);
    const draftDriver = o.driverId && isUuid(o.driverId) ? o.driverId : '';
    const draftPeoneta = o.peonetaId && isUuid(o.peonetaId) ? o.peonetaId : '';
    const draftVehicle = o.vehicleId && isUuid(o.vehicleId) ? o.vehicleId : '';
    setOrderDraftDriver(draftDriver);
    setOrderDraftPeoneta(draftPeoneta);
    setOrderDraftVehicle(draftVehicle);
    setOrderApplyToAll(false);
  };

  const handleOpenOrderEdit = (o: Order) => {
    setDetailOrder(null);
    if (expandedOrderId) handleCancelOrderAssign();
    setEditingOrderId((prev) => (prev === o.id ? null : o.id));
  };

  const handleUpdateOrder = async (orderId: string, data: OrderFormData) => {
    const clientId = data.clientId?.trim();
    if (!clientId) {
      setActionError('Selecciona una cuenta para el pedido.');
      return;
    }
    const destinatario = data.destinatario?.trim() || '';
    if (!destinatario) {
      setActionError(
        'Indica el destinatario (cliente final) al que se le entrega este pedido.',
      );
      return;
    }
    setActionError(null);
    setBusyId(orderId);
    try {
      await updateOrder(orderId, {
        clientId,
        clientName: destinatario,
        priority: data.priority,
        origin: {
          street: data.originStreet.trim(),
          city: data.originCity.trim(),
          region: data.originRegion.trim(),
        },
        destination: {
          street: data.destStreet,
          city: data.destCity,
          region: data.destRegion,
        },
        estimatedDelivery: data.estimatedDelivery,
        notes: data.notes,
        bultos: data.bultos,
      });
      setEditingOrderId(null);
      await fetchOrders();
      await fetchRoutes();
    } catch (err) {
      let msg = 'No se pudo actualizar el pedido.';
      if (err instanceof ApiError) {
        try {
          const parsed = JSON.parse(err.body) as { message?: string | string[] };
          const apiMsg = parsed.message;
          if (typeof apiMsg === 'string' && apiMsg.length > 0) msg = apiMsg;
          else if (Array.isArray(apiMsg) && apiMsg.length > 0) msg = apiMsg.join(' · ');
        } catch {
          if (err.body) msg = err.body;
        }
      } else if (err instanceof Error && err.message) {
        msg = err.message;
      }
      setActionError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelOrderAssign = () => {
    setExpandedOrderId(null);
    setOrderDraftDriver('');
    setOrderDraftPeoneta('');
    setOrderDraftVehicle('');
    setOrderApplyToAll(false);
  };

  const closeCreateOrder = () => {
    if (busyId === 'create') return;
    setCreateOrderOpen(false);
  };

  const openCreateOrder = () => {
    if (bulkAssignOpen) closeBulkAssign();
    handleCancelOrderAssign();
    setEditingOrderId(null);
    setCreateOrderOpen(true);
  };

  const closeBulkAssign = () => {
    setBulkAssignOpen(false);
    setBulkAssignRules([]);
    setBulkDraftCity('');
    setBulkDraftRegion('');
  };

  const openBulkAssign = () => {
    setCreateOrderOpen(false);
    handleCancelOrderAssign();
    setEditingOrderId(null);
    setBulkAssignOpen(true);
    setBulkAssignRules([]);
  };

  const performBulkApplyRules = async () => {
    if (bulkAssignRules.length === 0) {
      setActionError('Agrega al menos una regla de asignación.');
      return;
    }

    const hasTeam = bulkAssignRules.some(
      (r) => r.driverId || r.vehicleId || r.peonetaId,
    );
    const city = bulkDraftCity.trim();
    const region = bulkDraftRegion.trim();
    const hasLocation = Boolean(city || region);

    if (!hasTeam && !hasLocation) {
      setActionError('Completa chofer, peoneta o vehículo en al menos una regla, o una ubicación.');
      return;
    }

    setBulkAssignBusy(true);
    setActionError(null);
    let locationError: string | null = null;

    try {
      if (hasTeam) {
        for (const rule of bulkAssignRules) {
          const from = Math.max(1, Math.floor(Number(rule.from.trim()) || 1));
          const to = Math.min(
            assigned.length,
            Math.floor(Number(rule.to.trim()) || assigned.length),
          );
          if (to < from) continue;
          if (!rule.driverId && !rule.vehicleId && !rule.peonetaId) continue;

          const orderIds = assigned.slice(from - 1, to).map((o) => o.id);
          if (orderIds.length === 0) continue;

          const driver = rule.driverId
            ? resolveAssignee(rule.driverId, driversList)
            : null;
          const peoneta = rule.peonetaId
            ? resolveAssignee(rule.peonetaId, peonetasList)
            : null;
          const vehicle = rule.vehicleId
            ? resolveVehicle(rule.vehicleId, vehiclesSorted)
            : null;

          if (rule.driverId && !driver) {
            throw new Error('Selecciona un chofer válido de la lista.');
          }
          if (rule.peonetaId && !peoneta) {
            throw new Error('Selecciona una peoneta válida de la lista.');
          }
          if (rule.vehicleId && !vehicle) {
            throw new Error('Selecciona un vehículo válido de la lista.');
          }

          await assignDriverToOrders(
            route.id,
            buildPartialTeamAssignPayload({
              driverDraft: rule.driverId,
              peonetaDraft: rule.peonetaId ?? '',
              vehicleDraft: rule.vehicleId,
              driver,
              peoneta,
              vehicle,
              orderIds,
            }),
          );
        }
      }

      if (hasLocation) {
        const covered = indicesCoveredByRules(assigned.length, bulkAssignRules);
        const orderIds =
          covered.length > 0
            ? covered.map((i) => assigned[i]!.id)
            : assigned.map((o) => o.id);

        const results = await Promise.allSettled(
          orderIds.map(async (orderId) => {
            const order = assigned.find((o) => o.id === orderId);
            if (!order) return;
            await updateOrder(orderId, {
              destination: {
                street: order.destination.street,
                city: city || order.destination.city,
                region: region || order.destination.region,
              },
            });
          }),
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) {
          const ok = orderIds.length - failed;
          locationError =
            ok === 0
              ? 'No se pudo actualizar la ubicación.'
              : `Ubicación actualizada en ${ok} pedido${ok === 1 ? '' : 's'}; ${failed} fallaron.`;
        }
      }

      await fetchOrders();

      if (locationError) {
        setActionError(locationError);
      } else {
        const covered = hasTeam
          ? indicesCoveredByRules(assigned.length, bulkAssignRules).length
          : assigned.length;
        toast.info(
          `Cambios aplicados a ${covered} pedido${covered === 1 ? '' : 's'}`,
        );
        setBulkAssignRules([]);
        setBulkDraftCity('');
        setBulkDraftRegion('');
      }
    } catch (err) {
      let msg = 'No se pudieron aplicar los cambios.';
      if (err instanceof ApiError) {
        try {
          const parsed = JSON.parse(err.body) as { message?: string | string[] };
          const apiMsg = parsed.message;
          if (typeof apiMsg === 'string' && apiMsg.length > 0) msg = apiMsg;
          else if (Array.isArray(apiMsg) && apiMsg.length > 0) msg = apiMsg.join(' · ');
        } catch {
          if (err.body) msg = err.body;
        }
      } else if (err instanceof Error && err.message) {
        msg = err.message;
      }
      setActionError(msg);
    } finally {
      setBulkAssignBusy(false);
    }
  };

  const handleBulkApplyRules = () => {
    for (const rule of bulkAssignRules) {
      if (!rule.vehicleId) continue;
      const from = Math.max(1, Math.floor(Number(rule.from.trim()) || 1));
      const to = Math.min(
        assigned.length,
        Math.floor(Number(rule.to.trim()) || assigned.length),
      );
      if (to < from) continue;
      const orderIds = assigned.slice(from - 1, to).map((o) => o.id);
      if (orderIds.length <= 1) continue;
      const v = vehiclesSorted.find((x) => x.id === rule.vehicleId);
      if (!v) continue;
      setSameVehicleConfirm({
        orderId: orderIds[0]!,
        plate: v.plate,
        otherCodes: assigned.slice(from - 1, to).map((o) => o.code),
        bulk: true,
      });
      return;
    }
    void performBulkApplyRules();
  };

  const getSameVehicleConflict = (
    orderId: string,
  ): { plate: string; otherCodes: string[] } | null => {
    if (!orderDraftVehicle.trim()) return null;
    const v = vehiclesSorted.find((x) => x.id === orderDraftVehicle);
    if (!v) return null;

    if (orderApplyToAll) {
      if (assigned.length <= 1) return null;
      return {
        plate: v.plate,
        otherCodes: assigned.map((o) => o.code),
      };
    }

    const others = assigned.filter(
      (o) => o.id !== orderId && o.vehicleId === orderDraftVehicle,
    );
    if (others.length === 0) return null;
    return {
      plate: v.plate,
      otherCodes: others.map((o) => o.code),
    };
  };

  const performSaveOrderAssignment = async (orderId: string) => {
    setOrderAssignBusy(orderId);
    setActionError(null);

    const driver = resolveAssignee(orderDraftDriver, driversList);
    const peoneta = resolveAssignee(orderDraftPeoneta, peonetasList);
    const vehicle = resolveVehicle(orderDraftVehicle, vehiclesSorted);

    if (orderDraftDriver.trim() && !driver) {
      setActionError('Selecciona un chofer válido de la lista.');
      setOrderAssignBusy(null);
      return;
    }
    if (orderDraftPeoneta.trim() && !peoneta) {
      setActionError('Selecciona una peoneta válida de la lista.');
      setOrderAssignBusy(null);
      return;
    }
    if (orderDraftVehicle.trim() && !vehicle) {
      setActionError('Selecciona un vehículo válido de la lista.');
      setOrderAssignBusy(null);
      return;
    }

    try {
      if (orderApplyToAll) {
        await assignDriverToOrders(
          route.id,
          buildPartialTeamAssignPayload({
            driverDraft: orderDraftDriver,
            peonetaDraft: orderDraftPeoneta,
            vehicleDraft: orderDraftVehicle,
            driver,
            peoneta,
            vehicle,
          }),
        );
      } else {
        await updateOrder(orderId, {
          driverId: driver?.id ?? null,
          driverName: driver?.name ?? null,
          peonetaId: peoneta?.id ?? null,
          peonetaName: peoneta?.name ?? null,
          vehicleId: vehicle?.id ?? null,
          vehiclePlate: vehicle?.plate ?? null,
        });
      }

      await fetchOrders();
      setExpandedOrderId(null);
      setOrderDraftDriver('');
      setOrderDraftPeoneta('');
      setOrderDraftVehicle('');
      setOrderApplyToAll(false);
      setOrderAssignSaved(orderId);
      setTimeout(() => setOrderAssignSaved(null), 3000);
    } catch (err) {
      let msg = 'No se pudo guardar la asignación del pedido.';
      if (err instanceof ApiError) {
        try {
          const parsed = JSON.parse(err.body) as { message?: string | string[] };
          const apiMsg = parsed.message;
          if (typeof apiMsg === 'string' && apiMsg.length > 0) msg = apiMsg;
          else if (Array.isArray(apiMsg) && apiMsg.length > 0) msg = apiMsg.join(' · ');
        } catch {
          if (err.body) msg = err.body;
        }
      } else if (err instanceof Error && err.message) {
        msg = err.message;
      }
      setActionError(msg);
    } finally {
      setOrderAssignBusy(null);
    }
  };

  const handleSaveOrderAssignment = (orderId: string) => {
    const conflict = getSameVehicleConflict(orderId);
    if (conflict) {
      setSameVehicleConfirm({ orderId, plate: conflict.plate, otherCodes: conflict.otherCodes });
      return;
    }
    void performSaveOrderAssignment(orderId);
  };

  const fechaSrc =
    typeof route.startTime === 'string' && route.startTime.includes('T')
      ? route.startTime
      : route.createdAt;

  const deliveredCount = assigned.filter((o) => o.status === 'delivered').length;
  const rejectedCount = assigned.filter((o) => o.status === 'rejected').length;
  const terminalCount = deliveredCount + rejectedCount;
  const deliveryProgressPct =
    assigned.length > 0 ? Math.round((terminalCount / assigned.length) * 100) : 0;

  const valuationRefreshKey = useMemo(
    () =>
      `${assigned.length}-${deliveredCount}-${totals.bultos}-${route.status}-${route.estimatedDistance}`,
    [assigned.length, deliveredCount, totals.bultos, route.status, route.estimatedDistance],
  );

  const routeClientLabel = useMemo(() => {
    if (route.clientId) {
      const c = clients.find((x) => x.id === route.clientId);
      if (c?.companyName) return c.companyName;
    }
    return assigned[0]?.clientName?.trim() || '—';
  }, [route.clientId, clients, assigned]);

  const defaultOrderOrigin = useMemo(() => {
    const routeClient = route.clientId
      ? clients.find((c) => c.id === route.clientId)
      : undefined;
    return resolveDefaultPickupAddress(routeClient, tenant);
  }, [route.clientId, clients, tenant]);

  const routeDriversLabel = useMemo(
    () => summarizeRouteAssignees(assigned, 'driverName'),
    [assigned],
  );
  const routePeonetasLabel = useMemo(
    () => summarizeRouteAssignees(assigned, 'peonetaName'),
    [assigned],
  );

  const [codeCopied, setCodeCopied] = useState(false);
  const [deleteRouteOpen, setDeleteRouteOpen] = useState(false);
  const [deleteRouteBusy, setDeleteRouteBusy] = useState(false);
  const [editRouteOpen, setEditRouteOpen] = useState(false);
  const [editRouteBusy, setEditRouteBusy] = useState(false);
  const [editRouteError, setEditRouteError] = useState<string | null>(null);
  const copyRouteCode = async () => {
    const label = formatRouteSequence(route);
    if (label === '—') return;
    try {
      await navigator.clipboard.writeText(label);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleConfirmDeleteRoute = async () => {
    setDeleteRouteBusy(true);
    setActionError(null);
    try {
      const result = await deleteRoute(route.id);
      await fetchOrders();
      await fetchRoutes();
      setDeleteRouteOpen(false);
      onClose();
      const ordersDeleted = result?.orders_deleted ?? assigned.length;
      toast.info(
        'Ruta eliminada',
        ordersDeleted > 0
          ? `Se eliminaron ${ordersDeleted} pedido${ordersDeleted === 1 ? '' : 's'} en cadena.`
          : 'La ruta no tenía pedidos asociados.',
      );
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : 'No se pudo eliminar la ruta.',
      );
      setDeleteRouteOpen(false);
    } finally {
      setDeleteRouteBusy(false);
    }
  };

  const handleEditRouteSubmit = async (data: RouteFormData) => {
    setEditRouteError(null);
    setEditRouteBusy(true);
    try {
      const sequence = parseRouteSequenceInput(data.guiaInterna);
      await updateRoute(route.id, {
        name: data.name.trim(),
        notes: data.notes.trim() || undefined,
        clientId: data.clientId ? data.clientId : null,
        ...(sequence != null ? { guiaInterna: sequence } : {}),
      });
      await fetchRoutes();
      setEditRouteOpen(false);
    } catch (e) {
      setEditRouteError(e instanceof ApiError ? e.message : 'No se pudo guardar la ruta.');
    } finally {
      setEditRouteBusy(false);
    }
  };

  return (
    <>
      <div
        className="flex flex-col h-full min-h-0 w-full overflow-hidden bg-white/30 dark:bg-stone-950/20 backdrop-blur-md"
        role="complementary"
        aria-label={`Detalle de ruta ${formatRouteDisplayTitle(route)}`}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-200/70 dark:border-stone-800/70 bg-white/60 dark:bg-stone-950/35 backdrop-blur-md shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 -ml-1 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Volver al listado"
          >
            <ArrowLeft size={20} aria-hidden />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Package size={16} className="text-primary-600 dark:text-primary-400 shrink-0" aria-hidden />
            <span className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">
              Detalle de ruta
            </span>
          </div>
          {onToggleFullscreen ? (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="hidden lg:flex shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              aria-pressed={fullscreen}
            >
              {fullscreen ? <Minimize2 size={18} aria-hidden /> : <Maximize2 size={18} aria-hidden />}
            </button>
          ) : null}
          {canManage ? (
            <button
              type="button"
              onClick={() => setTrackingRouteOpen(true)}
              className={clsx(
                'shrink-0 rounded-lg p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors',
                trackingRouteOpen
                  ? 'text-primary-700 bg-primary-100 dark:text-primary-200 dark:bg-primary-950/50'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200',
              )}
              aria-label="Enviar seguimiento de ruta"
              aria-pressed={trackingRouteOpen}
              title={trackingRouteOpen ? 'Seguimiento (activo)' : 'Enviar seguimiento de ruta'}
            >
              <Share2 size={18} aria-hidden />
            </button>
          ) : null}
          {canManage ? (
            <button
              type="button"
              onClick={() => void handleExportRoute()}
              className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Exportar Excel de esta ruta"
              title="Exportar Excel de esta ruta"
            >
              <Download size={18} aria-hidden />
            </button>
          ) : null}
          {canManage ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditRouteOpen(true)}
                className={clsx(
                  'shrink-0 rounded-lg p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors',
                  editRouteOpen
                    ? 'text-primary-700 bg-primary-100 dark:text-primary-200 dark:bg-primary-950/50'
                    : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200',
                )}
                aria-label="Editar ruta"
                aria-pressed={editRouteOpen}
                title={editRouteOpen ? 'Editar (activo)' : 'Editar ruta'}
              >
                <Pencil size={18} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setDeleteRouteOpen(true)}
                disabled={deleteRouteBusy}
                className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
                aria-label="Eliminar ruta"
              >
                <Trash2 size={18} aria-hidden />
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="hidden lg:flex shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Cerrar panel"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Todo el detalle en un solo scroll (resumen + pedidos + formularios) */}
        <div
          className="route-panel-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y px-3 pb-3 pt-2 space-y-2.5"
          aria-label="Detalle y pedidos de la ruta"
        >
          <div className={clsx(containerCard, 'p-3')}>
            <div className="flex gap-2.5">
              <div
                className="size-10 shrink-0 rounded-lg bg-primary-50 border border-primary-200/80 dark:bg-stone-800 dark:border-stone-700 flex items-center justify-center"
                aria-hidden
              >
                <Box size={20} className="text-primary-600 dark:text-amber-500/90" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span translate="no" className="font-mono text-sm font-bold text-stone-900 dark:text-white truncate">
                        N° {formatRouteSequence(route)}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyRouteCode()}
                        className="p-0.5 rounded text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        aria-label={codeCopied ? 'N° copiado' : 'Copiar n° de ruta'}
                      >
                        {codeCopied ? (
                          <Check size={12} className="text-emerald-400" aria-hidden />
                        ) : (
                          <Copy size={12} aria-hidden />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate leading-tight">{route.name}</p>
                  </div>
                  <RoutePriorityChip status={route.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2.5 pt-2.5 border-t border-stone-200 dark:border-stone-800">
              <RouteModalStat label="Cuenta">{routeClientLabel}</RouteModalStat>
              <RouteModalStat label="Fecha">{formatRouteDayElegant(fechaSrc)}</RouteModalStat>
              <RouteModalStat label="Choferes">
                <span title="Asignación por pedido en esta ruta">
                  {routeDriversLabel || '—'}
                </span>
                {routePeonetasLabel ? (
                  <span
                    className="block text-[10px] font-normal text-stone-400 dark:text-stone-500 mt-0.5 leading-snug"
                    title="Peoneta por pedido"
                  >
                    Peoneta: {routePeonetasLabel}
                  </span>
                ) : null}
              </RouteModalStat>
              <RouteModalStat label="Vehículos">
                <span title="Patente por pedido en esta ruta">
                  {summarizeRouteVehicles(assigned, route.vehiclePlate) || '—'}
                </span>
              </RouteModalStat>
            </div>

            <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400 tabular-nums flex flex-wrap gap-x-3 gap-y-0.5">
              <span>
                <span className="text-stone-500">Pedidos </span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">{totals.pedidos}</span>
              </span>
              <span>
                <span className="text-stone-500">Bultos </span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">{totals.bultos}</span>
              </span>
              <span>
                <span className="text-stone-500">Entregados </span>
                <span
                  className={clsx(
                    'font-semibold tabular-nums inline-flex items-center gap-1',
                    deliveredCount > 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-stone-800 dark:text-stone-200',
                  )}
                >
                  {deliveredCount > 0 ? <CheckCircle2 size={12} aria-hidden /> : null}
                  {deliveredCount}/{assigned.length}
                </span>
              </span>
              {rejectedCount > 0 ? (
                <span>
                  <span className="text-stone-500">Rechazados </span>
                  <span className="font-semibold text-red-700 dark:text-red-300 tabular-nums inline-flex items-center gap-1">
                    <AlertTriangle size={12} aria-hidden />
                    {rejectedCount}
                    <span className="font-normal text-red-600/80 dark:text-red-200/80">· requieren acción</span>
                  </span>
                </span>
              ) : null}
            </p>

            {rejectedCount > 0 && route.status === 'completed' ? (
              <div className="mt-2 rounded-lg border border-red-300/90 bg-red-50/80 px-2.5 py-2 dark:border-red-900/60 dark:bg-red-950/40">
                <p className="text-[11px] text-red-900 dark:text-red-100 leading-snug">
                  Ruta completada para el repartidor, con {rejectedCount} pedido
                  {rejectedCount !== 1 ? 's' : ''} en limbo. Reprograma, reasigna o quita de la ruta.
                </p>
              </div>
            ) : null}

            {assigned.length > 0 ? (
              <div
                className="mt-2 h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden"
                role="progressbar"
                aria-valuenow={deliveryProgressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progreso de ruta: ${terminalCount} de ${assigned.length} pedidos resueltos`}
              >
                <div
                  className={clsx(
                    'h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none',
                    rejectedCount > 0 ? 'bg-red-500' : 'bg-emerald-500',
                  )}
                  style={{ width: `${deliveryProgressPct}%` }}
                />
              </div>
            ) : null}

            {route.notes?.trim() ? (
              <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-2 flex gap-1.5 dark:bg-amber-950/40 dark:border-amber-800/50">
                <MapPin size={12} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" aria-hidden />
                <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 leading-snug line-clamp-3">
                  {route.notes.trim()}
                </p>
              </div>
            ) : null}
          </div>

          {assigned.length > 0 ? (
            <RouteValuationPanel
              routeId={route.id}
              canManage={canManage}
              refreshKey={valuationRefreshKey.length}
            />
          ) : null}

          <div
            className="sticky top-0 z-[1] space-y-2.5 py-2.5 px-2.5 -mx-0.5 mb-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-surface dark:bg-stone-900"
            role="toolbar"
            aria-label="Acciones sobre pedidos de la ruta"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 px-0.5">
                <h3 className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Pedidos en ruta
                </h3>
                {assigned.length > 0 ? (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums mt-0.5">
                    {orderStatusFilter === 'all' ? (
                      <>{assigned.length} en total</>
                    ) : (
                      <>
                        <span className="font-medium text-stone-700 dark:text-stone-200">
                          {filteredAssigned.length}
                        </span>
                        <span className="text-stone-400"> / {assigned.length}</span>
                        {orderStatusFilter !== 'all' ? (
                          <button
                            type="button"
                            onClick={() => setOrderStatusFilter('all')}
                            className="ml-2 text-primary-700 dark:text-primary-300 hover:underline cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
                          >
                            Limpiar filtro
                          </button>
                        ) : null}
                      </>
                    )}
                  </p>
                ) : null}
              </div>
              {canManage ? (
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={<Plus size={14} aria-hidden />}
                    onClick={openCreateOrder}
                    disabled={busyId === 'create' || bulkAssignBusy || createOrderOpen}
                    className={clsx(createOrderOpen && 'ring-2 ring-primary-400/60 ring-offset-1 dark:ring-offset-stone-950')}
                    aria-pressed={createOrderOpen}
                  >
                    Nuevo pedido
                  </Button>
                  {assigned.length > 0 ? (
                    <Button
                      type="button"
                      variant={bulkAssignOpen ? 'violet' : 'violet-soft'}
                      size="sm"
                      icon={<ListChecks size={14} aria-hidden />}
                      onClick={() => (bulkAssignOpen ? closeBulkAssign() : openBulkAssign())}
                      disabled={bulkAssignBusy || orderAssignBusy !== null || busyId === 'create'}
                      aria-pressed={bulkAssignOpen}
                    >
                      {bulkAssignOpen ? 'Listo' : 'Asignación masiva'}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {assigned.length > 0 ? (
              <div
                className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 scrollbar-thin"
                role="group"
                aria-label="Filtrar pedidos"
              >
                {orderFilterChips.map((chip) => {
                  const active = orderStatusFilter === chip.value;
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => setOrderStatusFilter(chip.value)}
                      aria-pressed={active}
                      className={clsx(
                        'inline-flex items-center gap-1.5 shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium cursor-pointer',
                        'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
                        active
                          ? chip.accent === 'amber'
                            ? 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100'
                            : 'border-primary-400 bg-primary-50 text-primary-900 dark:border-primary-600 dark:bg-primary-950/40 dark:text-primary-100'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300 dark:hover:bg-stone-800',
                      )}
                    >
                      {chip.dotClass ? (
                        <span
                          className={clsx('size-1.5 rounded-full shrink-0', chip.dotClass)}
                          aria-hidden
                        />
                      ) : null}
                      <span className="whitespace-nowrap">{chip.label}</span>
                      <span
                        className={clsx(
                          'tabular-nums rounded-md px-1 py-px text-[10px] font-semibold',
                          active
                            ? chip.accent === 'amber'
                              ? 'bg-amber-200/80 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100'
                              : 'bg-primary-200/70 text-primary-900 dark:bg-primary-900/50 dark:text-primary-100'
                            : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                        )}
                      >
                        {chip.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {canManage && assigned.length > 0 && !bulkAssignOpen ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-stone-500 dark:text-stone-400 px-0.5 -mt-1">
              <span className="inline-flex items-center gap-1">
                <span className="size-2.5 rounded border border-[#ff7b00] bg-[#ff7b00]/20" aria-hidden />
                Acción abierta
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2.5 rounded border border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-800" aria-hidden />
                Disponible
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2.5 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 opacity-50" aria-hidden />
                Bloqueada
              </span>
            </p>
          ) : null}

          {bulkAssignOpen && assigned.length > 0 ? (
            <div className="rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-violet-50/40 dark:bg-violet-950/20 px-3 py-3 space-y-3 animate-toolbar-panel-enter motion-reduce:animate-none">
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Los números de pedido coinciden con el orden de la lista ({assigned.length} en total).
              </p>
              <RangeAssignRulesPanel
                total={assigned.length}
                rules={bulkAssignRules}
                onRulesChange={setBulkAssignRules}
                onApplyRules={handleBulkApplyRules}
                drivers={driversList}
                vehicles={vehiclesSorted}
                peonetas={peonetasList}
                showPeoneta
                disabled={bulkAssignBusy}
                applyLabel="Guardar asignación"
                tone="violet"
              />
              <div className="rounded-lg border border-stone-200/80 dark:border-stone-700/80 bg-white/60 dark:bg-stone-900/40 px-3 py-3 space-y-2">
                <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  Ubicación destino (opcional)
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Se aplica a los pedidos cubiertos por las reglas. Si no hay reglas de equipo, aplica a todos.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    id="bulk-dest-city"
                    label="Ciudad destino"
                    name="bulk_dest_city"
                    placeholder="Ej: Maipú…"
                    value={bulkDraftCity}
                    onChange={(e) => setBulkDraftCity(e.target.value)}
                    disabled={bulkAssignBusy}
                    autoComplete="off"
                    containerClassName="sm:col-span-1"
                  />
                  <Select
                    id="bulk-dest-region"
                    label="Región destino"
                    value={bulkDraftRegion}
                    onChange={(e) => setBulkDraftRegion(e.target.value)}
                    options={bulkRegionSelectOpts}
                    disabled={bulkAssignBusy}
                    autoComplete="off"
                    containerClassName="sm:col-span-2"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {actionError ? (
            <p
              className="text-xs text-red-800 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-3 py-2"
              role="alert"
            >
              {actionError}
            </p>
          ) : null}
          {assigned.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 dark:border-stone-700 dark:bg-stone-900/30 py-8 text-center">
              <Package size={24} className="mx-auto text-stone-400 dark:text-stone-600 mb-1.5" aria-hidden />
              <p className="text-xs text-stone-500">Ningún pedido en esta ruta aún.</p>
            </div>
          ) : filteredAssigned.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 dark:border-stone-700 dark:bg-stone-900/30 py-8 text-center space-y-2">
              <Filter size={22} className="mx-auto text-stone-400 dark:text-stone-600" aria-hidden />
              <p className="text-xs text-stone-500">
                {orderStatusFilter === 'unassigned'
                  ? 'Ningún pedido sin asignación en esta ruta.'
                  : 'Ningún pedido con ese estado en esta ruta.'}
              </p>
              <button
                type="button"
                className="text-[11px] font-medium text-primary-700 dark:text-primary-300 hover:underline cursor-pointer"
                onClick={() => setOrderStatusFilter('all')}
              >
                Ver todos ({assigned.length})
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredAssigned.map((o) => {
                const orderIndex = assignedIndexById.get(o.id) ?? 0;
                const destinatario = o.clientName?.trim() || 'Por confirmar';
                const originParts = orderAddressParts(o.origin);
                const destParts = orderAddressParts(o.destination);
                const hasOrigin = originParts.location !== '—';
                const isAssignOpen = expandedOrderId === o.id;
                const isEditOpen = editingOrderId === o.id;
                const vehicleWarn = isAssignOpen ? getSameVehicleConflict(o.id) : null;
                const hasAssignment =
                  Boolean(o.driverName?.trim()) ||
                  Boolean(o.peonetaName?.trim()) ||
                  Boolean(o.vehiclePlate?.trim());

                const isDelivered = o.status === 'delivered';
                const isRejected = o.status === 'rejected';
                const isInTransit = o.status === 'in_transit';
                const showStatusOnCard = isDelivered || isRejected || isInTransit;
                const inspectionPhotos =
                  isDelivered || isRejected
                    ? photosForOrderOnRoute(photos, route, o)
                    : [];
                const deliveryReceiver = isDelivered
                  ? pickDeliveryReceiverForOrder(routeDeliveryRecords, o.id, o.code)
                  : null;
                const rejectionInfo = isRejected
                  ? pickRejectionInfoForOrder(routeDeliveryRecords, o.id, o.code)
                  : null;
                const referenceFields = parseOrderReferenceFields(o.notes);

                return (
                  <li
                    key={o.id}
                    className={clsx(
                      'glass-card-order overflow-hidden',
                      isDelivered && 'glass-card-order--delivered',
                      isRejected && 'glass-card-order--rejected',
                      isInTransit && 'glass-card-order--in-transit',
                    )}
                  >
                    <div className="p-3 space-y-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="shrink-0 flex items-center justify-center size-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-600 dark:text-stone-300 tabular-nums"
                          aria-hidden
                        >
                          {orderIndex + 1}
                        </div>
                        <div
                          className={clsx(
                            'size-9 shrink-0 rounded-xl flex items-center justify-center',
                            isDelivered && 'bg-emerald-100/90 dark:bg-emerald-950/50',
                            isRejected && 'bg-red-100/90 dark:bg-red-950/40',
                            !isDelivered && !isRejected && 'glass-icon-chip',
                          )}
                          aria-hidden
                        >
                          {isDelivered ? (
                            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                          ) : isRejected ? (
                            <XCircle size={18} className="text-red-600 dark:text-red-400" />
                          ) : (
                            <Package size={16} className="text-stone-600 dark:text-stone-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              translate="no"
                              onClick={() => {
                                setEditingOrderId(null);
                                setDetailOrder(o);
                              }}
                              className={clsx(
                                'font-mono text-xs font-semibold hover:text-primary-600 dark:hover:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded',
                                isDelivered
                                  ? 'text-emerald-900 dark:text-emerald-100'
                                  : 'text-stone-600 dark:text-stone-300',
                              )}
                              title="Ver detalle del pedido"
                            >
                              {formatOrderInRouteLabel(route, orderIndex)}
                            </button>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {showStatusOnCard ? (
                                <OrderStatusBadge status={o.status} />
                              ) : null}
                              <span
                                className={clsx(
                                  'rounded-lg px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                                  isDelivered
                                    ? 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                                    : 'bg-stone-100/90 text-stone-600 dark:bg-stone-800/90 dark:text-stone-300',
                                )}
                              >
                                {o.bultos} bulto{o.bultos === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>

                          <div
                            className={clsx(
                              'mt-2.5 rounded-xl border px-2.5 py-2',
                              isDelivered
                                ? 'border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/25'
                                : isRejected
                                  ? 'border-red-200/70 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20'
                                  : 'border-stone-200/80 bg-stone-50/70 dark:border-stone-700/60 dark:bg-stone-900/45',
                            )}
                          >
                            <div
                              className={clsx(
                                'grid gap-2 min-w-0',
                                hasOrigin ? 'grid-cols-[1fr_auto_1fr]' : 'grid-cols-1',
                              )}
                            >
                              {hasOrigin ? (
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                    Origen
                                  </p>
                                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate leading-snug">
                                    {originParts.location}
                                  </p>
                                  {originParts.street ? (
                                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                                      {originParts.street}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                              {hasOrigin ? (
                                <div className="flex items-center justify-center self-center px-0.5" aria-hidden>
                                  <ArrowRight size={16} className="text-stone-400 dark:text-stone-500 shrink-0" />
                                </div>
                              ) : null}
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-400">
                                  Destino
                                </p>
                                <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate leading-snug">
                                  {destParts.location}
                                </p>
                                {destParts.street ? (
                                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                                    {destParts.street}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-2">
                            <span className="font-medium text-stone-600 dark:text-stone-300">{destinatario}</span>
                          </p>

                          {referenceFields ? (
                            <OrderReferenceInfo className="mt-2.5" fields={referenceFields} />
                          ) : null}

                          {deliveryReceiver ? (
                            <OrderDeliveryReceiverInfo
                              className="mt-2.5"
                              name={deliveryReceiver.name}
                              rut={deliveryReceiver.rut}
                            />
                          ) : null}

                          {isRejected ? (
                            <OrderRejectionInfo
                              className="mt-2.5"
                              info={
                                rejectionInfo ?? {
                                  motivo: 'Pedido rechazado',
                                  obs: '',
                                }
                              }
                              onReactivate={
                                canManage
                                  ? () => {
                                      void handleReactivateOrder(o.id);
                                    }
                                  : undefined
                              }
                              reactivating={busyId === o.id}
                            />
                          ) : null}

                          {inspectionPhotos.length > 0 ? (
                            <OrderInspectionThumbnails
                              className="mt-2.5"
                              photos={inspectionPhotos}
                              onPhotoClick={(index) =>
                                setInspectionLightbox({ photos: inspectionPhotos, index })
                              }
                            />
                          ) : null}
                        </div>
                      </div>

                      {hasAssignment || orderAssignSaved === o.id ? (
                        <div className="flex flex-wrap gap-1.5 pl-12">
                          {o.driverName?.trim() ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50/90 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:text-blue-200">
                              <UserCircle size={11} aria-hidden />
                              <span className="truncate max-w-[8rem]">{o.driverName.trim()}</span>
                            </span>
                          ) : null}
                          {o.peonetaName?.trim() ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-600/70 px-2 py-0.5 text-[11px] font-medium text-stone-700 dark:text-stone-200">
                              <span className="truncate max-w-[8rem]">{o.peonetaName.trim()}</span>
                            </span>
                          ) : null}
                          {o.vehiclePlate?.trim() ? (
                            <span
                              translate="no"
                              className="inline-flex items-center gap-1 rounded-md bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700 px-2 py-0.5 text-[11px] font-mono font-medium text-stone-700 dark:text-stone-200"
                            >
                              <Truck size={11} aria-hidden />
                              {o.vehiclePlate.trim()}
                            </span>
                          ) : null}
                          {orderAssignSaved === o.id ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              <Check size={11} aria-hidden />
                              Guardado
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      {canManage && !bulkAssignOpen ? (
                        <div className="flex gap-2 pt-1 border-t border-stone-200/70 dark:border-stone-800/70">
                          <OrderCardAction
                            icon={<UserCircle size={15} />}
                            label="Asignar"
                            active={isAssignOpen}
                            onClick={() =>
                              isAssignOpen ? handleCancelOrderAssign() : handleOpenOrderAssign(o)
                            }
                            disabled={busyId !== null && busyId !== o.id}
                          />
                          <OrderCardAction
                            icon={<Pencil size={15} />}
                            label="Editar"
                            active={isEditOpen}
                            onClick={() => handleOpenOrderEdit(o)}
                            disabled={busyId !== null && busyId !== o.id}
                          />
                          <OrderCardAction
                            icon={<Unlink size={15} />}
                            label="Quitar"
                            tone="danger"
                            loading={busyId === o.id}
                            onClick={() => setRemoveOrderId(o.id)}
                            disabled={busyId !== null && busyId !== o.id}
                          />
                        </div>
                      ) : canManage && bulkAssignOpen ? (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/70 dark:border-stone-800/70">
                          Usa los rangos Desde–Hasta del panel superior para asignar por pedido.
                        </p>
                      ) : (
                        <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => setDetailOrder(o)}>
                          Ver detalle
                        </Button>
                      )}
                    </div>

                    {isAssignOpen ? (
                      <div className="border-t border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950/60 px-3 py-3 space-y-3">
                        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                          Asignación del pedido
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Select
                            id={`order-driver-${o.id}`}
                            label="Chofer"
                            value={orderDraftDriver}
                            onChange={(e) => setOrderDraftDriver(e.target.value)}
                            options={driverSelectOpts}
                            disabled={orderAssignBusy !== null}
                            autoComplete="off"
                          />
                          <Select
                            id={`order-peoneta-${o.id}`}
                            label="Peoneta"
                            value={orderDraftPeoneta}
                            onChange={(e) => setOrderDraftPeoneta(e.target.value)}
                            options={peonetaSelectOpts}
                            disabled={orderAssignBusy !== null}
                            autoComplete="off"
                          />
                          <Select
                            id={`order-vehicle-${o.id}`}
                            label="Vehículo"
                            value={orderDraftVehicle}
                            onChange={(e) => setOrderDraftVehicle(e.target.value)}
                            options={vehicleSelectOpts}
                            disabled={orderAssignBusy !== null}
                            autoComplete="off"
                          />
                        </div>
                        {vehicleWarn ? (
                          <p
                            role="status"
                            className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3"
                          >
                            {orderApplyToAll
                              ? `Al guardar, el mismo vehículo (${vehicleWarn.plate}) quedará en todos los pedidos. Te pediremos confirmación.`
                              : `Este vehículo (${vehicleWarn.plate}) ya está en ${vehicleWarn.otherCodes.join(', ')}. Te pediremos confirmación al guardar.`}
                          </p>
                        ) : null}
                        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-stone-600 dark:text-stone-300">
                          <input
                            type="checkbox"
                            checked={orderApplyToAll}
                            onChange={(e) => setOrderApplyToAll(e.target.checked)}
                            disabled={orderAssignBusy !== null}
                            className="h-4 w-4 rounded border-stone-300 dark:border-stone-600 accent-primary-600"
                          />
                          Aplicar a todos los pedidos de esta ruta
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            loading={orderAssignBusy === o.id}
                            disabled={orderAssignBusy !== null}
                            onClick={() => void handleSaveOrderAssignment(o.id)}
                          >
                            Guardar asignación
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={orderAssignBusy !== null}
                            onClick={handleCancelOrderAssign}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {isEditOpen ? (
                      <div className="border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900/40 px-3 py-3">
                        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                          Editar pedido
                        </p>
                        <OrderForm
                          key={`edit-${o.id}`}
                          initial={orderToFormData(o)}
                          submitLabel="Guardar cambios"
                          onSubmit={(d) => void handleUpdateOrder(o.id, d)}
                          onCancel={() => setEditingOrderId(null)}
                          lockedClientId={route.clientId?.trim() || undefined}
                          lockedClientName={
                            routeClientLabel !== '—' ? routeClientLabel : undefined
                          }
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      {detailOrder ? (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          routeLabel={formatRouteDisplayTitle(route)}
          onReactivate={
            canManage && detailOrder.status === 'rejected'
              ? () => {
                  void handleReactivateOrder(detailOrder.id).then(() => {
                    setDetailOrder(null);
                  });
                }
              : undefined
          }
          reactivating={busyId === detailOrder.id}
        />
      ) : null}

      {inspectionLightbox ? (
        <PhotoLightbox
          photos={inspectionLightbox.photos}
          index={inspectionLightbox.index}
          onIndexChange={(index) =>
            setInspectionLightbox((prev) => (prev ? { ...prev, index } : prev))
          }
          onClose={() => setInspectionLightbox(null)}
        />
      ) : null}

      {createOrderOpen ? (
        <Modal
          open
          onClose={closeCreateOrder}
          title="Nuevo pedido"
          description={`${formatRouteDisplayTitle(route)} — se creará en esta ruta`}
          size="xl"
        >
          <OrderForm
            key={createFormKey}
            submitLabel={busyId === 'create' ? 'Creando…' : 'Crear pedido en la ruta'}
            onSubmit={(d) => void handleCreateOrder(d)}
            onCancel={closeCreateOrder}
            lockedClientId={route.clientId?.trim() || undefined}
            lockedClientName={
              routeClientLabel !== '—' ? routeClientLabel : undefined
            }
            defaultOrigin={{
              originStreet: defaultOrderOrigin.street,
              originCity: defaultOrderOrigin.city,
              originRegion: defaultOrderOrigin.region,
            }}
          />
        </Modal>
      ) : null}

      {editRouteOpen ? (
        <Modal
          open
          onClose={() => {
            if (editRouteBusy) return;
            setEditRouteOpen(false);
            setEditRouteError(null);
          }}
          title="Editar ruta"
          description={formatRouteDisplayTitle(route)}
          size="xl"
        >
          <RouteForm
            initial={{
              guiaInterna: String(resolveRouteSequence(route) ?? ''),
              name: route.name,
              notes: route.notes ?? '',
              clientId: route.clientId ?? '',
            }}
            onSubmit={handleEditRouteSubmit}
            onCancel={() => {
              if (editRouteBusy) return;
              setEditRouteOpen(false);
              setEditRouteError(null);
            }}
            submitLabel={editRouteBusy ? 'Guardando…' : 'Guardar cambios'}
            error={editRouteError}
          />
        </Modal>
      ) : null}

      <TypeToConfirmModal
        open={deleteRouteOpen}
        onClose={() => setDeleteRouteOpen(false)}
        onConfirm={handleConfirmDeleteRoute}
        title="Eliminar ruta"
        loading={deleteRouteBusy}
        confirmLabel="Eliminar ruta"
        message={
          <>
            <p>
              Se eliminará la ruta <strong translate="no">N° {formatRouteDisplayLabel(route)}</strong>
              {route.name ? (
                <>
                  {' '}
                  (<span translate="no">{route.name}</span>)
                </>
              ) : null}
              {' '}
              y todos sus pedidos asociados.
            </p>
            <p className="mt-2">
              {assigned.length === 0
                ? 'No hay pedidos en esta ruta.'
                : `${assigned.length} pedido${assigned.length === 1 ? '' : 's'} serán eliminados permanentemente.`}
            </p>
          </>
        }
      />

      <ConfirmModal
        open={sameVehicleConfirm !== null}
        onClose={() => setSameVehicleConfirm(null)}
        onConfirm={() => {
          const conf = sameVehicleConfirm;
          setSameVehicleConfirm(null);
          if (!conf) return;
          if (conf.bulk) {
            void performBulkApplyRules();
            return;
          }
          if (conf.orderId) void performSaveOrderAssignment(conf.orderId);
        }}
        title="Mismo vehículo en varios pedidos"
        message={
          sameVehicleConfirm
            ? sameVehicleConfirm.bulk
              ? `¿Asignar el mismo vehículo (${sameVehicleConfirm.plate}) a los pedidos ${sameVehicleConfirm.otherCodes.join(', ')}?`
              : orderApplyToAll
                ? `¿Estás seguro de asignar el mismo vehículo (${sameVehicleConfirm.plate}) a los ${sameVehicleConfirm.otherCodes.length} pedidos de esta ruta?`
                : `¿Estás seguro de asignar el mismo vehículo (${sameVehicleConfirm.plate})? Ya está en el pedido ${sameVehicleConfirm.otherCodes.join(', ')}.`
            : ''
        }
        confirmLabel="Sí, asignar igual"
        variant="warning"
      />
      {trackingRouteOpen ? (
        <SendTrackingModal
          routeId={route.id}
          routeCode={formatRouteSequence(route)}
          open
          onClose={() => setTrackingRouteOpen(false)}
        />
      ) : null}

      <ConfirmModal
        open={removeOrderId !== null}
        onClose={() => setRemoveOrderId(null)}
        onConfirm={() => {
          const id = removeOrderId;
          setRemoveOrderId(null);
          if (id) void handleRemove(id);
        }}
        title="Quitar pedido de la ruta"
        message="Esto solo desvincula el pedido de esta ruta. El pedido no se elimina."
        confirmLabel="Quitar de la ruta"
        variant="warning"
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function RoutesPage() {
  const { routes, loading: routesLoading, addRoute, fetchRoutes, deleteRoute } = useRouteStore();
  const { orders, fetchOrders } = useOrderStore();
  const { fetchPhotos } = usePhotoStore();
  const { tenant } = useAuthStore();
  const { clients, fetchClients } = useClientStore();

  useEffect(() => {
    void fetchRoutes();
    void fetchOrders();
    void fetchPhotos();
    void fetchClients();
  }, [fetchRoutes, fetchOrders, fetchPhotos, fetchClients]);

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const client of clients) {
      if (client.companyName?.trim()) map.set(client.id, client.companyName.trim());
    }
    return map;
  }, [clients]);

  const routeAggById = useMemo(() => {
    const map = new Map<
      string,
      {
        pedidos: number;
        bultos: number;
        delivered: number;
        rejected: number;
        vehiclesLabel: string;
        driversLabel: string;
      }
    >();
    for (const r of routes) {
      const pedidosEnRuta = orders.filter((o) => o.routeId === r.id);
      map.set(r.id, {
        pedidos: pedidosEnRuta.length,
        bultos: pedidosEnRuta.reduce((s, o) => s + (Number(o.bultos) || 0), 0),
        delivered: pedidosEnRuta.filter((o) => o.status === 'delivered').length,
        rejected: pedidosEnRuta.filter((o) => o.status === 'rejected').length,
        vehiclesLabel: summarizeRouteVehicles(pedidosEnRuta, r.vehiclePlate),
        driversLabel: summarizeRouteAssignees(pedidosEnRuta, 'driverName'),
      });
    }
    return map;
  }, [routes, orders]);

  const [sortCol, setSortCol] = useState<RouteSortKey | null>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [filterRouteStatus, setFilterRouteStatus] = useState<RouteStatus | 'all'>('all');
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<RoutesDateRangeFilter>('30d');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewRoute, setShowNewRoute] = useState(false);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [layout, setLayout] = useState<RouteLayout>(() => {
    try { return (localStorage.getItem(LAYOUT_KEY) as RouteLayout) || 'cards'; }
    catch { return 'cards'; }
  });
  const { width: detailPanelWidth, commit: commitPanelWidth } = usePanelWidth();
  const pendingWidth = useRef(detailPanelWidth);
  useEffect(() => {
    pendingWidth.current = detailPanelWidth;
  }, [detailPanelWidth]);

  const handlePanelResize = useCallback((delta: number) => {
    pendingWidth.current = clampPanelWidth(pendingWidth.current + delta);
    commitPanelWidth(pendingWidth.current);
  }, [commitPanelWidth]);
  const [newRouteError, setNewRouteError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [detailPanelFullscreen, setDetailPanelFullscreen] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [bulkDeleteSelectedIds, setBulkDeleteSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);

  const closeBulkDeleteMode = useCallback(() => {
    setBulkDeleteMode(false);
    setBulkDeleteSelectedIds(new Set());
    setBulkDeleteOpen(false);
  }, []);

  const toggleBulkDeleteRoute = useCallback((id: string) => {
    setBulkDeleteSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const closeDetailPanel = useCallback(() => {
    setDetailPanelFullscreen(false);
    setSelectedRoute(null);
  }, []);

  useEffect(() => {
    if (!detailPanelFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailPanelFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailPanelFullscreen]);

  useEffect(() => {
    setSelectedRoute((prev) => {
      if (!prev) return null;
      const fresh = routes.find((r) => r.id === prev.id);
      return fresh ?? prev;
    });
  }, [routes]);

  const routeDateKey = (r: Route) =>
    typeof r.startTime === 'string' && r.startTime.includes('T') ? r.startTime : r.createdAt;

  const routeMatchesClient = useCallback(
    (route: Route, clientId: string) => {
      if (route.clientId === clientId) return true;
      return orders.some((o) => o.routeId === route.id && o.clientId === clientId);
    },
    [orders],
  );

  const clientsWithRoutes = useMemo(() => {
    const ids = new Set<string>();
    for (const route of routes) {
      if (route.clientId) ids.add(route.clientId);
      for (const order of orders) {
        if (order.routeId === route.id && order.clientId) ids.add(order.clientId);
      }
    }
    return clients
      .filter((c) => ids.has(c.id))
      .toSorted((a, b) => a.companyName.localeCompare(b.companyName, 'es'));
  }, [routes, orders, clients]);

  const clientFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos los clientes' },
      ...clientsWithRoutes.map((c) => ({ value: c.id, label: c.companyName })),
    ],
    [clientsWithRoutes],
  );

  const filteredRoutes = useMemo(() => {
    const cutoff = routesExportCutoff(filterDateRange);

    let data = routes.filter((r) => {
      if (filterRouteStatus !== 'all' && r.status !== filterRouteStatus) return false;
      if (filterClientId !== 'all' && !routeMatchesClient(r, filterClientId)) return false;
      if (cutoff) {
        const dateStr = routeDateKey(r);
        if (!dateStr || new Date(dateStr) < cutoff) return false;
      }
      if (search) {
        const t = search.toLowerCase();
        const pedidosEnRuta = orders.filter((o) => o.routeId === r.id);
        const agg = routeAggById.get(r.id);
        return (
          r.name.toLowerCase().includes(t) ||
          String(resolveRouteSequence(r) ?? '').includes(t) ||
          r.code.toLowerCase().includes(t) ||
          (agg?.driversLabel.toLowerCase().includes(t) ?? false) ||
          (agg?.vehiclesLabel.toLowerCase().includes(t) ?? false) ||
          pedidosEnRuta.some(
            (o) =>
              (o.driverName?.toLowerCase().includes(t) ?? false) ||
              (o.peonetaName?.toLowerCase().includes(t) ?? false) ||
              (o.vehiclePlate?.toLowerCase().includes(t) ?? false),
          )
        );
      }
      return true;
    });

    if (sortCol && sortDir) {
      data = data.toSorted((a, b) => {
        const aggA = routeAggById.get(a.id) ?? { pedidos: 0, bultos: 0, delivered: 0, rejected: 0, vehiclesLabel: '', driversLabel: '' };
        const aggB = routeAggById.get(b.id) ?? { pedidos: 0, bultos: 0, delivered: 0, rejected: 0, vehiclesLabel: '', driversLabel: '' };
        let av: string | number = '';
        let bv: string | number = '';
        switch (sortCol) {
          case 'code': {
            const seqA = resolveRouteSequence(a);
            const seqB = resolveRouteSequence(b);
            av = seqA ?? 0;
            bv = seqB ?? 0;
            break;
          }
          case 'name':
            av = a.name;
            bv = b.name;
            break;
          case 'status':
            av = a.status;
            bv = b.status;
            break;
          case 'pedidos':
            av = aggA.pedidos;
            bv = aggB.pedidos;
            break;
          case 'bultos':
            av = aggA.bultos;
            bv = aggB.bultos;
            break;
          case 'fecha':
            av = routeDateKey(a);
            bv = routeDateKey(b);
            break;
          case 'createdAt':
            av = a.createdAt;
            bv = b.createdAt;
            break;
          case 'driverName':
            av = aggA.driversLabel;
            bv = aggB.driversLabel;
            break;
          case 'vehiclePlate':
            av = aggA.vehiclesLabel;
            bv = aggB.vehiclesLabel;
            break;
        }
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv), 'es', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [routes, orders, filterRouteStatus, filterClientId, filterDateRange, search, sortCol, sortDir, routeAggById, routeMatchesClient]);

  const statusCounts = useMemo(
    () => Object.fromEntries(ROUTE_STATUSES.map((s) => [s, routes.filter((r) => r.status === s).length])),
    [routes],
  );

  const hasActiveFilters =
    filterRouteStatus !== 'all' || filterClientId !== 'all' || filterDateRange !== '30d';

  const exportRangeDescription = useMemo(
    () => describeRoutesExportRange(filterDateRange),
    [filterDateRange],
  );

  const exportFiltersDescription = useMemo(
    () =>
      describeRoutesExportFilters({
        dateRange: filterDateRange,
        routeStatus: filterRouteStatus,
        clientLabel:
          filterClientId !== 'all'
            ? clients.find((c) => c.id === filterClientId)?.companyName ?? null
            : null,
        search,
      }),
    [filterDateRange, filterRouteStatus, filterClientId, clients, search],
  );

  const handleExportRoutes = useCallback(async () => {
    if (filteredRoutes.length === 0) {
      toast.warning('Sin rutas para exportar', 'Ajusta los filtros o crea rutas primero.');
      return;
    }

    // Misma fuente que el detalle de ruta (donde sí se ve el receptor).
    // Evita /delivery-records global, que puede fallar o vaciarse con mucho volumen.
    let deliveryRecords: DbDeliveryRecord[] = [];
    try {
      const chunks = await Promise.all(
        filteredRoutes.map(async (route) => {
          try {
            const data = await api.get<DbDeliveryRecord[]>(
              `/routes/${route.id}/delivery-records`,
            );
            return Array.isArray(data) ? data : [];
          } catch {
            return [] as DbDeliveryRecord[];
          }
        }),
      );
      const byId = new Map<string, DbDeliveryRecord>();
      for (const rec of chunks.flat()) {
        if (rec?.id) byId.set(rec.id, rec);
      }
      deliveryRecords = [...byId.values()];
    } catch {
      toast.warning(
        'Sin registros de entrega',
        'Se exportará sin receptor ni hora de entrega. Revisa tu conexión e intenta de nuevo.',
      );
    }
    const { rowCount, routeCount, filename } = downloadRoutesExportXlsx(filteredRoutes, orders, {
      clientNames: clientNameById,
      tenant,
      dateRange: filterDateRange,
      deliveryRecords,
    });
    toast.info(
      'Exportación descargada',
      `${routeCount} ruta${routeCount === 1 ? '' : 's'} · ${rowCount} fila${rowCount === 1 ? '' : 's'} (${filename}). ${exportRangeDescription.summary}`,
    );
  }, [filteredRoutes, orders, clientNameById, tenant, filterDateRange, exportRangeDescription.summary]);

  const selectAllBulkDelete = useCallback(() => {
    setBulkDeleteSelectedIds(new Set(filteredRoutes.map((r) => r.id)));
  }, [filteredRoutes]);

  const selectNoneBulkDelete = useCallback(() => {
    setBulkDeleteSelectedIds(new Set());
  }, []);

  const bulkDeleteTargets = useMemo(
    () => routes.filter((r) => bulkDeleteSelectedIds.has(r.id)),
    [routes, bulkDeleteSelectedIds],
  );

  const bulkDeleteOrderCount = useMemo(
    () => orders.filter((o) => o.routeId && bulkDeleteSelectedIds.has(o.routeId)).length,
    [orders, bulkDeleteSelectedIds],
  );

  const handleConfirmBulkDelete = async () => {
    const ids = [...bulkDeleteSelectedIds];
    if (ids.length === 0) return;
    setBulkDeleteBusy(true);
    try {
      const results = await Promise.allSettled(ids.map((id) => deleteRoute(id)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      const ok = ids.length - failed;
      const ordersDeleted = results.reduce((sum, r) => {
        if (r.status !== 'fulfilled' || !r.value) return sum;
        return sum + (r.value.orders_deleted ?? 0);
      }, 0);
      await fetchOrders();
      await fetchRoutes();
      if (selectedRoute && bulkDeleteSelectedIds.has(selectedRoute.id)) {
        setSelectedRoute(null);
        setDetailPanelFullscreen(false);
      }
      closeBulkDeleteMode();
      if (failed === 0) {
        toast.info(
          ok === 1 ? 'Ruta eliminada' : `${ok} rutas eliminadas`,
          ordersDeleted > 0
            ? `${ordersDeleted} pedido${ordersDeleted === 1 ? '' : 's'} eliminado${ordersDeleted === 1 ? '' : 's'} en cadena.`
            : undefined,
        );
      } else if (ok === 0) {
        toast.error('No se pudieron eliminar las rutas seleccionadas.');
      } else {
        toast.error(`${ok} rutas eliminadas; ${failed} no se pudieron eliminar.`);
      }
    } catch {
      toast.error('No se pudieron eliminar las rutas seleccionadas.');
    } finally {
      setBulkDeleteBusy(false);
    }
  };

  const handleAddRoute = async (data: RouteFormData) => {
    setNewRouteError(null);
    try {
      const sequence = parseRouteSequenceInput(data.guiaInterna);
      if (sequence == null) {
        setNewRouteError('Indica un N° de ruta válido (entero positivo).');
        return;
      }
      await addRoute({
        name: data.name,
        guiaInterna: sequence,
        ...(data.notes ? { notes: data.notes } : {}),
        ...(data.clientId ? { clientId: data.clientId } : {}),
      });
      await fetchRoutes();
      setShowNewRoute(false);
    } catch (e) {
      if (e instanceof ApiError) {
        try {
          const j = JSON.parse(e.body) as { message?: string | string[] };
          const m = j.message;
          setNewRouteError(Array.isArray(m) ? m.join('. ') : m || `Error ${e.status}`);
        } catch {
          setNewRouteError(e.body || `Error ${e.status}`);
        }
      } else {
        setNewRouteError('No se pudo crear la ruta');
      }
    }
  };

  const totalBultos = filteredRoutes.reduce(
    (s, r) => s + (routeAggById.get(r.id)?.bultos ?? 0),
    0,
  );

  const panelOpen = selectedRoute !== null;
  const panelFullscreenActive = panelOpen && detailPanelFullscreen;

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden -mx-6 -mb-6 -mt-1">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap px-6 pt-1 pb-3 shrink-0 border-b border-stone-200/80 dark:border-stone-800/80 glass backdrop-blur-md">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" aria-hidden />
          <input
            type="search"
            name="route-search"
            placeholder="Buscar n° ruta, nombre, chofer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="w-full pl-8 pr-3 py-2 bg-white/70 dark:bg-stone-950/40 border border-stone-300/80 dark:border-stone-700/70 rounded-lg text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm backdrop-blur-md"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          icon={<SlidersHorizontal size={14} />}
          aria-expanded={showFilters}
          className={clsx(hasActiveFilters && 'border-primary-300 dark:border-primary-700')}
        >
          Filtros
          {hasActiveFilters ? (
            <span className="ml-1 size-1.5 rounded-full bg-primary-500" aria-hidden />
          ) : null}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={() => {
            void fetchRoutes();
            void fetchOrders();
          }}
        >
          Actualizar
        </Button>

        {filteredRoutes.length > 0 ? (
          <Button
            variant={bulkDeleteMode ? 'primary' : 'secondary'}
            size="sm"
            icon={<ListChecks size={14} />}
            onClick={() => {
              if (bulkDeleteMode) closeBulkDeleteMode();
              else setBulkDeleteMode(true);
            }}
            aria-pressed={bulkDeleteMode}
          >
            {bulkDeleteMode ? 'Cancelar selección' : 'Seleccionar'}
          </Button>
        ) : null}

        <div className="flex flex-col items-stretch sm:items-end gap-0.5">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={14} aria-hidden />}
            onClick={handleExportRoutes}
            disabled={filteredRoutes.length === 0}
            aria-describedby="routes-export-range-hint"
          >
            Exportar Excel
          </Button>
          <p
            id="routes-export-range-hint"
            className="hidden sm:block text-[10px] leading-snug text-stone-500 dark:text-stone-400 max-w-[11rem] text-right"
          >
            {exportRangeDescription.short}
          </p>
        </div>

        {/* Toggle de layout */}
        <div className="flex items-center rounded-lg border border-stone-300 dark:border-stone-600 overflow-hidden shrink-0" role="group" aria-label="Cambiar vista">
          <button
            type="button"
            onClick={() => { setLayout('cards'); localStorage.setItem(LAYOUT_KEY, 'cards'); }}
            aria-label="Vista tarjetas"
            aria-pressed={layout === 'cards'}
            className={clsx(
              'flex items-center justify-center px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
              layout === 'cards'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800',
            )}
          >
            <LayoutGrid size={14} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => { setLayout('table'); localStorage.setItem(LAYOUT_KEY, 'table'); }}
            aria-label="Vista tabla"
            aria-pressed={layout === 'table'}
            className={clsx(
              'flex items-center justify-center px-2.5 py-1.5 border-l border-stone-300 dark:border-stone-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
              layout === 'table'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800',
            )}
          >
            <LayoutList size={14} aria-hidden />
          </button>
        </div>

        <div className="flex-1" />

        <Button
          variant="secondary"
          size="sm"
          icon={<FileSpreadsheet size={14} />}
          onClick={() => setShowImportExcel(true)}
        >
          Importar Excel
        </Button>

        <Button size="sm" onClick={() => setShowNewRoute(true)} icon={<Plus size={14} />}>
          Nueva ruta
        </Button>
      </div>

      {showFilters ? (
        <div className="mx-6 rounded-xl glass backdrop-blur-md p-4 shadow-sm space-y-4 shrink-0">
          {/* Filtro por estado */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Estado de la ruta</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterRouteStatus('all')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                  filterRouteStatus === 'all'
                    ? 'bg-primary-50 dark:bg-primary-950/45 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800'
                    : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-300',
                )}
              >
                Todos
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200/80 dark:bg-stone-700 tabular-nums">
                  {routes.length}
                </span>
              </button>
              {ROUTE_STATUSES.map((s) => {
                const active = filterRouteStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterRouteStatus(active ? 'all' : s)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                      active
                        ? 'bg-primary-50 dark:bg-primary-950/45 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800'
                        : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-300',
                    )}
                  >
                    <span className={clsx('size-1.5 rounded-full', routeStatusDot[s])} aria-hidden />
                    {routeStatusLabel(s)}
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200/80 dark:bg-stone-700 tabular-nums">
                      {statusCounts[s] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro por cliente (cuenta mandante) */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Cuenta</p>
            <Select
              id="routes-filter-client"
              label="Cuenta mandante"
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              options={clientFilterOptions}
              autoComplete="off"
              containerClassName="max-w-md"
              hint={
                clientsWithRoutes.length === 0
                  ? 'No hay rutas asociadas a cuentas aún.'
                  : 'Incluye rutas con la cuenta asignada o pedidos de ese mandante.'
              }
            />
          </div>

          {/* Filtro por rango de fechas */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Período
              {filterDateRange === '30d' && (
                <span className="ml-1.5 normal-case font-normal text-stone-400">(por defecto)</span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Rango de fechas">
              {(
                [
                  { value: '7d', label: 'Últimos 7 días' },
                  { value: '30d', label: 'Últimos 30 días' },
                  { value: 'month', label: 'Mes en curso' },
                  { value: '90d', label: 'Últimos 90 días' },
                  { value: 'all', label: 'Todo el historial' },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilterDateRange(value)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                    filterDateRange === value
                      ? 'bg-primary-50 dark:bg-primary-950/45 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800'
                      : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-300',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-700/60 px-3 py-2">
              <span className="font-medium text-stone-700 dark:text-stone-300">Exportar Excel</span>
              {' '}usa el mismo período y filtros del listado. {exportFiltersDescription}
            </p>
          </div>

          <div className="flex justify-end border-t border-stone-100 dark:border-stone-800 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterRouteStatus('all');
                setFilterClientId('all');
                setFilterDateRange('30d');
                setShowFilters(false);
              }}
            >
              Restablecer filtros
            </Button>
          </div>
        </div>
      ) : null}

      {bulkDeleteMode && filteredRoutes.length > 0 ? (
        <div
          className="mx-6 rounded-xl border border-red-200/80 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/25 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0"
          role="region"
          aria-label="Eliminación en lote"
        >
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              Selección para eliminar
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-400 tabular-nums">
              {bulkDeleteSelectedIds.size} de {filteredRoutes.length} ruta
              {filteredRoutes.length === 1 ? '' : 's'} seleccionada
              {bulkDeleteSelectedIds.size === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={selectAllBulkDelete} disabled={bulkDeleteBusy}>
              Todas
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={selectNoneBulkDelete} disabled={bulkDeleteBusy}>
              Ninguna
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              disabled={bulkDeleteSelectedIds.size === 0 || bulkDeleteBusy}
              onClick={() => setBulkDeleteOpen(true)}
            >
              Eliminar {bulkDeleteSelectedIds.size > 0 ? `(${bulkDeleteSelectedIds.size})` : ''}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 min-h-0 min-w-0 relative overflow-hidden">
        {/* Listado centrado */}
        <div
          className={clsx(
            'flex flex-col min-w-0 flex-1',
            panelOpen && !detailPanelFullscreen && 'max-lg:hidden',
            panelFullscreenActive && 'hidden',
          )}
        >
          <div className="route-list-scroll flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y px-4 sm:px-6 lg:px-8 py-4">
            {routesLoading && routes.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400 py-12 text-center">Cargando rutas…</p>
            ) : filteredRoutes.length === 0 ? (
              <div className="max-w-lg mx-auto">
                <EmptyState
                  icon={<RouteIcon size={32} />}
                  title={routes.length === 0 ? 'Sin rutas' : 'Sin resultados'}
                  description={
                    routes.length === 0
                      ? 'Crea tu primera ruta con «Nueva ruta» y selecciónala para gestionar pedidos.'
                      : 'No hay rutas que coincidan con la búsqueda o los filtros.'
                  }
                />
              </div>
            ) : (
              <div className={clsx('w-full space-y-4', layout === 'cards' && 'max-w-lg mx-auto')}>
                {/* Barra de resumen + sort */}
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      <span className="font-semibold text-stone-700 dark:text-stone-200 tabular-nums">
                        {filteredRoutes.length}
                      </span>{' '}
                      de{' '}
                      <span className="tabular-nums">{routes.length}</span> rutas ·{' '}
                      <span className="tabular-nums">{totalBultos}</span> bultos
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowFilters(true)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                      aria-label="Cambiar período de fecha"
                    >
                      {filterDateRange === '7d' && '7 días'}
                      {filterDateRange === '30d' && '30 días'}
                      {filterDateRange === 'month' && 'Mes en curso'}
                      {filterDateRange === '90d' && '90 días'}
                      {filterDateRange === 'all' && 'Todo el historial'}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wide hidden sm:inline">
                      Ordenar
                    </span>
                    <select
                      value={sortCol ?? ''}
                      onChange={(e) => {
                        const v = e.target.value as RouteSortKey | '';
                        if (!v) { setSortCol(null); setSortDir(null); }
                        else { setSortCol(v); setSortDir('desc'); }
                      }}
                      className="text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-2 py-1 text-stone-700 dark:text-stone-200"
                      aria-label="Ordenar rutas"
                    >
                      <option value="createdAt">Fecha creación</option>
                      <option value="code">N° Ruta</option>
                      <option value="fecha">Fecha planificación</option>
                      <option value="pedidos">Pedidos</option>
                      <option value="status">Estado</option>
                    </select>
                  </div>
                </div>

                {/* ── Vista tarjetas ── */}
                {layout === 'cards' && (
                  <ul className="space-y-2" role="list">
                    {filteredRoutes.map((r) => {
                      const agg = routeAggById.get(r.id) ?? { pedidos: 0, bultos: 0, delivered: 0, rejected: 0, vehiclesLabel: '', driversLabel: '' };
                      return (
                        <li key={r.id}>
                          <RouteListItem
                            route={r}
                            agg={agg}
                            fecha={formatRouteDay(routeDateKey(r))}
                            selected={selectedRoute?.id === r.id}
                            onSelect={() => setSelectedRoute(r)}
                            bulkMode={bulkDeleteMode}
                            bulkChecked={bulkDeleteSelectedIds.has(r.id)}
                            onBulkToggle={() => toggleBulkDeleteRoute(r.id)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* ── Vista tabla ── */}
                {layout === 'table' && (
                  <div className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[880px] text-left table-fixed">
                        <colgroup>
                          <col className="w-[7.5rem]" />
                          <col className="w-auto" />
                          <col className="w-[7.5rem]" />
                          <col className="w-[6.5rem]" />
                          <col className="w-[4.5rem]" />
                          <col className="w-[4.5rem]" />
                          <col className="w-[6.5rem]" />
                          <col className="w-[8rem]" />
                        </colgroup>
                        <thead className="bg-stone-50 dark:bg-stone-800/70 border-b border-stone-200 dark:border-stone-700">
                          <tr>
                            {bulkDeleteMode ? (
                              <th scope="col" className="px-3 py-2.5 w-10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allSelected = filteredRoutes.every((r) => bulkDeleteSelectedIds.has(r.id));
                                    if (allSelected) selectNoneBulkDelete();
                                    else selectAllBulkDelete();
                                  }}
                                  className="p-0.5 rounded text-primary-600 dark:text-primary-400 hover:bg-stone-200/80 dark:hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                                  aria-label={
                                    filteredRoutes.every((r) => bulkDeleteSelectedIds.has(r.id))
                                      ? 'Deseleccionar todas las rutas visibles'
                                      : 'Seleccionar todas las rutas visibles'
                                  }
                                >
                                  {filteredRoutes.length > 0 && filteredRoutes.every((r) => bulkDeleteSelectedIds.has(r.id)) ? (
                                    <CheckSquare size={16} aria-hidden />
                                  ) : (
                                    <Square size={16} className="text-stone-400" aria-hidden />
                                  )}
                                </button>
                              </th>
                            ) : null}
                            {[
                              { label: 'N° Ruta', col: 'code' as RouteSortKey, align: 'left' as const },
                              { label: 'Nombre', col: 'name' as RouteSortKey, align: 'left' as const },
                              { label: 'Estado', col: 'status' as RouteSortKey, align: 'left' as const },
                              { label: 'Fecha', col: 'fecha' as RouteSortKey, align: 'left' as const },
                              { label: 'Pedidos', col: 'pedidos' as RouteSortKey, align: 'right' as const },
                              { label: 'Bultos', col: 'bultos' as RouteSortKey, align: 'right' as const },
                              { label: 'Vehículo', col: 'vehiclePlate' as RouteSortKey, align: 'left' as const },
                              { label: 'Chofer', col: 'driverName' as RouteSortKey, align: 'left' as const },
                            ].map(({ label, col, align }) => (
                              <th
                                key={label}
                                scope="col"
                                onClick={col ? () => {
                                  if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
                                  else { setSortCol(col); setSortDir('desc'); }
                                } : undefined}
                                className={clsx(
                                  'px-4 py-2.5 text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide whitespace-nowrap',
                                  col && 'cursor-pointer hover:text-stone-700 dark:hover:text-stone-200 select-none',
                                  align === 'right' ? 'text-right' : 'text-left',
                                )}
                              >
                                <span className="inline-flex items-center gap-1">
                                  {label}
                                  {col && sortCol === col && (
                                    sortDir === 'asc' ? <ChevronUp size={11} aria-hidden /> : <ChevronDown size={11} aria-hidden />
                                  )}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-stone-900">
                          {filteredRoutes.map((r) => {
                            const agg = routeAggById.get(r.id) ?? { pedidos: 0, bultos: 0, delivered: 0, rejected: 0, vehiclesLabel: '', driversLabel: '' };
                            return (
                              <RouteTableRow
                                key={r.id}
                                route={r}
                                agg={agg}
                                fecha={formatRouteDay(routeDateKey(r))}
                                selected={selectedRoute?.id === r.id}
                                onSelect={() => setSelectedRoute(r)}
                                bulkMode={bulkDeleteMode}
                                bulkChecked={bulkDeleteSelectedIds.has(r.id)}
                                onBulkToggle={() => toggleBulkDeleteRoute(r.id)}
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Handle de resize (solo desktop, no en pantalla completa) */}
        {!panelFullscreenActive ? (
          <PanelResizeHandle onResize={handlePanelResize} />
        ) : null}

        {/* Columna derecha: misma caja en vacío o con detalle; scroll solo dentro del panel */}
        <div
          style={panelFullscreenActive ? undefined : { width: detailPanelWidth }}
          className={clsx(
            'flex flex-col min-h-0 max-h-full shrink-0 overflow-hidden',
            panelFullscreenActive
              ? 'absolute inset-0 z-20 h-full w-full max-w-none bg-white/95 dark:bg-stone-950/95 backdrop-blur-md'
              : selectedRoute
                ? [
                    'w-full max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:h-dvh max-lg:max-h-dvh',
                    'lg:h-full lg:relative',
                    'lg:border-l lg:border-stone-200/70 dark:lg:border-stone-800/70',
                    'lg:bg-white/35 dark:lg:bg-stone-950/25 backdrop-blur-md',
                  ]
                : [
                    'hidden lg:flex lg:h-full',
                    'lg:border-l lg:border-dashed lg:border-stone-200/70 dark:lg:border-stone-800/70',
                    'lg:bg-white/20 dark:lg:bg-stone-950/10 backdrop-blur-md',
                  ],
          )}
        >
          {selectedRoute ? (
            <div
              key={selectedRoute.id}
              className="flex flex-col h-full min-h-0 w-full min-w-0 max-lg:animate-route-panel-enter-mobile lg:animate-route-panel-enter motion-reduce:animate-none"
            >
              <RouteDetailSidePanel
                route={selectedRoute}
                onClose={closeDetailPanel}
                fullscreen={detailPanelFullscreen}
                onToggleFullscreen={() => setDetailPanelFullscreen((v) => !v)}
              />
            </div>
          ) : (
            <RouteDetailPlaceholder />
          )}
        </div>
      </div>

      <ImportExcelModal
        open={showImportExcel}
        onClose={() => setShowImportExcel(false)}
        onImported={() => {
          void fetchRoutes();
          void fetchOrders();
        }}
      />

      <Modal
        open={showNewRoute}
        onClose={() => {
          setNewRouteError(null);
          setShowNewRoute(false);
        }}
        title="Crear nueva ruta"
        size="md"
      >
        <RouteForm
          suggestedSequence={suggestNextRouteSequence(routes)}
          onSubmit={handleAddRoute}
          onCancel={() => {
            setNewRouteError(null);
            setShowNewRoute(false);
          }}
          submitLabel="Crear ruta"
          error={newRouteError}
        />
      </Modal>

      <TypeToConfirmModal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={bulkDeleteTargets.length === 1 ? 'Eliminar ruta' : 'Eliminar rutas en lote'}
        loading={bulkDeleteBusy}
        confirmLabel={bulkDeleteTargets.length === 1 ? 'Eliminar ruta' : `Eliminar ${bulkDeleteTargets.length} rutas`}
        message={
          <>
            <p>
              Se eliminarán{' '}
              <strong className="tabular-nums">{bulkDeleteTargets.length}</strong>{' '}
              ruta{bulkDeleteTargets.length === 1 ? '' : 's'} y todos sus pedidos asociados.
            </p>
            {bulkDeleteOrderCount > 0 ? (
              <p className="mt-2">
                {bulkDeleteOrderCount} pedido{bulkDeleteOrderCount === 1 ? '' : 's'} serán eliminados permanentemente.
              </p>
            ) : (
              <p className="mt-2">Las rutas seleccionadas no tienen pedidos.</p>
            )}
            {bulkDeleteTargets.length <= 5 ? (
              <ul className="mt-3 space-y-1 text-xs font-mono text-stone-600 dark:text-stone-400">
                {bulkDeleteTargets.map((r) => (
                  <li key={r.id} translate="no">
                    N° {formatRouteDisplayLabel(r)}
                    {r.name ? ` — ${r.name}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                Incluye{' '}
                {bulkDeleteTargets.slice(0, 3).map((r) => `N° ${formatRouteDisplayLabel(r)}`).join(', ')}
                {' '}y {bulkDeleteTargets.length - 3} más…
              </p>
            )}
          </>
        }
      />

    </div>
  );
}
