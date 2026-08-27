import type { Tenant } from '../types';

export const VALUATION_UNDER_CONSTRUCTION_MESSAGE =
  'Este módulo aún está en construcción. Un super admin puede activarlo en la ficha del tenant.';

/**
 * Valorización: opt-in por feature flag del tenant (`valuation_module_enabled`).
 * Forzar en local: VITE_VALUATION_MODULE=true|false
 */
export function isValuationModuleEnabled(
  tenant?: Tenant | null,
  featureFlags?: Record<string, unknown> | null,
): boolean {
  const env = import.meta.env.VITE_VALUATION_MODULE;
  if (env === 'true') return true;
  if (env === 'false') return false;
  const flags = featureFlags ?? tenant?.featureFlags ?? null;
  return flags?.['valuation_module_enabled'] === true;
}
