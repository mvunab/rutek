import type { Tenant } from '../types';

export const TENANT_PLAN_LABELS: Record<Tenant['plan'], string> = {
  starter: 'Standard',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export function formatTenantPlanLabel(plan: string | undefined): string {
  if (!plan) return 'Standard';
  return TENANT_PLAN_LABELS[plan as Tenant['plan']] ?? plan;
}
