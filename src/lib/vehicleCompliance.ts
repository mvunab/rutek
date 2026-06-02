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

/** Tipos de documento en API / MinIO (`vehicle_documents.kind`). */
export const COMPLIANCE_TO_DOCUMENT_KIND: Record<
  VehicleComplianceKind,
  'maintenance' | 'circulation_permit' | 'technical_review'
> = {
  maintenance: 'maintenance',
  circulationPermit: 'circulation_permit',
  technicalReview: 'technical_review',
};

/** Tarjetas con subida de evidencia escaneada (imagen o PDF). */
export const COMPLIANCE_SUPPORTS_DOCUMENT_UPLOAD: VehicleComplianceKind[] = [
  'maintenance',
  'technicalReview',
];

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

export interface VehicleComplianceDetailItem {
  kind: VehicleComplianceKind;
  label: string;
  dueDate: string | null;
  status: ComplianceStatus;
  daysLeft: number | null;
}

const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  none: 'Sin registrar',
  ok: 'Al día',
  warning: 'Por vencer',
  expired: 'Vencido',
};

export function complianceStatusLabel(status: ComplianceStatus): string {
  return COMPLIANCE_STATUS_LABELS[status];
}

/** Todos los ítems de documentación para la ficha (incluye al día y sin fecha). */
export function listVehicleComplianceDetails(
  dates: {
    maintenanceDueDate?: string | null;
    circulationPermitDueDate?: string | null;
    technicalReviewDueDate?: string | null;
  },
  now = new Date(),
): VehicleComplianceDetailItem[] {
  const entries: { kind: VehicleComplianceKind; due?: string | null }[] = [
    { kind: 'maintenance', due: dates.maintenanceDueDate },
    { kind: 'circulationPermit', due: dates.circulationPermitDueDate },
    { kind: 'technicalReview', due: dates.technicalReviewDueDate },
  ];

  return entries.map(({ kind, due }) => {
    const dueDate = due?.trim() ? due.slice(0, 10) : null;
    const status = complianceFromDueDate(due, now);
    return {
      kind,
      label: COMPLIANCE_LABELS[kind],
      dueDate,
      status,
      daysLeft: dueDate ? daysUntilDue(dueDate, now) : null,
    };
  });
}
