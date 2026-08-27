import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../lib/api';
import { api } from '../../lib/api';
import { useRouteStore } from '../../store/useRouteStore';
import type { Route, Order, OrderStatus } from '../../types';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useClientStore } from '../../store/useClientStore';
import { useUserStore } from '../../store/useUserStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { usePhotoStore } from '../../store/usePhotoStore';
import { toast } from '../../store/useToastStore';
import { downloadRoutesExportXlsx } from '../../lib/routesExport';
import {
  formatRouteSequence,
  parseRouteSequenceInput,
} from '../../lib/routeSequence';
import { resolveOrderStatusLabel } from '../../lib/orderStatusLabels';
import { orderMatchesSearch } from '../../lib/orderSearch';
import { orderStatusColors } from '../../lib/statusColors';
import { resolveAssignee, resolveVehicle, buildPartialTeamAssignPayload } from '../../lib/teamAssignment';
import { indicesCoveredByRules, type RangeAssignRule } from '../../lib/rangeAssignRules';
import { isUuid } from '../../lib/uuid';
import type { DbDeliveryRecord } from '../../types/api';
import type { RoutePhoto } from '../../types';
import type { OrderFormData } from '../../components/orders/OrderForm';
import { ORDERS_PAGE_SIZE } from './routesPanelUtils';
import {
  getRegionSelectOptions,
  isOrderUnassigned,
  summarizeRouteAssignees,
  type RouteFormData,
} from './routesShared';
import { resolveDefaultPickupAddress } from '../../lib/orderAddress';

