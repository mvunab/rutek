/** Días antes del vencimiento para mostrar alerta amarilla. */
export const VEHICLE_COMPLIANCE_WARN_DAYS = 30;

export type ComplianceStatus = 'none' | 'ok' | 'warning' | 'expired';

export type VehicleComplianceKind =
  | 'maintenance'
  | 'circulationPermit'
  | 'technicalReview';

export const COMPLIANCE_LABELS: Record<VehicleComplianceKind, string> = {
  maintenance: 'Mantención',
  circulationPermit: 'Permiso de circulación',
  technicalReview: 'Revisión técnica',
};

function toLocalDay(isoDate: string): Date {
  const day = isoDate.trim().slice(0, 10);
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Días hasta el vencimiento (negativo si ya venció). */
export function daysUntilDue(isoDate: string, now = new Date()): number {
  const due = toLocalDay(isoDate);
  const today = startOfToday(now);
  const diffMs = due.getTime() - today.getTime();
  return Math.ceil(diffMs / 86_400_000);
}

export function complianceFromDueDate(
  isoDate?: string | null,
  now = new Date(),
): ComplianceStatus {
  if (!isoDate?.trim()) return 'none';
  const days = daysUntilDue(isoDate, now);
  if (days < 0) return 'expired';
  if (days <= VEHICLE_COMPLIANCE_WARN_DAYS) return 'warning';
  return 'ok';
}

export interface VehicleComplianceItem {
  kind: VehicleComplianceKind;
  label: string;
  dueDate: string;
  status: ComplianceStatus;
  daysLeft: number;
}

export interface VehicleComplianceSummary {
  worst: ComplianceStatus;
  items: VehicleComplianceItem[];
  alertCount: number;
}

export function summarizeVehicleCompliance(
  dates: {
    maintenanceDueDate?: string | null;
    circulationPermitDueDate?: string | null;
    technicalReviewDueDate?: string | null;
  },
  now = new Date(),
): VehicleComplianceSummary {
  const entries: { kind: VehicleComplianceKind; due?: string | null }[] = [
    { kind: 'maintenance', due: dates.maintenanceDueDate },
    { kind: 'circulationPermit', due: dates.circulationPermitDueDate },
    { kind: 'technicalReview', due: dates.technicalReviewDueDate },
  ];

  const items: VehicleComplianceItem[] = [];
  for (const { kind, due } of entries) {
    if (!due?.trim()) continue;
    const status = complianceFromDueDate(due, now);
    if (status === 'none' || status === 'ok') continue;
    items.push({
      kind,
      label: COMPLIANCE_LABELS[kind],
      dueDate: due.slice(0, 10),
      status,
      daysLeft: daysUntilDue(due, now),
    });
  }

  const rank: Record<ComplianceStatus, number> = {
    none: 0,
    ok: 1,
    warning: 2,
    expired: 3,
  };

  let worst: ComplianceStatus = 'none';
  for (const { due } of entries) {
    const s = complianceFromDueDate(due, now);
    if (rank[s] > rank[worst]) worst = s;
  }

  return { worst, items, alertCount: items.length };
}

export function formatComplianceHint(item: VehicleComplianceItem): string {
  if (item.status === 'expired') {
    const days = Math.abs(item.daysLeft);
    return `${item.label}: vencido hace ${days} ${days === 1 ? 'día' : 'días'}`;
  }
  return `${item.label}: vence en ${item.daysLeft} ${item.daysLeft === 1 ? 'día' : 'días'}`;
}
