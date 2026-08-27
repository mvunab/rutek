import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../../lib/api';
import { api } from '../../lib/api';
import { useRouteStore } from '../../store/useRouteStore';
import { useOrderStore } from '../../store/useOrderStore';
import { usePhotoStore } from '../../store/usePhotoStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useClientStore } from '../../store/useClientStore';
import type { Route, RouteStatus } from '../../types';
import { toast } from '../../store/useToastStore';
import {
  downloadRoutesExportXlsx,
  describeRoutesExportFilters,
  describeRoutesExportRange,
  routesExportCutoff,
  type RoutesDateRangeFilter,
} from '../../lib/routesExport';
import {
  parseRouteSequenceInput,
  resolveRouteSequence,
} from '../../lib/routeSequence';
import type { DbDeliveryRecord } from '../../types/api';
import {
  LAYOUT_KEY,
  ROUTE_STATUSES,
  summarizeRouteAssignees,
  summarizeRouteVehicles,
  type RouteFormData,
  type RouteLayout,
  type RouteSortKey,
  type SortDir,
} from './routesShared';
import {
  clampPanelWidth,
  usePanelWidth,
} from './routesPanelUtils';

function routeDateKey(r: Route) {
  return typeof r.startTime === 'string' && r.startTime.includes('T') ? r.startTime : r.createdAt;
}

export function useRoutesPage() {
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
  return {
    routes,
    routesLoading,
    fetchRoutes,
    fetchOrders,
    clientNameById,
    routeAggById,
    sortCol,
    setSortCol,
    sortDir,
    setSortDir,
    search,
    setSearch,
    filterRouteStatus,
    setFilterRouteStatus,
    filterClientId,
    setFilterClientId,
    filterDateRange,
    setFilterDateRange,
    showFilters,
    setShowFilters,
    showNewRoute,
    setShowNewRoute,
    showImportExcel,
    setShowImportExcel,
    layout,
    setLayout,
    detailPanelWidth,
    handlePanelResize,
    newRouteError,
    setNewRouteError,
    selectedRoute,
    setSelectedRoute,
    detailPanelFullscreen,
    setDetailPanelFullscreen,
    bulkDeleteMode,
    setBulkDeleteMode,
    bulkDeleteSelectedIds,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    bulkDeleteBusy,
    closeBulkDeleteMode,
    toggleBulkDeleteRoute,
    closeDetailPanel,
    routeDateKey,
    clientsWithRoutes,
    clientFilterOptions,
    filteredRoutes,
    statusCounts,
    hasActiveFilters,
    exportRangeDescription,
    exportFiltersDescription,
    handleExportRoutes,
    selectAllBulkDelete,
    selectNoneBulkDelete,
    bulkDeleteTargets,
    bulkDeleteOrderCount,
    handleConfirmBulkDelete,
    handleAddRoute,
    totalBultos,
    panelOpen,
    panelFullscreenActive,
    orders,
  };
}

export type RoutesPageState = ReturnType<typeof useRoutesPage>;