export type RouteDetailSidePanelProps = {
  route: Route;
  onClose: () => void;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

export function useRouteDetailSidePanel({
  route,
  onClose,
}: Pick<RouteDetailSidePanelProps, 'route' | 'onClose'>) {
  const { user, tenant } = useAuthStore();
  const canManage = user?.role === 'admin' || user?.role === 'operator';
  const {
    orders,
    detachOrderFromRoute,
    fetchOrdersByRoute,
    removeOrdersForRoute,
    addOrder,
    updateOrder,
    reactivateOrder,
  } = useOrderStore();
  const { fetchRoutes, addOrderToRoute, assignDriverToOrders, deleteRoute, updateRoute } = useRouteStore();
  const { clients, fetchClients } = useClientStore();
  const { users, fetchUsers } = useUserStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { photos, fetchPhotosByRoute } = usePhotoStore();

  useEffect(() => {
    void fetchClients();
    void fetchUsers();
    void fetchVehicles();
    // Solo las fotos de ESTA ruta, no las de todo el tenant.
    void fetchPhotosByRoute(route.id);
  }, [fetchClients, fetchUsers, fetchVehicles, fetchPhotosByRoute, route.id]);

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
    /** Asignación masiva por casillas (no por rangos). */
    bulkSelect?: boolean;
  } | null>(null);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignRules, setBulkAssignRules] = useState<RangeAssignRule[]>([]);
  const [bulkDraftCity, setBulkDraftCity] = useState('');
  const [bulkDraftRegion, setBulkDraftRegion] = useState('');
  const [bulkAssignBusy, setBulkAssignBusy] = useState(false);
  /** Selección manual de pedidos (checkboxes) para asignar equipo. */
  const [orderSelectMode, setOrderSelectMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(() => new Set());
  const [selectDraftDriver, setSelectDraftDriver] = useState('');
  const [selectDraftPeoneta, setSelectDraftPeoneta] = useState('');
  const [selectDraftVehicle, setSelectDraftVehicle] = useState('');
  const [selectAssignBusy, setSelectAssignBusy] = useState(false);
  const [inspectionLightbox, setInspectionLightbox] = useState<{
    photos: RoutePhoto[];
    index: number;
  } | null>(null);
  const [routeDeliveryRecords, setRouteDeliveryRecords] = useState<DbDeliveryRecord[]>([]);
  type OrderListFilter = 'all' | 'open' | 'terminal' | 'unassigned' | OrderStatus;

  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderListFilter>('all');
  /** Búsqueda dinámica de pedidos por referencia (OC/factura/ref/código) o destino. */
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  const assigned = useMemo(
    () =>
      orders
        .filter((o) => o.routeId === route.id)
        .toSorted((a, b) => a.code.localeCompare(b.code, 'es')),
    [orders, route.id],
  );

  const statusFilteredAssigned = useMemo(() => {
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

  const trimmedOrderSearch = orderSearchQuery.trim();

  const filteredAssigned = useMemo(() => {
    if (!trimmedOrderSearch) return statusFilteredAssigned;
    return statusFilteredAssigned.filter((o) => orderMatchesSearch(o, trimmedOrderSearch));
  }, [statusFilteredAssigned, trimmedOrderSearch]);

  const assignedIndexById = useMemo(() => {
    const map = new Map<string, number>();
    assigned.forEach((o, i) => map.set(o.id, i));
    return map;
  }, [assigned]);

  /** Evidencias de esta ruta (evita escanear TODAS las fotos del tenant por cada pedido). */
  const routePhotos = useMemo(
    () => photos.filter((p) => p.routeId === route.id || p.routeCode === route.code),
    [photos, route.id, route.code],
  );

  /**
   * Rutas con muchísimos pedidos (importaciones grandes) pueden tener miles de
   * filas: renderizarlas todas de una vez congela la pestaña. Se pintan de a
   * `ORDERS_PAGE_SIZE` y se permite cargar más a demanda.
   */
  const [visibleOrderCount, setVisibleOrderCount] = useState(ORDERS_PAGE_SIZE);
  const visibleAssigned = useMemo(
    () => filteredAssigned.slice(0, visibleOrderCount),
    [filteredAssigned, visibleOrderCount],
  );

  // Al cambiar de ruta el panel se remonta (`key={route.id}` en RoutesPage).
  // Aquí solo se reinicia la paginación virtual al filtrar/buscar.
  useEffect(() => {
    setVisibleOrderCount(ORDERS_PAGE_SIZE);
  }, [orderStatusFilter, trimmedOrderSearch]);

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
      // `addOrder` ya insertó el pedido creado en el store; no hace falta
      // volver a descargar todos los pedidos del tenant.
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
      // `detachOrderFromRoute` ya actualizó ese pedido en el store.
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
      // `reactivateOrder` ya actualizó ese pedido en el store.
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
    if (orderSelectMode) closeOrderSelectMode();
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
      // `updateOrder` ya actualizó ese pedido en el store.
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
    if (orderSelectMode) closeOrderSelectMode();
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

  const closeOrderSelectMode = () => {
    setOrderSelectMode(false);
    setSelectedOrderIds(new Set());
    setSelectDraftDriver('');
    setSelectDraftPeoneta('');
    setSelectDraftVehicle('');
  };

  const openOrderSelectMode = () => {
    setCreateOrderOpen(false);
    handleCancelOrderAssign();
    setEditingOrderId(null);
    if (bulkAssignOpen) closeBulkAssign();
    setOrderSelectMode(true);
    setSelectedOrderIds(new Set());
  };

  const toggleOrderSelected = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const selectAllFilteredOrders = () => {
    setSelectedOrderIds(new Set(filteredAssigned.map((o) => o.id)));
  };

  const clearSelectedOrders = () => {
    setSelectedOrderIds(new Set());
  };

  const openBulkAssign = () => {
    setCreateOrderOpen(false);
    handleCancelOrderAssign();
    setEditingOrderId(null);
    if (orderSelectMode) closeOrderSelectMode();
    setBulkAssignOpen(true);
    setBulkAssignRules([]);
  };

  const performAssignSelectedOrders = async () => {
    const orderIds = [...selectedOrderIds];
    if (orderIds.length === 0) {
      setActionError('Selecciona al menos un pedido.');
      return;
    }

    const driver = resolveAssignee(selectDraftDriver, driversList);
    const peoneta = resolveAssignee(selectDraftPeoneta, peonetasList);
    const vehicle = resolveVehicle(selectDraftVehicle, vehiclesSorted);

    if (selectDraftDriver.trim() && !driver) {
      setActionError('Selecciona un chofer válido de la lista.');
      return;
    }
    if (selectDraftPeoneta.trim() && !peoneta) {
      setActionError('Selecciona una peoneta válida de la lista.');
      return;
    }
    if (selectDraftVehicle.trim() && !vehicle) {
      setActionError('Selecciona un vehículo válido de la lista.');
      return;
    }

    const payload = buildPartialTeamAssignPayload({
      driverDraft: selectDraftDriver,
      peonetaDraft: selectDraftPeoneta,
      vehicleDraft: selectDraftVehicle,
      driver,
      peoneta,
      vehicle,
      orderIds,
    });

    if (
      payload.driverId === undefined &&
      payload.peonetaId === undefined &&
      payload.vehicleId === undefined
    ) {
      setActionError('Elige chofer, peoneta o vehículo para asignar.');
      return;
    }

    setSelectAssignBusy(true);
    setActionError(null);
    try {
      await assignDriverToOrders(route.id, payload);
      // Asignación masiva vía endpoint dedicado (no pasa por el store):
      // solo refrescamos los pedidos de ESTA ruta, no todo el tenant.
      await fetchOrdersByRoute(route.id);
      toast.info(
        `Asignación aplicada a ${orderIds.length} pedido${orderIds.length === 1 ? '' : 's'}`,
      );
      closeOrderSelectMode();
    } catch (err) {
      let msg = 'No se pudo asignar a los pedidos seleccionados.';
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
      setSelectAssignBusy(false);
    }
  };

  const handleAssignSelectedOrders = () => {
    const orderIds = [...selectedOrderIds];
    if (orderIds.length === 0) {
      setActionError('Selecciona al menos un pedido.');
      return;
    }
    if (selectDraftVehicle.trim() && orderIds.length > 1) {
      const v = vehiclesSorted.find((x) => x.id === selectDraftVehicle);
      if (v) {
        const otherCodes: string[] = [];
        for (const o of assigned) {
          if (selectedOrderIds.has(o.id)) otherCodes.push(o.code);
        }
        setSameVehicleConfirm({
          orderId: orderIds[0]!,
          plate: v.plate,
          otherCodes,
          bulkSelect: true,
        });
        return;
      }
    }
    void performAssignSelectedOrders();
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
        const assignJobs: Array<ReturnType<typeof buildPartialTeamAssignPayload>> = [];
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

          assignJobs.push(
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
        await Promise.all(
          assignJobs.map((payload) => assignDriverToOrders(route.id, payload)),
        );
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

      // La rama de equipo usa `assignDriverToOrders` (bulk, no toca el store);
      // la de ubicación ya actualizó cada pedido vía `updateOrder`. Alcanza
      // con refrescar los pedidos de esta ruta.
      await fetchOrdersByRoute(route.id);

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
    const vehiclesById = new Map(vehiclesSorted.map((v) => [v.id, v]));
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
      const v = vehiclesById.get(rule.vehicleId);
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

      // Rama "aplicar a todos" usa `assignDriverToOrders` (bulk, no toca el
      // store); la otra ya actualizó el pedido vía `updateOrder`. Alcanza
      // con refrescar los pedidos de esta ruta.
      await fetchOrdersByRoute(route.id);
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
      // La ruta (y sus pedidos) ya no existen: los quitamos del store local
      // sin necesidad de volver a descargar todos los pedidos del tenant.
      removeOrdersForRoute(route.id);
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
  return {
    route,
    onClose,
    canManage,
    busyId,
    actionError,
    createOrderOpen,
    createFormKey,
    detailOrder,
    setDetailOrder,
    editingOrderId,
    setEditingOrderId,
    trackingRouteOpen,
    setTrackingRouteOpen,
    removeOrderId,
    setRemoveOrderId,
    expandedOrderId,
    orderDraftDriver,
    setOrderDraftDriver,
    orderDraftPeoneta,
    setOrderDraftPeoneta,
    orderDraftVehicle,
    setOrderDraftVehicle,
    orderApplyToAll,
    setOrderApplyToAll,
    orderAssignBusy,
    orderAssignSaved,
    sameVehicleConfirm,
    setSameVehicleConfirm,
    bulkAssignOpen,
    bulkAssignRules,
    setBulkAssignRules,
    bulkDraftCity,
    setBulkDraftCity,
    bulkDraftRegion,
    setBulkDraftRegion,
    bulkAssignBusy,
    orderSelectMode,
    selectedOrderIds,
    selectDraftDriver,
    setSelectDraftDriver,
    selectDraftPeoneta,
    setSelectDraftPeoneta,
    selectDraftVehicle,
    setSelectDraftVehicle,
    selectAssignBusy,
    inspectionLightbox,
    setInspectionLightbox,
    orderStatusFilter,
    setOrderStatusFilter,
    orderSearchQuery,
    setOrderSearchQuery,
    assigned,
    filteredAssigned,
    visibleAssigned,
    assignedIndexById,
    routePhotos,
    orderFilterChips,
    trimmedOrderSearch,
    handleExportRoute,
    totals,
    driverSelectOpts,
    peonetaSelectOpts,
    vehicleSelectOpts,
    bulkRegionSelectOpts,
    handleCreateOrder,
    handleRemove,
    handleReactivateOrder,
    handleOpenOrderAssign,
    handleOpenOrderEdit,
    handleUpdateOrder,
    handleCancelOrderAssign,
    closeCreateOrder,
    openCreateOrder,
    closeBulkAssign,
    closeOrderSelectMode,
    openOrderSelectMode,
    toggleOrderSelected,
    selectAllFilteredOrders,
    clearSelectedOrders,
    openBulkAssign,
    handleAssignSelectedOrders,
    handleBulkApplyRules,
    performAssignSelectedOrders,
    performBulkApplyRules,
    getSameVehicleConflict,
    handleSaveOrderAssignment,
    fechaSrc,
    deliveredCount,
    rejectedCount,
    terminalCount,
    deliveryProgressPct,
    valuationRefreshKey,
    routeClientLabel,
    defaultOrderOrigin,
    routeDriversLabel,
    routePeonetasLabel,
    codeCopied,
    deleteRouteOpen,
    setDeleteRouteOpen,
    deleteRouteBusy,
    editRouteOpen,
    setEditRouteOpen,
    editRouteBusy,
    editRouteError,
    setEditRouteError,
    copyRouteCode,
    handleConfirmDeleteRoute,
    handleEditRouteSubmit,
    setVisibleOrderCount,
    ORDERS_PAGE_SIZE,
    tenant,
    routeDeliveryRecords,
    driversList,
    peonetasList,
    vehiclesSorted,
  };
}

export type RouteDetailPanelState = ReturnType<typeof useRouteDetailSidePanel>;
