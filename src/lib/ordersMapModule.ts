import type { Tenant } from '../types';

export const ORDERS_MAP_UNDER_CONSTRUCTION_MESSAGE =
  'El mapa de pedidos aún no está activo para este tenant. Un super admin puede habilitarlo en la ficha del tenant.';

/**
 * Mapa de pedidos: opt-in por feature flag del tenant.
 * Forzar en local: VITE_ORDERS_MAP_MODULE=true|false
 */
export function isOrdersMapModuleEnabled(
  tenant?: Tenant | null,
  featureFlags?: Record<string, unknown> | null,
): boolean {
  const env = import.meta.env.VITE_ORDERS_MAP_MODULE;
  if (env === 'true') return true;
  if (env === 'false') return false;
  const flags = featureFlags ?? tenant?.featureFlags ?? null;
  return flags?.['orders_map_module_enabled'] === true;
}
