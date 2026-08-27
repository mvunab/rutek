import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

function filenameBase(name: string) {
  return name.replace(/\.(xlsx|xls)$/i, '').trim();
}

function clearConfirmError() {
  useRouteImportStore.setState({ confirmError: null });
}

export function useImportExcelModal(
  open: boolean,
  onClose: () => void,
  onImported: () => void,
) {
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
    let cancelled = false;
    void fetchClients();
    void fetchUsers();
    void fetchVehicles();
    void fetchRoutes();
    void (async () => {
      try {
        const data = await api.get<unknown>('/tenant/excel-formats');
        if (cancelled) return;
        const list = normalizeExcelFormatsList(data);
        setExcelFormats(list);
        const active = list.find((f) => f.active);
        setFormatId(active?.id ?? list[0]?.id ?? '');
      } catch {
        if (cancelled) return;
        setExcelFormats([]);
        setFormatId('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, fetchClients, fetchRoutes, fetchUsers, fetchVehicles]);

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
      const pct = conf != null ? ` · ${Math.round(conf * 100)}%` : '';
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

    setStep('done');
    onImported();

    toast.info(
      `Ruta N° ${parsedRouteSequence ?? preview?.route_number ?? res.route_number ?? res.route_code} importada`,
      `${res.orders_created} pedido${res.orders_created !== 1 ? 's' : ''} creados · cuenta: ${res.client_name || 'Sin asignar'}`,
    );

    const rowsWithoutClient = (preview?.rows ?? []).filter((r) => !r.client_name.trim());
    if (rowsWithoutClient.length > 0) {
      toast.warning(
        'Pedidos sin destinatario identificado',
        `${rowsWithoutClient.length} fila${rowsWithoutClient.length !== 1 ? 's' : ''} no tenían destinatario en el Excel. Se asignó el destinatario principal de la ruta.`,
      );
    }

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

        const driverEntries: [string, string][] = [];
        for (const u of users) {
          if (u.role === 'driver') driverEntries.push([u.id, u.name]);
        }
        const driverById = new Map(driverEntries);
        const vehicleById = new Map(vehicles.map((v) => [v.id, v.plate]));

        const total = previewRows.length;
        setAssignProgress({ done: 0, total });

        await Promise.all(
          previewRows.map(async (_row, i) => {
            const orderCode = `${res.route_code}-${String(i + 1).padStart(3, '0')}`;
            const orderId = byCode.get(orderCode)?.id;
            if (!orderId) return;

            const dId = rowDriverId[i];
            const vId = rowVehicleId[i];
            if (!dId && !vId) {
              setAssignProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
              return;
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
          }),
        );

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
  };

  return {
    fileInputRef,
    step,
    file,
    formatId,
    formatAutoPicked,
    excelFormats,
    formatEval,
    formatSelectOptions,
    previewLoading,
    confirmLoading,
    evaluateLoading,
    previewError,
    confirmError,
    duplicateSequenceError,
    lastResult,
    preview,
    parsedRouteSequence,
    suggestedRouteSequence,
    excelRouteNumber,
    routeName,
    setRouteName,
    routeDate,
    setRouteDate,
    routeSequence,
    setRouteSequence,
    accountClientId,
    setAccountClientId,
    clients,
    assignRules,
    setAssignRules,
    rowDriverId,
    setRowDriverId,
    rowVehicleId,
    setRowVehicleId,
    assignBusy,
    assignProgress,
    previewRows,
    visibleRows,
    showAllRows,
    setShowAllRows,
    drivers,
    vehiclesSorted,
    handleClose,
    handleFileChange,
    handleFormatChange,
    handleConfirm,
    applyRules,
    clearConfirmError,
  };
}
