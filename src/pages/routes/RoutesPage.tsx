import { useEffect, useState, useMemo, useRef, useCallback, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import {
  Plus, Search, ChevronUp, ChevronDown,
  Download, RefreshCw, SlidersHorizontal, Package, UserCircle, Route as RouteIcon, Truck,
  Pencil, Trash2, X, Copy, MapPin, Box, ArrowLeft, Check, FileSpreadsheet, Unlink,
  CheckCircle2, XCircle, AlertCircle, Eye, LayoutGrid, LayoutList, Share2,
  CheckSquare, Square, ListChecks, Maximize2, Minimize2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { OrderStatusBadge, RouteStatusBadge } from '../../components/ui/Badge';
import { ConfirmModal, Modal, TypeToConfirmModal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRouteStore } from '../../store/useRouteStore';
import type { Route, RouteStatus, Order } from '../../types';
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
import { SendTrackingModal } from '../../components/communications/SendTrackingModal';

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

// ─── Import Excel Modal ───────────────────────────────────────────────────────

function ImportExcelModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const { fetchPreview, confirmImport, preview, previewLoading, previewError, confirmLoading, confirmError, lastResult, reset } =
    useRouteImportStore();
  const { clients, fetchClients } = useClientStore();
  const { users, fetchUsers } = useUserStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { updateOrder, fetchOrders } = useOrderStore();
  const { fetchRoutes } = useRouteStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [routeName, setRouteName] = useState('');
  const [routeDate, setRouteDate] = useState('');
  const [showAllRows, setShowAllRows] = useState(false);
  const [accountClientId, setAccountClientId] = useState('');
  const [rowDriverId, setRowDriverId] = useState<Record<number, string>>({});
  const [rowVehicleId, setRowVehicleId] = useState<Record<number, string>>({});
  const [assignRules, setAssignRules] = useState<
    Array<{
      id: string;
      from: string;
      to: string;
      driverId: string;
      vehicleId: string;
    }>
  >([]);
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignProgress, setAssignProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    void fetchClients();
    void fetchUsers();
    void fetchVehicles();
  }, [open, fetchClients]);

  const handleClose = useCallback(() => {
    reset();
    setFile(null);
    setStep('upload');
    setRouteName('');
    setRouteDate('');
    setShowAllRows(false);
    setAccountClientId('');
    setRowDriverId({});
    setRowVehicleId({});
    setAssignRules([]);
    setAssignBusy(false);
    setAssignProgress(null);
    onClose();
  }, [reset, onClose]);

  const filenameBase = (name: string) => name.replace(/\.(xlsx|xls)$/i, '').trim();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setStep('upload');
    setShowAllRows(false);
    const p = await fetchPreview(f);
    if (p) {
      setRouteName(filenameBase(f.name));
      setRouteDate(p.route_date ?? '');
      setStep('preview');
      if (p.rows.length === 0) {
        toast.warning('Sin pedidos detectados', 'El Excel no contiene filas de datos válidas. Verifica el formato.');
      } else {
        toast.info(`Preview lista · ${p.rows.length} pedidos`, `Ruta N° ${p.route_number} · ${p.transport_company || 'sin empresa'}`);
      }
    } else {
      const err = useRouteImportStore.getState().previewError;
      if (err) toast.error('Error al leer el Excel', err);
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    const res = await confirmImport(file, {
      routeName: routeName.trim() || undefined,
      routeDate: routeDate || undefined,
      driverNameHint: preview?.driver_name_hint || undefined,
      clientId: accountClientId.trim() || undefined,
    });
    if (!res) {
      const err = useRouteImportStore.getState().confirmError;
      if (err) toast.error('Error al importar', err);
      return;
    }

    if (res) {
      setStep('done');
      onImported();

      // Notificación de éxito
      toast.info(
        `Ruta ${res.route_code} importada`,
        `${res.orders_created} pedido${res.orders_created !== 1 ? 's' : ''} creados · cuenta: ${res.client_name || 'Sin asignar'}`,
      );

      // Advertencia si faltan destinatarios en el Excel
      const rowsWithoutClient = (preview?.rows ?? []).filter((r) => !r.client_name.trim());
      if (rowsWithoutClient.length > 0) {
        toast.warning(
        'Pedidos sin destinatario identificado',
        `${rowsWithoutClient.length} fila${rowsWithoutClient.length !== 1 ? 's' : ''} no tenían destinatario en el Excel. Se asignó el destinatario principal de la ruta.`,
        );
      }

      // Aplicar asignación por pedido (chofer + vehículo) si se configuró en el modal.
      const totalToAssign =
        Object.keys(rowDriverId).length + Object.keys(rowVehicleId).length;
      if (totalToAssign > 0) {
        setAssignBusy(true);
        try {
          const createdOrders = await api.get<Record<string, unknown>[]>(
            `/routes/${res.route_id}/orders`,
          );
          const byCode = new Map(
            (Array.isArray(createdOrders) ? createdOrders : []).map((o) => [
              String(o.code ?? ''),
              { id: String(o.id ?? '') },
            ]),
          );

          const driverById = new Map(
            users
              .filter((u) => u.role === 'driver')
              .map((u) => [u.id, u.name]),
          );
          const vehicleById = new Map(
            vehicles.map((v) => [v.id, v.plate]),
          );

          const total = previewRows.length;
          setAssignProgress({ done: 0, total });

          for (let i = 0; i < previewRows.length; i++) {
            const orderCode = `${res.route_code}-${String(i + 1).padStart(3, '0')}`;
            const orderId = byCode.get(orderCode)?.id;
            if (!orderId) continue;

            const dId = rowDriverId[i];
            const vId = rowVehicleId[i];
            if (!dId && !vId) {
              setAssignProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
              continue;
            }

            await updateOrder(orderId, {
              ...(dId
                ? { driverId: dId, driverName: driverById.get(dId) ?? null }
                : {}),
              ...(vId
                ? { vehicleId: vId, vehiclePlate: vehicleById.get(vId) ?? null }
                : {}),
            });
            setAssignProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
          }

          await fetchOrders();
          await fetchRoutes();
          toast.info('Asignación aplicada', 'Se guardaron las asignaciones de chofer y vehículo.');
        } catch {
          toast.error('Asignación incompleta', 'La ruta se importó, pero no se pudieron aplicar todas las asignaciones.');
        } finally {
          setAssignBusy(false);
          setAssignProgress(null);
        }
      }
    }
  };

  const previewRows = preview?.rows ?? [];
  const visibleRows = showAllRows ? previewRows : previewRows.slice(0, 8);
  const drivers = useMemo(
    () =>
      users
        .filter((u) => u.role === 'driver' && u.active)
        .toSorted((a, b) => a.name.localeCompare(b.name, 'es')),
    [users],
  );
  const vehiclesSorted = useMemo(
    () => vehicles.toSorted((a, b) => a.plate.localeCompare(b.plate, 'es')),
    [vehicles],
  );

  const applyRules = useCallback(() => {
    const total = previewRows.length;
    if (total === 0) return;
    const nextDriver: Record<number, string> = {};
    const nextVehicle: Record<number, string> = {};

    for (const r of assignRules) {
      const from = Math.max(1, Math.floor(Number(r.from.trim()) || 1));
      const to = Math.min(total, Math.floor(Number(r.to.trim()) || total));
      if (to < from) continue;
      for (let idx1 = from; idx1 <= to; idx1++) {
        const i = idx1 - 1; // 0-based
        if (r.driverId) nextDriver[i] = r.driverId;
        if (r.vehicleId) nextVehicle[i] = r.vehicleId;
      }
    }

    setRowDriverId(nextDriver);
    setRowVehicleId(nextVehicle);
  }, [assignRules, previewRows.length]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleClose} title="Importar desde Excel" size="2xl">
      <div className="space-y-5">
        {/* Step: upload */}
        {step !== 'done' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={handleFileChange}
              aria-label="Seleccionar archivo Excel"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                'w-full rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-2 transition-colors text-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                previewLoading
                  ? 'opacity-60 cursor-wait border-stone-300 dark:border-stone-700'
                  : file
                    ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/30'
                    : 'border-stone-300 hover:border-primary-400 hover:bg-primary-50/40 dark:border-stone-600 dark:hover:border-primary-600',
              )}
            >
              <FileSpreadsheet
                size={28}
                className={file ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}
                aria-hidden
              />
              {previewLoading ? (
                <p className="text-sm text-stone-500">Leyendo archivo…</p>
              ) : file ? (
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate max-w-xs">
                  {file.name}
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                    Haz clic para seleccionar el Excel
                  </p>
                  <p className="text-xs text-stone-400">.xlsx · máx. 10 MB</p>
                </>
              )}
            </button>
          </div>
        )}

        {previewError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2.5" role="alert">
            <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden />
            <p className="text-xs text-red-700 dark:text-red-300">{previewError}</p>
          </div>
        )}
        {confirmError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2.5" role="alert">
            <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden />
            <p className="text-xs text-red-700 dark:text-red-300">{confirmError}</p>
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && lastResult && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5 space-y-3 text-center">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                ¡Ruta importada correctamente!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                <span translate="no" className="font-mono font-bold">{lastResult.route_code}</span>
                {' '}· {lastResult.orders_created} pedidos creados · cuenta: {lastResult.client_name}
              </p>
            </div>
            <Button onClick={handleClose}>Cerrar</Button>
          </div>
        )}

        {/* Step: preview */}
        {step === 'preview' && preview && (
          <>
            {/* Metadata del Excel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'N° de ruta', value: String(preview.route_number) },
                { label: 'Empresa', value: preview.transport_company || '—' },
                { label: 'Flete', value: preview.flete_type || '—' },
                { label: 'Total bultos', value: String(preview.total_bultos_declared) },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2">
                  <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate" translate="no">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Opciones de la ruta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Select
                  label="Cuenta (Mandante)"
                  value={accountClientId}
                  onChange={(e) => setAccountClientId(e.target.value)}
                  options={[
                    { value: '', label: 'Sin cuenta (asignar después)…' },
                    ...clients
                      .filter((c) => c.active)
                      .toSorted((a, b) => a.companyName.localeCompare(b.companyName, 'es'))
                      .map((c) => ({ value: c.id, label: c.companyName })),
                  ]}
                  autoComplete="off"
                  hint="Opcional. Si no seleccionas una cuenta, la ruta quedará sin cuenta y podrás asignarla después."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Nombre de la ruta
                </label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder={`Ruta ${preview.route_number} · ${preview.rows[0]?.client_name ?? '…'}`}
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Fecha de la ruta
                </label>
                <input
                  type="date"
                  value={routeDate}
                  onChange={(e) => setRouteDate(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
              </div>
            </div>

            {/* Constructor de reglas de asignación */}
            <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-900/40 overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 px-3 pt-2.5 pb-2 border-b border-stone-100 dark:border-stone-800">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-200 uppercase tracking-wide leading-none">
                    Asignación por rangos
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 leading-snug">
                    Ej: filas 1–10 → chofer A · 11–24 → chofer B. Si se solapan, gana la última.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  <button
                    type="button"
                    disabled={previewRows.length === 0}
                    title="Crear una regla que cubre todos los pedidos"
                    onClick={() => {
                      if (previewRows.length === 0) return;
                      setAssignRules([
                        {
                          id: `all-${Date.now()}`,
                          from: '1',
                          to: String(previewRows.length),
                          driverId: '',
                          vehicleId: '',
                        },
                      ]);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
                  >
                    <ListChecks size={13} aria-hidden />
                    Todos
                  </button>
                  <button
                    type="button"
                    disabled={previewRows.length === 0}
                    onClick={() => {
                      const total = previewRows.length || 1;
                      setAssignRules((prev) => [
                        ...prev,
                        {
                          id: `r-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                          from: '1',
                          to: String(total),
                          driverId: '',
                          vehicleId: '',
                        },
                      ]);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
                  >
                    <Plus size={13} aria-hidden />
                    Agregar
                  </button>
                </div>
              </div>

              {/* Lista de reglas / empty state */}
              {assignRules.length === 0 ? (
                <div className="px-3 py-5 text-center">
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    Sin reglas aún — pulsa <span className="font-medium text-stone-500 dark:text-stone-400">&ldquo;Agregar&rdquo;</span> o <span className="font-medium text-stone-500 dark:text-stone-400">&ldquo;Todos&rdquo;</span> para empezar.
                  </p>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-1.5">
                  {assignRules.map((r, rIdx) => (
                    <div
                      key={r.id}
                      className="flex items-end gap-2 bg-stone-50/80 dark:bg-stone-800/50 rounded-lg px-2 pt-2 pb-1.5"
                    >
                      <span className="shrink-0 mb-[18px] size-5 flex items-center justify-center rounded-full bg-stone-200 dark:bg-stone-700 text-[10px] font-bold text-stone-600 dark:text-stone-300 tabular-nums">
                        {rIdx + 1}
                      </span>
                      <div className="w-[60px] shrink-0">
                        <Input
                          label="Desde"
                          value={r.from}
                          onChange={(e) =>
                            setAssignRules((prev) =>
                              prev.map((x) => (x.id === r.id ? { ...x, from: e.target.value } : x)),
                            )
                          }
                          name={`rule-from-${r.id}`}
                          autoComplete="off"
                        />
                      </div>
                      <span className="text-stone-400 dark:text-stone-500 text-sm mb-[18px]">–</span>
                      <div className="w-[60px] shrink-0">
                        <Input
                          label="Hasta"
                          value={r.to}
                          onChange={(e) =>
                            setAssignRules((prev) =>
                              prev.map((x) => (x.id === r.id ? { ...x, to: e.target.value } : x)),
                            )
                          }
                          name={`rule-to-${r.id}`}
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Select
                          label="Chofer"
                          value={r.driverId}
                          onChange={(e) =>
                            setAssignRules((prev) =>
                              prev.map((x) => (x.id === r.id ? { ...x, driverId: e.target.value } : x)),
                            )
                          }
                          options={[
                            { value: '', label: 'Sin chofer' },
                            ...drivers.map((d) => ({ value: d.id, label: d.name })),
                          ]}
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Select
                          label="Vehículo"
                          value={r.vehicleId}
                          onChange={(e) =>
                            setAssignRules((prev) =>
                              prev.map((x) => (x.id === r.id ? { ...x, vehicleId: e.target.value } : x)),
                            )
                          }
                          options={[
                            { value: '', label: 'Sin vehículo' },
                            ...vehiclesSorted.map((v) => ({
                              value: v.id,
                              label: `${v.plate} · ${v.brand} ${v.model}`,
                            })),
                          ]}
                          autoComplete="off"
                        />
                      </div>
                      <button
                        type="button"
                        className="shrink-0 mb-[18px] p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
                        aria-label="Eliminar regla"
                        onClick={() => setAssignRules((prev) => prev.filter((x) => x.id !== r.id))}
                      >
                        <X size={14} aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {assignRules.length > 0 && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    className="text-xs text-stone-400 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded transition-colors"
                    onClick={() => {
                      setRowDriverId({});
                      setRowVehicleId({});
                      setAssignRules([]);
                    }}
                  >
                    Limpiar todo
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={applyRules}
                    disabled={previewRows.length === 0 || assignRules.length === 0}
                  >
                    Aplicar reglas
                  </Button>
                </div>
              )}
            </div>

            {preview.driver_name_hint && (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                <span className="font-medium">Chofer en el Excel:</span>{' '}
                <span translate="no">{preview.driver_name_hint}</span>
                {' '}(solo referencia, asígnalo desde el panel de pedidos)
              </p>
            )}

            {/* Tabla de pedidos a crear */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wide">
                  {previewRows.length} pedidos a crear
                </p>
                {previewRows.length > 8 && (
                  <button
                    type="button"
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline focus-visible:outline-none"
                    onClick={() => setShowAllRows((v) => !v)}
                  >
                    <Eye size={12} className="inline mr-1" aria-hidden />
                    {showAllRows ? 'Mostrar menos' : `Ver todos (${previewRows.length})`}
                  </button>
                )}
              </div>
              <div className="rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-stone-50 dark:bg-stone-800/70 border-b border-stone-200 dark:border-stone-700">
                        {['Destinatario', 'Entrega', 'Chofer', 'Vehículo', 'OC', 'Factura', 'Tipo', 'Cajas', 'Unids'].map((h) => (
                          <th key={h} className="text-left px-3 py-2 font-semibold text-stone-600 dark:text-stone-300 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {visibleRows.map((row, i) => (
                        <tr key={i} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                          <td className="px-3 py-2 font-medium text-stone-800 dark:text-stone-200 whitespace-nowrap">{row.client_name}</td>
                          <td className="px-3 py-2 text-stone-600 dark:text-stone-400 max-w-[180px] truncate">{row.entrega}</td>
                          <td className="px-3 py-2">
                            <select
                              className="w-44 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-1 text-xs text-stone-700 dark:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                              value={rowDriverId[i] ?? ''}
                              onChange={(e) =>
                                setRowDriverId((p) => ({ ...p, [i]: e.target.value }))
                              }
                            >
                              <option value="">Sin chofer…</option>
                              {drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              className="w-52 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-1 text-xs text-stone-700 dark:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                              value={rowVehicleId[i] ?? ''}
                              onChange={(e) =>
                                setRowVehicleId((p) => ({ ...p, [i]: e.target.value }))
                              }
                            >
                              <option value="">Sin vehículo…</option>
                              {vehiclesSorted.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.plate} · {v.brand} {v.model}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-stone-500 dark:text-stone-500 whitespace-nowrap font-mono">{row.numero_oc || '—'}</td>
                          <td className="px-3 py-2 text-stone-500 dark:text-stone-500 whitespace-nowrap font-mono">{row.factura || '—'}</td>
                          <td className="px-3 py-2 text-stone-500 dark:text-stone-500">{row.tipo || '—'}</td>
                          <td className="px-3 py-2 text-stone-700 dark:text-stone-300 tabular-nums text-right">{row.cajas}</td>
                          <td className="px-3 py-2 text-stone-700 dark:text-stone-300 tabular-nums text-right">{row.unidades}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <Button variant="ghost" onClick={handleClose} disabled={confirmLoading}>
                Cancelar
              </Button>
              <Button
                onClick={() => void handleConfirm()}
                loading={confirmLoading}
                icon={<FileSpreadsheet size={15} />}
                disabled={assignBusy}
              >
                Crear ruta y {previewRows.length} pedidos
              </Button>
            </div>
            {assignProgress ? (
              <p className="text-xs text-stone-500 dark:text-stone-400 text-right tabular-nums">
                Aplicando asignaciones… {assignProgress.done}/{assignProgress.total}
              </p>
            ) : null}
          </>
        )}
      </div>
    </Modal>
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
}: {
  route: Route;
  agg: { pedidos: number; bultos: number; delivered: number; vehiclesLabel: string };
  fecha: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const deliveryPct =
    agg.pedidos > 0 ? Math.round((agg.delivered / agg.pedidos) * 100) : 0;
  const hasDeliveries = agg.delivered > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'w-full text-left rounded-xl px-4 py-3.5 transition-colors glass shadow-sm',
        'hover:bg-white/90 dark:hover:bg-stone-900/90 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950',
        selected
          ? 'border-primary-400/80 dark:border-primary-500/70 ring-2 ring-primary-400/20 dark:ring-primary-500/25 shadow-md'
          : 'border-stone-200/80 dark:border-stone-700/70',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            'size-11 shrink-0 rounded-xl flex items-center justify-center',
            selected ? 'bg-primary-50/90 dark:bg-primary-950/40' : 'bg-stone-100/70 dark:bg-stone-800/60',
          )}
          aria-hidden
        >
          <RouteIcon
            size={20}
            className={selected ? 'text-primary-600 dark:text-primary-400' : 'text-stone-500 dark:text-stone-400'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate">
            {route.name}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
            <span translate="no" className="font-mono font-semibold">
              {route.code}
            </span>
            <RouteStatusBadge status={route.status} />
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
              aria-label={`${agg.delivered} de ${agg.pedidos} pedidos entregados`}
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${deliveryPct}%` }}
              />
            </div>
          ) : null}
        </div>
        <ChevronDown
          size={18}
          className={clsx(
            'shrink-0 text-stone-300 dark:text-stone-600 transition-transform duration-200',
            selected && 'rotate-180 text-primary-600 dark:text-primary-400',
          )}
          aria-hidden
        />
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
}: {
  route: Route;
  agg: { pedidos: number; bultos: number; delivered: number; vehiclesLabel: string; driversLabel: string };
  fecha: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      onClick={onSelect}
      className={clsx(
        'cursor-pointer transition-colors border-b border-stone-100 dark:border-stone-800',
        selected
          ? 'bg-primary-50/80 dark:bg-primary-950/25 shadow-[inset_3px_0_0_0] shadow-primary-500 dark:shadow-primary-400'
          : 'hover:bg-stone-50 dark:hover:bg-stone-800/50',
      )}
    >
      <td className="px-4 py-2.5 align-middle">
        <span
          translate="no"
          className={clsx(
            'font-mono text-xs font-semibold tabular-nums block truncate',
            selected ? 'text-primary-700 dark:text-primary-300' : 'text-stone-600 dark:text-stone-400',
          )}
        >
          {route.code}
        </span>
      </td>
      <td className="px-4 py-2.5 align-middle min-w-0">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{route.name}</p>
      </td>
      <td className="px-4 py-2.5 align-middle whitespace-nowrap">
        <RouteStatusBadge status={route.status} />
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
    destStreet: order.destination.street,
    destCity: order.destination.city,
    destRegion: order.destination.region || 'Metropolitana',
    estimatedDelivery: order.estimatedDelivery,
    notes: order.notes ?? '',
    bultos: order.bultos,
    dispatchGuideUrl: order.dispatchGuideUrl ?? '',
  };
}

type SortDir = 'asc' | 'desc' | null;
type RouteSortKey = 'code' | 'name' | 'status' | 'pedidos' | 'bultos' | 'fecha' | 'driverName' | 'vehiclePlate';

const ROUTE_STATUSES: RouteStatus[] = ['not_started', 'in_progress', 'completed', 'cancelled'];

const routeStatusDot: Record<RouteStatus, string> = {
  not_started: 'bg-stone-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};

// ─── Route Form (create/edit) ─────────────────────────────────────────────────
interface RouteFormData {
  code: string;
  name: string;
  notes: string;
  clientId: string;
}

function RouteForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  error,
}: {
  initial?: Partial<RouteFormData>;
  onSubmit: (data: RouteFormData) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  error?: string | null;
}) {
  const { clients, fetchClients } = useClientStore();
  const [form, setForm] = useState<RouteFormData>({
    code: '',
    name: '',
    notes: '',
    clientId: '',
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const f = (field: keyof RouteFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const clientOptions = [
    { value: '', label: 'Sin cuenta (se asigna al primer pedido)…' },
    ...clients
      .filter((c) => c.active)
      .toSorted((a, b) => a.companyName.localeCompare(b.companyName, 'es'))
      .map((c) => ({ value: c.id, label: c.companyName })),
  ];

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        code: form.code.trim(),
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
        label="Nombre de la ruta"
        placeholder="Ej: Santiago Norte"
        value={form.name}
        onChange={f('name')}
        name="route_name"
      />
      <Input
        label="Código / folio interno"
        placeholder="Opcional — se genera automáticamente si lo dejás vacío"
        value={form.code}
        onChange={f('code')}
        name="route_code"
        autoComplete="off"
        spellCheck={false}
        hint="Folio de uso interno. No es necesario completarlo."
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
        <Button type="button" onClick={() => void handleSubmit()} loading={saving} disabled={!form.name.trim()}>
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
  const { user } = useAuthStore();
  const canManage = user?.role === 'admin' || user?.role === 'operator';
  const { orders, assignToRoute, detachOrderFromRoute, fetchOrders, addOrder, updateOrder } = useOrderStore();
  const { fetchRoutes, addOrderToRoute, assignDriverToOrders, deleteRoute, updateRoute } = useRouteStore();
  const { clients, fetchClients } = useClientStore();
  const { users, fetchUsers } = useUserStore();
  const { vehicles, fetchVehicles } = useVehicleStore();

  useEffect(() => {
    void fetchClients();
    void fetchUsers();
    void fetchVehicles();
  }, [fetchClients, fetchUsers, fetchVehicles]);

  const [pickOrderId, setPickOrderId] = useState('');
  const [orphanSearch, setOrphanSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
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
    bulkOrderIds?: string[];
  } | null>(null);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDraftDriver, setBulkDraftDriver] = useState('');
  const [bulkDraftPeoneta, setBulkDraftPeoneta] = useState('');
  const [bulkDraftVehicle, setBulkDraftVehicle] = useState('');
  const [bulkAssignBusy, setBulkAssignBusy] = useState(false);

  const assigned = useMemo(
    () =>
      orders
        .filter((o) => o.routeId === route.id)
        .toSorted((a, b) => a.code.localeCompare(b.code, 'es')),
    [orders, route.id],
  );

  const orphanOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          !o.routeId &&
          o.status !== 'delivered' &&
          o.status !== 'cancelled',
      ),
    [orders],
  );

  const filteredOrphans = useMemo(() => {
    const term = orphanSearch.trim().toLowerCase();
    if (!term) return orphanOrders;
    return orphanOrders.filter((o) => {
      const hay = [
        o.code,
        o.clientName,
        o.destination.city,
        o.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }, [orphanOrders, orphanSearch]);

  const totals = useMemo(() => {
    const bultos = assigned.reduce((s, o) => s + (Number(o.bultos) || 0), 0);
    return { pedidos: assigned.length, bultos };
  }, [assigned]);

  const orphanOptions = useMemo(() => {
    const opts = filteredOrphans.toSorted((a, b) => a.code.localeCompare(b.code, 'es'));
    return [
      { value: '', label: 'Seleccionar pedido sin ruta…' },
      ...opts.map((o) => ({
        value: o.id,
        label: `${o.code} · ${o.destination.city} · ${o.bultos} bultos · ${o.clientName?.trim() || 'Destinatario por confirmar'}`,
      })),
    ];
  }, [filteredOrphans]);

  const driversList = useMemo(
    () =>
      users
        .filter((u) => u.role === 'driver' && u.active)
        .toSorted((a, b) => a.name.localeCompare(b.name, 'es')),
    [users],
  );

  const peonetasList = useMemo(
    () =>
      users
        .filter((u) => u.role === 'peoneta' && u.active)
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

  const handleAttachOrphan = async () => {
    if (!pickOrderId) return;
    setActionError(null);
    setBusyId('add');
    try {
      await assignToRoute(pickOrderId, route.id);
      addOrderToRoute(route.id, pickOrderId);
      setPickOrderId('');
      await fetchOrders();
      await fetchRoutes();
    } catch {
      setActionError('No se pudo vincular el pedido. Revisa permisos y conexión.');
    } finally {
      setBusyId(null);
    }
  };

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
        origin: { street: '', city: '', region: '' },
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
        ...(data.dispatchGuideUrl.trim()
          ? { dispatchGuideUrl: data.dispatchGuideUrl.trim() }
          : {}),
      });
      if (!created) {
        setActionError('No se pudo crear el pedido. Revisa la conexión con el servidor.');
        return;
      }
      addOrderToRoute(route.id, created.id);
      setShowCreateForm(false);
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

  const handleOpenOrderAssign = (o: Order) => {
    if (bulkAssignOpen) closeBulkAssign();
    setEditingOrderId(null);
    setExpandedOrderId(o.id);
    setOrderDraftDriver(o.driverId ?? '');
    setOrderDraftPeoneta(o.peonetaId ?? '');
    setOrderDraftVehicle(o.vehicleId ?? '');
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
        destination: {
          street: data.destStreet,
          city: data.destCity,
          region: data.destRegion,
        },
        estimatedDelivery: data.estimatedDelivery,
        notes: data.notes,
        bultos: data.bultos,
        dispatchGuideUrl: data.dispatchGuideUrl,
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

  const closeBulkAssign = () => {
    setBulkAssignOpen(false);
    setBulkSelectedIds(new Set());
    setBulkDraftDriver('');
    setBulkDraftPeoneta('');
    setBulkDraftVehicle('');
  };

  const openBulkAssign = () => {
    handleCancelOrderAssign();
    setEditingOrderId(null);
    setBulkAssignOpen(true);
    setBulkSelectedIds(new Set(assigned.map((o) => o.id)));
  };

  const toggleBulkOrder = (orderId: string) => {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const selectAllBulk = () => setBulkSelectedIds(new Set(assigned.map((o) => o.id)));
  const selectNoneBulk = () => setBulkSelectedIds(new Set());

  const performBulkAssignment = async (orderIds: string[]) => {
    setBulkAssignBusy(true);
    setActionError(null);
    try {
      const d = bulkDraftDriver ? driversList.find((u) => u.id === bulkDraftDriver) : null;
      const pe = bulkDraftPeoneta ? peonetasList.find((u) => u.id === bulkDraftPeoneta) : null;
      const v = bulkDraftVehicle ? vehiclesSorted.find((x) => x.id === bulkDraftVehicle) : null;

      await assignDriverToOrders(route.id, {
        driverId: d ? d.id : null,
        driverName: d ? d.name : null,
        peonetaId: pe ? pe.id : null,
        peonetaName: pe ? pe.name : null,
        vehicleId: v ? v.id : null,
        vehiclePlate: v ? v.plate : null,
        orderIds,
      });
      await fetchOrders();
      closeBulkAssign();
      toast.info(
        orderIds.length === assigned.length
          ? 'Asignación aplicada a toda la ruta'
          : `Asignación aplicada a ${orderIds.length} pedido${orderIds.length === 1 ? '' : 's'}`,
      );
    } catch {
      setActionError('No se pudo aplicar la asignación masiva.');
    } finally {
      setBulkAssignBusy(false);
    }
  };

  const handleBulkApplySelected = () => {
    const ids = [...bulkSelectedIds];
    if (ids.length === 0) {
      setActionError('Selecciona al menos un pedido.');
      return;
    }
    if (!bulkDraftDriver && !bulkDraftPeoneta && !bulkDraftVehicle) {
      setActionError('Elige chofer, peoneta o vehículo para aplicar.');
      return;
    }
    const v = bulkDraftVehicle ? vehiclesSorted.find((x) => x.id === bulkDraftVehicle) : null;
    if (v && ids.length > 1) {
      setSameVehicleConfirm({
        orderId: ids[0]!,
        plate: v.plate,
        otherCodes: assigned.filter((o) => ids.includes(o.id)).map((o) => o.code),
        bulk: true,
        bulkOrderIds: ids,
      });
      return;
    }
    void performBulkAssignment(ids);
  };

  const handleBulkApplyAllRoute = () => {
    if (!bulkDraftDriver && !bulkDraftPeoneta && !bulkDraftVehicle) {
      setActionError('Elige chofer, peoneta o vehículo para aplicar.');
      return;
    }
    const allIds = assigned.map((o) => o.id);
    const v = bulkDraftVehicle ? vehiclesSorted.find((x) => x.id === bulkDraftVehicle) : null;
    if (v && assigned.length > 1) {
      setSameVehicleConfirm({
        orderId: assigned[0]!.id,
        plate: v.plate,
        otherCodes: assigned.map((o) => o.code),
        bulk: true,
        bulkOrderIds: allIds,
      });
      return;
    }
    void performBulkAssignment(allIds);
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
    try {
      const d = orderDraftDriver ? driversList.find((u) => u.id === orderDraftDriver) : null;
      const pe = orderDraftPeoneta ? peonetasList.find((u) => u.id === orderDraftPeoneta) : null;
      const v = orderDraftVehicle ? vehiclesSorted.find((x) => x.id === orderDraftVehicle) : null;

      if (orderApplyToAll) {
        await assignDriverToOrders(route.id, {
          driverId: d ? d.id : null,
          driverName: d ? d.name : null,
          peonetaId: pe ? pe.id : null,
          peonetaName: pe ? pe.name : null,
          vehicleId: v ? v.id : null,
          vehiclePlate: v ? v.plate : null,
        });
      } else {
        await updateOrder(orderId, {
          driverId: d ? d.id : null,
          driverName: d ? d.name : null,
          peonetaId: pe ? pe.id : null,
          peonetaName: pe ? pe.name : null,
          vehicleId: v ? v.id : null,
          vehiclePlate: v ? v.plate : null,
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
    } catch {
      setActionError('No se pudo guardar la asignación del pedido.');
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
  const deliveryProgressPct =
    assigned.length > 0 ? Math.round((deliveredCount / assigned.length) * 100) : 0;

  const routeClientLabel = useMemo(() => {
    if (route.clientId) {
      const c = clients.find((x) => x.id === route.clientId);
      if (c?.companyName) return c.companyName;
    }
    return assigned[0]?.clientName?.trim() || '—';
  }, [route.clientId, clients, assigned]);

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
    try {
      await navigator.clipboard.writeText(route.code);
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
      await deleteRoute(route.id);
      await fetchOrders();
      await fetchRoutes();
      setDeleteRouteOpen(false);
      onClose();
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
      await updateRoute(route.id, {
        name: data.name.trim(),
        notes: data.notes.trim() || undefined,
        clientId: data.clientId ? data.clientId : null,
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
        aria-label={`Detalle de ruta ${route.code}`}
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
              className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Enviar seguimiento de ruta"
              title="Enviar seguimiento de ruta"
            >
              <Share2 size={18} aria-hidden />
            </button>
          ) : null}
          {canManage ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditRouteOpen(true)}
                className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Editar ruta"
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
                        {route.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyRouteCode()}
                        className="p-0.5 rounded text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        aria-label={codeCopied ? 'Código copiado' : 'Copiar código de ruta'}
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
                  <span className="font-semibold text-red-700 dark:text-red-400 tabular-nums">
                    {rejectedCount}
                  </span>
                </span>
              ) : null}
            </p>

            {assigned.length > 0 ? (
              <div
                className="mt-2 h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden"
                role="progressbar"
                aria-valuenow={deliveryProgressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progreso de entrega: ${deliveredCount} de ${assigned.length} pedidos`}
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 motion-reduce:transition-none"
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

          <div className="flex items-center justify-between gap-2 px-0.5 sticky top-0 z-[1] py-1 -mx-0.5 bg-stone-50/95 dark:bg-[#0d0d0d]/95 backdrop-blur-sm border-b border-transparent dark:border-transparent">
            <h3 className="text-[10px] font-semibold text-stone-500 dark:text-stone-500 uppercase tracking-wider">
              Pedidos en ruta
            </h3>
            {canManage && assigned.length > 0 ? (
              <Button
                type="button"
                variant={bulkAssignOpen ? 'primary' : 'secondary'}
                size="sm"
                icon={<ListChecks size={14} aria-hidden />}
                onClick={() => (bulkAssignOpen ? closeBulkAssign() : openBulkAssign())}
                disabled={bulkAssignBusy || orderAssignBusy !== null}
                aria-pressed={bulkAssignOpen}
              >
                {bulkAssignOpen ? 'Salir masivo' : 'Asignación masiva'}
              </Button>
            ) : null}
          </div>

          {bulkAssignOpen && assigned.length > 0 ? (
            <div className="rounded-xl border border-stone-200/90 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-900/50 px-3 py-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Asignación masiva
                </p>
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllBulk}
                    disabled={bulkAssignBusy}
                  >
                    Todos
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectNoneBulk}
                    disabled={bulkAssignBusy}
                  >
                    Ninguno
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 tabular-nums">
                {bulkSelectedIds.size} de {assigned.length} seleccionado
                {bulkSelectedIds.size === 1 ? '' : 's'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  id="bulk-driver"
                  label="Chofer"
                  value={bulkDraftDriver}
                  onChange={(e) => setBulkDraftDriver(e.target.value)}
                  options={driverSelectOpts}
                  disabled={bulkAssignBusy}
                  autoComplete="off"
                />
                <Select
                  id="bulk-peoneta"
                  label="Peoneta"
                  value={bulkDraftPeoneta}
                  onChange={(e) => setBulkDraftPeoneta(e.target.value)}
                  options={peonetaSelectOpts}
                  disabled={bulkAssignBusy}
                  autoComplete="off"
                />
                <Select
                  id="bulk-vehicle"
                  label="Vehículo"
                  value={bulkDraftVehicle}
                  onChange={(e) => setBulkDraftVehicle(e.target.value)}
                  options={vehicleSelectOpts}
                  disabled={bulkAssignBusy}
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  loading={bulkAssignBusy}
                  disabled={bulkAssignBusy || bulkSelectedIds.size === 0}
                  onClick={handleBulkApplySelected}
                >
                  Aplicar a {bulkSelectedIds.size} seleccionado
                  {bulkSelectedIds.size === 1 ? '' : 's'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={bulkAssignBusy}
                  onClick={handleBulkApplyAllRoute}
                >
                  Aplicar a toda la ruta
                </Button>
                <Button type="button" variant="ghost" disabled={bulkAssignBusy} onClick={closeBulkAssign}>
                  Cancelar
                </Button>
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
          ) : (
            <ul className="space-y-2">
              {assigned.map((o) => {
                const destinatario = o.clientName?.trim() || 'Por confirmar';
                const city = o.destination.city?.trim() || '—';
                const isAssignOpen = expandedOrderId === o.id;
                const isEditOpen = editingOrderId === o.id;
                const vehicleWarn = isAssignOpen ? getSameVehicleConflict(o.id) : null;
                const hasAssignment =
                  Boolean(o.driverName?.trim()) ||
                  Boolean(o.peonetaName?.trim()) ||
                  Boolean(o.vehiclePlate?.trim());

                const isBulkSelected = bulkSelectedIds.has(o.id);
                const isDelivered = o.status === 'delivered';
                const isRejected = o.status === 'rejected';
                const isInTransit = o.status === 'in_transit';
                const showStatusOnCard = isDelivered || isRejected || isInTransit;

                return (
                  <li
                    key={o.id}
                    className={clsx(
                      'glass-card-order overflow-hidden',
                      isDelivered && 'glass-card-order--delivered',
                      isRejected && 'glass-card-order--rejected',
                      isInTransit && 'glass-card-order--in-transit',
                      bulkAssignOpen && isBulkSelected && 'ring-2 ring-primary-500/50 dark:ring-primary-400/45',
                    )}
                  >
                    <div className="p-3 space-y-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {bulkAssignOpen ? (
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={isBulkSelected}
                            aria-label={`Seleccionar pedido ${o.code}`}
                            onClick={() => toggleBulkOrder(o.id)}
                            className="shrink-0 mt-0.5 p-0.5 rounded-md text-primary-600 dark:text-primary-400 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                          >
                            {isBulkSelected ? (
                              <CheckSquare size={20} aria-hidden />
                            ) : (
                              <Square size={20} className="text-stone-400" aria-hidden />
                            )}
                          </button>
                        ) : null}
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
                                'font-mono text-sm font-bold hover:text-primary-600 dark:hover:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded',
                                isDelivered
                                  ? 'text-emerald-900 dark:text-emerald-100'
                                  : 'text-stone-900 dark:text-white',
                              )}
                              title="Ver detalle del pedido"
                            >
                              {o.code}
                            </button>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {showStatusOnCard ? (
                                <OrderStatusBadge status={o.status} />
                              ) : null}
                              <span
                                className={clsx(
                                  'rounded-lg px-2 py-0.5 text-xs font-semibold tabular-nums',
                                  isDelivered
                                    ? 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                                    : 'bg-stone-100/90 text-stone-700 dark:bg-stone-800/90 dark:text-stone-200',
                                )}
                              >
                                {o.bultos} bulto{o.bultos === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500 mt-1.5">
                            Destinatario
                          </p>
                          <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
                            {destinatario}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5 min-w-0">
                            <MapPin size={12} className="shrink-0" aria-hidden />
                            <span className="truncate">{city}</span>
                          </p>
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
                          Marca los pedidos y usa el panel de arriba para asignar.
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

          {canManage ? (
            <div className="space-y-3 pt-3 mt-1 rounded-xl border border-stone-200/90 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/45 px-3 py-3 shadow-sm dark:shadow-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Nuevo pedido</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Vinculado a esta ruta.</p>
                </div>
                <Button
                  type="button"
                  variant={showCreateForm ? 'secondary' : 'primary'}
                  size="sm"
                  icon={showCreateForm ? <ChevronUp size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
                  aria-expanded={showCreateForm}
                  onClick={() => setShowCreateForm((v) => !v)}
                  disabled={busyId !== null}
                >
                  {showCreateForm ? 'Ocultar' : 'Agregar pedido'}
                </Button>
              </div>
              {showCreateForm ? (
                <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900/50 dark:shadow-none">
                  <OrderForm
                    key={createFormKey}
                    submitLabel="Crear pedido en la ruta"
                    onSubmit={(d) => void handleCreateOrder(d)}
                    onCancel={() => setShowCreateForm(false)}
                    lockedClientId={route.clientId?.trim() || undefined}
                    lockedClientName={
                      routeClientLabel !== '—' ? routeClientLabel : undefined
                    }
                  />
                </div>
              ) : null}

              {orphanOrders.length > 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 dark:border-stone-700 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                        Vincular pedido sin ruta
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        {filteredOrphans.length}/{orphanOrders.length} disponibles
                      </p>
                    </div>
                    <Input
                      label="Buscar"
                      value={orphanSearch}
                      onChange={(e) => setOrphanSearch(e.target.value)}
                      placeholder="Código, ciudad, destinatario…"
                      name={`orphan-search-${route.id}`}
                      autoComplete="off"
                      containerClassName="max-w-xs w-full"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <Select
                      id={`attach-orphan-route-${route.id}`}
                      label="Pedido"
                      value={pickOrderId}
                      onChange={(e) => setPickOrderId(e.target.value)}
                      options={orphanOptions}
                      containerClassName="flex-1 w-full min-w-0"
                      hint="Se moverá a esta ruta. No se elimina."
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      onClick={() => void handleAttachOrphan()}
                      disabled={!pickOrderId || busyId !== null}
                      loading={busyId === 'add'}
                    >
                      Vincular a la ruta
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-stone-500 text-center py-4">
              Solo administradores u operadores pueden gestionar pedidos en esta ruta.
            </p>
          )}
        </div>
      </div>
      {detailOrder ? (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          routeLabel={`${route.code} · ${route.name}`}
        />
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
          description={route.code}
          size="xl"
        >
          <RouteForm
            initial={{
              code: route.code,
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
              Se eliminará la ruta <strong translate="no">{route.code}</strong>
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
          if (conf.bulk && conf.bulkOrderIds?.length) {
            void performBulkAssignment(conf.bulkOrderIds);
            return;
          }
          if (conf.orderId) void performSaveOrderAssignment(conf.orderId);
        }}
        title="Mismo vehículo en varios pedidos"
        message={
          sameVehicleConfirm
            ? sameVehicleConfirm.bulk
              ? sameVehicleConfirm.bulkOrderIds?.length === assigned.length
                ? `¿Asignar el mismo vehículo (${sameVehicleConfirm.plate}) a los ${assigned.length} pedidos de esta ruta?`
                : `¿Asignar el mismo vehículo (${sameVehicleConfirm.plate}) a ${sameVehicleConfirm.bulkOrderIds?.length ?? 0} pedidos seleccionados?`
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
          routeCode={route.code}
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
  const { routes, loading: routesLoading, addRoute, fetchRoutes } = useRouteStore();
  const { orders, fetchOrders } = useOrderStore();

  useEffect(() => {
    void fetchRoutes();
    void fetchOrders();
  }, [fetchRoutes, fetchOrders]);

  const routeAggById = useMemo(() => {
    const map = new Map<
      string,
      { pedidos: number; bultos: number; delivered: number; vehiclesLabel: string; driversLabel: string }
    >();
    for (const r of routes) {
      const pedidosEnRuta = orders.filter((o) => o.routeId === r.id);
      map.set(r.id, {
        pedidos: pedidosEnRuta.length,
        bultos: pedidosEnRuta.reduce((s, o) => s + (Number(o.bultos) || 0), 0),
        delivered: pedidosEnRuta.filter((o) => o.status === 'delivered').length,
        vehiclesLabel: summarizeRouteVehicles(pedidosEnRuta, r.vehiclePlate),
        driversLabel: summarizeRouteAssignees(pedidosEnRuta, 'driverName'),
      });
    }
    return map;
  }, [routes, orders]);

  const [sortCol, setSortCol] = useState<RouteSortKey | null>('code');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [filterRouteStatus, setFilterRouteStatus] = useState<RouteStatus | 'all'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
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

  const filteredRoutes = useMemo(() => {
    const cutoff = filterDateRange !== 'all'
      ? new Date(Date.now() - parseInt(filterDateRange) * 86_400_000)
      : null;

    let data = routes.filter((r) => {
      if (filterRouteStatus !== 'all' && r.status !== filterRouteStatus) return false;
      if (cutoff) {
        const dateStr = routeDateKey(r);
        if (!dateStr || new Date(dateStr) < cutoff) return false;
      }
      if (search) {
        const t = search.toLowerCase();
        const pedidosEnRuta = orders.filter((o) => o.routeId === r.id);
        const agg = routeAggById.get(r.id);
        return (
          r.code.toLowerCase().includes(t) ||
          r.name.toLowerCase().includes(t) ||
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
        const aggA = routeAggById.get(a.id) ?? { pedidos: 0, bultos: 0, delivered: 0, vehiclesLabel: '', driversLabel: '' };
        const aggB = routeAggById.get(b.id) ?? { pedidos: 0, bultos: 0, delivered: 0, vehiclesLabel: '', driversLabel: '' };
        let av: string | number = '';
        let bv: string | number = '';
        switch (sortCol) {
          case 'code':
            av = a.code;
            bv = b.code;
            break;
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
  }, [routes, orders, filterRouteStatus, filterDateRange, search, sortCol, sortDir, routeAggById]);

  const statusCounts = useMemo(
    () => Object.fromEntries(ROUTE_STATUSES.map((s) => [s, routes.filter((r) => r.status === s).length])),
    [routes],
  );

  const hasActiveFilters = filterRouteStatus !== 'all' || filterDateRange !== '30d';

  const handleAddRoute = async (data: RouteFormData) => {
    setNewRouteError(null);
    try {
      await addRoute({
        name: data.name,
        ...(data.code ? { code: data.code } : {}),
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
            placeholder="Buscar folio, nombre, chofer…"
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

        <Button variant="secondary" size="sm" icon={<Download size={14} />}>
          Exportar
        </Button>

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
                  { value: '7d',  label: 'Últimos 7 días' },
                  { value: '30d', label: 'Últimos 30 días' },
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
          </div>

          <div className="flex justify-end border-t border-stone-100 dark:border-stone-800 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterRouteStatus('all');
                setFilterDateRange('30d');
                setShowFilters(false);
              }}
            >
              Restablecer filtros
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
                      <option value="code">Folio</option>
                      <option value="fecha">Fecha</option>
                      <option value="pedidos">Pedidos</option>
                      <option value="status">Estado</option>
                    </select>
                  </div>
                </div>

                {/* ── Vista tarjetas ── */}
                {layout === 'cards' && (
                  <ul className="space-y-2" role="list">
                    {filteredRoutes.map((r) => {
                      const agg = routeAggById.get(r.id) ?? { pedidos: 0, bultos: 0, delivered: 0, vehiclesLabel: '', driversLabel: '' };
                      return (
                        <li key={r.id}>
                          <RouteListItem
                            route={r}
                            agg={agg}
                            fecha={formatRouteDay(routeDateKey(r))}
                            selected={selectedRoute?.id === r.id}
                            onSelect={() => setSelectedRoute(r)}
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
                            {[
                              { label: 'Folio', col: 'code' as RouteSortKey, align: 'left' as const },
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
                            const agg = routeAggById.get(r.id) ?? { pedidos: 0, bultos: 0, delivered: 0, vehiclesLabel: '', driversLabel: '' };
                            return (
                              <RouteTableRow
                                key={r.id}
                                route={r}
                                agg={agg}
                                fecha={formatRouteDay(routeDateKey(r))}
                                selected={selectedRoute?.id === r.id}
                                onSelect={() => setSelectedRoute(r)}
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
          onSubmit={handleAddRoute}
          onCancel={() => {
            setNewRouteError(null);
            setShowNewRoute(false);
          }}
          submitLabel="Crear ruta"
          error={newRouteError}
        />
      </Modal>

    </div>
  );
}
