import type { Vehicle } from '../../types';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useRouteStore } from '../../store/useRouteStore';
import { useOrderStore } from '../../store/useOrderStore';

const vehicleDetailCache = new Map<string, Promise<Vehicle>>();

/** Carga ficha + listas relacionadas fuera de effects (para `use()` / Suspense). */
export function loadVehicleDetail(id: string): Promise<Vehicle> {
  let pending = vehicleDetailCache.get(id);
  if (!pending) {
    pending = (async () => {
      const [vehicle] = await Promise.all([
        useVehicleStore.getState().fetchVehicle(id),
        useRouteStore.getState().fetchRoutes(),
        useOrderStore.getState().fetchOrders(),
      ]);
      return vehicle;
    })().catch((err) => {
      vehicleDetailCache.delete(id);
      throw err;
    });
    vehicleDetailCache.set(id, pending);
  }
  return pending;
}

export function invalidateVehicleDetail(id: string) {
  vehicleDetailCache.delete(id);
}
