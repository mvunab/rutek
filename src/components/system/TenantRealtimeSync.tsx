import { useCallback, useEffect } from 'react';
import { useTenantRealtime } from '../../lib/useTenantRealtime';
import { useRouteStore } from '../../store/useRouteStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * Mantiene rutas/pedidos al día vía SSE (sin botón «Actualizar»).
 */
export function TenantRealtimeSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchRoutes = useRouteStore((s) => s.fetchRoutes);
  const fetchOrders = useOrderStore((s) => s.fetchOrders);

  const onEvent = useCallback(() => {
    void fetchRoutes();
    void fetchOrders();
  }, [fetchRoutes, fetchOrders]);

  useTenantRealtime(isAuthenticated, onEvent);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchRoutes();
  }, [isAuthenticated, fetchRoutes]);

  return null;
}
