import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { RangeAssignRulesPanel } from '../../../components/routes/RangeAssignRulesPanel';
import { api } from '../../../lib/api';
import { normalizeExcelFormatsList } from '../../../lib/excelFormat';
import {
  parseRouteSequenceInput,
  suggestNextRouteSequence,
} from '../../../lib/routeSequence';
import { applyRangeRules, type RangeAssignRule } from '../../../lib/rangeAssignRules';
import { isUuid } from '../../../lib/uuid';
import { toast } from '../../../store/useToastStore';
import { useRouteImportStore } from '../../../store/useRouteImportStore';
import { useClientStore } from '../../../store/useClientStore';
import { useUserStore } from '../../../store/useUserStore';
import { useVehicleStore } from '../../../store/useVehicleStore';
import { useOrderStore } from '../../../store/useOrderStore';
import { useRouteStore } from '../../../store/useRouteStore';
import type { ExcelFormatConfig } from '../../../types';

// ─── Import Excel Modal ───────────────────────────────────────────────────────

export function ImportExcelModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const { fetchPreview, confirmImport, evaluateFormats, preview, previewLoading, previewError, confirmLoading, confirmError, lastResult, formatEval, evaluateLoading, reset } =
    useRouteImportStore();
  const { clients, fetchClients } = useClientStore();
  const { users, fetchUsers } = useUserStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { updateOrder, fetchOrders } = useOrderStore();
  const { fetchRoutes, routes } = useRouteStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [routeName, setRouteName] = useState('');
  const [routeDate, setRouteDate] = useState('');
  const [routeSequence, setRouteSequence] = useState('');
  const [showAllRows, setShowAllRows] = useState(false);
  const [accountClientId, setAccountClientId] = useState('');
  const [rowDriverId, setRowDriverId] = useState<Record<number, string>>({});
  const [rowVehicleId, setRowVehicleId] = useState<Record<number, string>>({});
  const [assignRules, setAssignRules] = useState<RangeAssignRule[]>([]);
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignProgress, setAssignProgress] = useState<{ done: number; total: number } | null>(null);
  const [excelFormats, setExcelFormats] = useState<ExcelFormatConfig[]>([]);
  const [formatId, setFormatId] = useState('');
  const [formatAutoPicked, setFormatAutoPicked] = useState(false);

  useEffect(() => {
    if (!open) return;
    void fetchClients();
    void fetchUsers();
    void fetchVehicles();
    void fetchRoutes();
    void (async () => {
      try {
        const data = await api.get<unknown>('/tenant/excel-formats');
        const list = normalizeExcelFormatsList(data);
        setExcelFormats(list);
        const active = list.find((f) => f.active);
        setFormatId(active?.id ?? list[0]?.id ?? '');
      } catch {
        setExcelFormats([]);
        setFormatId('');
      }
    })();
  }, [open, fetchClients, fetchRoutes]);

  const handleClose = useCallback(() => {
    reset();
    setFile(null);
    setStep('upload');
    setRouteName('');
    setRouteDate('');
    setRouteSequence('');
    setShowAllRows(false);
    setAccountClientId('');
    setRowDriverId({});
    setRowVehicleId({});
    setAssignRules([]);
    setAssignBusy(false);
    setAssignProgress(null);
    setFormatId('');
    setFormatAutoPicked(false);
    onClose();
  }, [reset, onClose]);

  const filenameBase = (name: string) => name.replace(/\.(xlsx|xls)$/i, '').trim();

  const runPreview = useCallback(
    async (f: File, selectedFormatId: string) => {
      setShowAllRows(false);
      const p = await fetchPreview(f, {
        formatId: selectedFormatId.trim() || undefined,
      });
      if (p) {
        setRouteName(filenameBase(f.name));
        setRouteDate(p.route_date ?? '');
        setRouteSequence(String(p.route_number ?? '').trim());
        setStep('preview');
        if (p.rows.length === 0) {
          toast.warning(
            'Sin pedidos detectados',
            'El Excel no contiene filas de datos válidas. Verifica el formato o cambia la plantilla.',
          );
        } else {
          toast.info(
            `Preview lista · ${p.rows.length} pedidos`,
            `Ruta N° ${p.route_number} · ${p.transport_company || 'sin empresa'}`,
          );
        }
      } else {
        setStep('upload');
        const err = useRouteImportStore.getState().previewError;
        if (err) toast.error('Error al leer el Excel', err);
      }
    },
    [fetchPreview],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setStep('upload');
    setFormatAutoPicked(false);

    let chosenFormatId = formatId;
    if (excelFormats.length > 0) {
      const evalResult = await evaluateFormats(f);
      if (evalResult?.selected_format_id) {
        chosenFormatId = evalResult.selected_format_id;
        setFormatId(chosenFormatId);
        setFormatAutoPicked(true);
        toast.info('Plantilla detectada', evalResult.reason);
      } else if (evalResult?.rankings[0]) {
        chosenFormatId = evalResult.rankings[0].format_id;
        setFormatId(chosenFormatId);
        setFormatAutoPicked(false);
        toast.warning('Elige la plantilla', evalResult.reason);
      }
    }

    await runPreview(f, chosenFormatId);
  };

  const handleFormatChange = async (nextId: string) => {
    setFormatId(nextId);
    setFormatAutoPicked(false);
    if (!file || step === 'done') return;
    await runPreview(file, nextId);
  };

  const formatSelectOptions = useMemo(() => {
    if (excelFormats.length === 0) {
      return [{ value: '', label: 'Detección automática (sin plantillas)' }];
    }
    const confById = new Map(
      (formatEval?.rankings ?? []).map((r) => [r.format_id, r.confidence]),
    );
    return excelFormats.map((f) => {
      const conf = confById.get(f.id);
      const pct =
        conf != null ? ` · ${Math.round(conf * 100)}%` : '';
      const base = f.active ? `${f.name} (predeterminada)` : f.name;
      return { value: f.id, label: `${base}${pct}` };
    });
  }, [excelFormats, formatEval]);

  const parsedRouteSequence = parseRouteSequenceInput(routeSequence);
  const duplicateSequenceError =
    confirmError?.includes('Ya existe una ruta con el N°') ?? false;
  const suggestedRouteSequence = useMemo(
    () => suggestNextRouteSequence(routes, accountClientId.trim() || undefined),
    [routes, accountClientId],
  );
  const excelRouteNumber =
    preview?.route_number != null && String(preview.route_number).trim() !== ''
      ? String(preview.route_number)
      : null;

  const handleConfirm = async () => {
    if (!file) return;
    if (parsedRouteSequence == null) {
      toast.warning('N° de ruta inválido', 'Ingresa un número entero positivo para la ficha.');
      return;
    }
    const res = await confirmImport(file, {
      routeName: routeName.trim() || undefined,
      routeDate: routeDate || undefined,
      driverNameHint: preview?.driver_name_hint || undefined,
      clientId: accountClientId.trim() || undefined,
      routeNumber: parsedRouteSequence,
      formatId: formatId.trim() || undefined,
    });
    if (!res) {
      const err = useRouteImportStore.getState().confirmError;
      if (err && !err.includes('Ya existe una ruta con el N°')) {
        toast.error('Error al importar', err);
      }
      return;
    }

    if (res) {
      setStep('done');
      onImported();

      // Notificación de éxito
      toast.info(
        `Ruta N° ${parsedRouteSequence ?? preview?.route_number ?? res.route_number ?? res.route_code} importada`,
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
              ...(dId && isUuid(dId)
                ? { driverId: dId, driverName: driverById.get(dId) ?? null }
                : {}),
              ...(vId && isUuid(vId)
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
    const applied = applyRangeRules(total, assignRules);
    const nextDriver: Record<number, string> = {};
    const nextVehicle: Record<number, string> = {};
    for (const [iStr, vals] of Object.entries(applied)) {
      const i = Number(iStr);
      if (vals.driverId) nextDriver[i] = vals.driverId;
      if (vals.vehicleId) nextVehicle[i] = vals.vehicleId;
    }
    setRowDriverId(nextDriver);
    setRowVehicleId(nextVehicle);
  }, [assignRules, previewRows.length]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleClose} title="Importar desde Excel" size="2xl">
      <div className="space-y-5">
        {step !== 'done' && (
          <div className="space-y-2">
            <Select
              label="Plantilla de importación"
              value={formatId}
              onChange={(e) => void handleFormatChange(e.target.value)}
              disabled={previewLoading || confirmLoading || evaluateLoading}
              options={formatSelectOptions}
              hint={
                excelFormats.length > 0
                  ? formatAutoPicked
                    ? 'Detectada automáticamente (≥80% confianza). Puedes cambiarla si hace falta.'
                    : formatEval?.needs_manual_choice
                      ? 'Revisa el ranking y elige la plantilla correcta.'
                      : 'Elige la plantilla según el formato del Excel.'
                  : 'No hay plantillas configuradas. Se usará la detección automática del archivo.'
              }
            />

            {formatEval && formatEval.rankings.length > 0 ? (
              <div
                className={clsx(
                  'rounded-xl border px-3 py-2.5 space-y-2',
                  formatEval.needs_manual_choice
                    ? 'border-amber-200 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30'
                    : 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30',
                )}
                role="status"
              >
                <p
                  className={clsx(
                    'text-[11px] leading-snug',
                    formatEval.needs_manual_choice
                      ? 'text-amber-900 dark:text-amber-200'
                      : 'text-emerald-900 dark:text-emerald-200',
                  )}
                >
                  {formatEval.reason}
                </p>
                <ul className="space-y-1">
                  {formatEval.rankings.slice(0, 4).map((r, idx) => {
                    const active = formatId === r.format_id;
                    const pct = Math.round(r.confidence * 100);
                    return (
                      <li key={r.format_id}>
                        <button
                          type="button"
                          disabled={previewLoading || confirmLoading || evaluateLoading}
                          onClick={() => void handleFormatChange(r.format_id)}
                          className={clsx(
                            'w-full flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left cursor-pointer transition-colors duration-200',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
                            active
                              ? 'border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-950/40'
                              : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-950 dark:hover:bg-stone-800',
                          )}
                        >
                          <span className="text-[10px] font-semibold tabular-nums text-stone-400 w-4 shrink-0">
                            {idx + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-stone-800 dark:text-stone-100">
                            {r.format_name}
                          </span>
                          <span
                            className={clsx(
                              'shrink-0 tabular-nums text-[11px] font-semibold rounded-md px-1.5 py-0.5',
                              pct >= 80
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                                : pct >= 50
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                                  : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
                            )}
                          >
                            {pct}%
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        )}

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
              disabled={previewLoading || confirmLoading || evaluateLoading}
              className={clsx(
                'w-full rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-2 transition-colors text-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                previewLoading || evaluateLoading
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
              {evaluateLoading ? (
                <p className="text-sm text-stone-500">Evaluando plantillas…</p>
              ) : previewLoading ? (
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
          <div
            className={clsx(
              'flex items-start gap-2 rounded-lg border px-3 py-2.5',
              duplicateSequenceError
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900',
            )}
            role="alert"
          >
            <AlertCircle
              size={16}
              className={clsx(
                'shrink-0 mt-0.5',
                duplicateSequenceError
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400',
              )}
              aria-hidden
            />
            <div className="min-w-0 space-y-1">
              <p
                className={clsx(
                  'text-xs',
                  duplicateSequenceError
                    ? 'text-amber-800 dark:text-amber-200'
                    : 'text-red-700 dark:text-red-300',
                )}
              >
                {confirmError}
              </p>
              {duplicateSequenceError ? (
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Corrige el N° consecutivo abajo e intenta de nuevo.
                </p>
              ) : null}
            </div>
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
                N°{' '}
                <span translate="no" className="font-mono font-bold">
                  {parsedRouteSequence ?? preview?.route_number ?? lastResult.route_code}
                </span>
                {' '}· {lastResult.orders_created} pedidos creados
                {lastResult.client_name ? ` · cuenta: ${lastResult.client_name}` : ''}
              </p>
            </div>
            <Button onClick={handleClose}>Cerrar</Button>
          </div>
        )}

        {/* Step: preview */}
        {step === 'preview' && preview && (
          <>
            {/* Metadata del Excel */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
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
                <Input
                  id="import-route-sequence"
                  label="N° consecutivo de ruta"
                  name="import_route_sequence"
                  inputMode="numeric"
                  value={routeSequence}
                  onChange={(e) => {
                    setRouteSequence(e.target.value);
                    if (confirmError) useRouteImportStore.setState({ confirmError: null });
                  }}
                  autoComplete="off"
                  hint={
                    excelRouteNumber
                      ? `Leído del Excel: ${excelRouteNumber}. Cambialo si ese N° ya existe en el sistema.`
                      : 'Ingresa el N° correlativo de la ficha.'
                  }
                  error={
                    parsedRouteSequence == null && routeSequence.trim() !== ''
                      ? 'Debe ser un entero positivo.'
                      : duplicateSequenceError
                        ? 'Este N° ya está en uso.'
                        : undefined
                  }
                />
                {duplicateSequenceError ? (
                  <button
                    type="button"
                    className="mt-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                    onClick={() => {
                      setRouteSequence(String(suggestedRouteSequence));
                      useRouteImportStore.setState({ confirmError: null });
                    }}
                  >
                    Usar siguiente disponible (N° {suggestedRouteSequence})
                  </button>
                ) : null}
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

            <RangeAssignRulesPanel
              total={previewRows.length}
              rules={assignRules}
              onRulesChange={(next) => {
                setAssignRules(next);
                if (next.length === 0) {
                  setRowDriverId({});
                  setRowVehicleId({});
                }
              }}
              onApplyRules={applyRules}
              drivers={drivers}
              vehicles={vehiclesSorted}
            />

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
                disabled={assignBusy || parsedRouteSequence == null}
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
