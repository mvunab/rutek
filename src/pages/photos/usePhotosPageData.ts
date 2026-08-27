import { useEffect, useMemo, useState } from 'react';
import { usePhotoStore } from '../../store/usePhotoStore';
import { normalizeRouteStatus } from '../../lib/routeStatusLabels';
import { isRouteDelivered, type RouteListItem } from './photosPageShared';

export function usePhotosPageData() {
  const [search, setSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const { photos, loading, fetchPhotos } = usePhotoStore();

  useEffect(() => {
    void fetchPhotos();
  }, [fetchPhotos]);

  const evidencePhotos = useMemo(() => photos, [photos]);

  const searchFiltered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return evidencePhotos;
    return evidencePhotos.filter(
      (p) =>
        p.routeCode.toLowerCase().includes(t) ||
        p.driverName.toLowerCase().includes(t) ||
        p.vehiclePlate.toLowerCase().includes(t) ||
        p.clientName.toLowerCase().includes(t) ||
        p.orderCode.toLowerCase().includes(t) ||
        p.description.toLowerCase().includes(t),
    );
  }, [evidencePhotos, search]);

  const routeList = useMemo(() => {
    const map = new Map<string, Omit<RouteListItem, 'code'>>();
    for (const p of searchFiltered) {
      const cur = map.get(p.routeCode);
      if (!cur) {
        map.set(p.routeCode, {
          routeId: p.routeId,
          routeName: p.routeName ?? '',
          routeStatus: normalizeRouteStatus(p.routeStatus ?? ''),
          driverName: p.driverName,
          fecha: p.fecha,
          photoCount: 1,
          orderCount: 0,
        });
      } else {
        cur.photoCount += 1;
      }
    }
    for (const [code, meta] of map) {
      const orderIds = new Set<string>();
      for (const p of searchFiltered) {
        if (p.routeCode === code) orderIds.add(p.orderId);
      }
      meta.orderCount = orderIds.size;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, meta]) => ({ code, ...meta }));
  }, [searchFiltered]);

  const { routesDelivered, routesPending } = useMemo(() => {
    const delivered: RouteListItem[] = [];
    const pending: RouteListItem[] = [];
    for (const route of routeList) {
      if (isRouteDelivered(route.routeStatus)) delivered.push(route);
      else pending.push(route);
    }
    return { routesDelivered: delivered, routesPending: pending };
  }, [routeList]);

  const ordersInRoute = useMemo(() => {
    if (!selectedRoute) return [];
    const map = new Map<
      string,
      { orderId: string; clientName: string; orderStatus?: string; photoCount: number }
    >();
    for (const p of searchFiltered.filter((p) => p.routeCode === selectedRoute)) {
      const cur = map.get(p.orderCode);
      if (!cur) {
        map.set(p.orderCode, {
          orderId: p.orderId,
          clientName: p.clientName,
          orderStatus: p.orderStatus,
          photoCount: 1,
        });
      } else {
        cur.photoCount += 1;
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, meta]) => ({ code, ...meta }));
  }, [searchFiltered, selectedRoute]);

  const photosForOrder = useMemo(() => {
    if (!selectedRoute || !selectedOrder) return [];
    return searchFiltered.filter(
      (p) => p.routeCode === selectedRoute && p.orderCode === selectedOrder,
    );
  }, [searchFiltered, selectedRoute, selectedOrder]);

  const selectedRouteMeta = routeList.find((r) => r.code === selectedRoute);
  const selectedOrderMeta = ordersInRoute.find((o) => o.code === selectedOrder);

  useEffect(() => {
    if (routeList.length === 0) {
      setSelectedRoute(null);
      setSelectedOrder(null);
      return;
    }
    if (!selectedRoute || !routeList.some((r) => r.code === selectedRoute)) {
      setSelectedRoute(routeList[0].code);
    }
  }, [routeList, selectedRoute]);

  useEffect(() => {
    if (!selectedRoute) {
      setSelectedOrder(null);
      return;
    }
    if (ordersInRoute.length === 0) {
      setSelectedOrder(null);
      return;
    }
    if (!selectedOrder || !ordersInRoute.some((o) => o.code === selectedOrder)) {
      setSelectedOrder(ordersInRoute[0].code);
    }
  }, [selectedRoute, ordersInRoute, selectedOrder]);

  const selectRoute = (code: string) => {
    setSelectedRoute(code);
    setSelectedOrder(null);
  };

  return {
    search,
    setSearch,
    selectedRoute,
    selectedOrder,
    setSelectedOrder,
    selectRoute,
    loading,
    photos,
    evidencePhotos,
    routeList,
    routesDelivered,
    routesPending,
    ordersInRoute,
    photosForOrder,
    selectedRouteMeta,
    selectedOrderMeta,
  };
}
