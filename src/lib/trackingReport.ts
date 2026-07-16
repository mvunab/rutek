import type { LucideIcon } from 'lucide-react';
import { Box, Truck, PackageCheck } from 'lucide-react';

export type TrackingPhoto = {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type?: string | null;
};

export interface TrackingInfo {
  orderCode: string;
  clientName: string;
  status: string;
  estimatedDelivery: string;
  actualDelivery: string | null;
  /** Hora exacta de entrega (registro de entrega); priorizar sobre actualDelivery. */
  deliveredAt?: string | null;
  receiverName?: string | null;
  receiverRut?: string | null;
  deliveryObs?: string | null;
  rejectionMotive?: string | null;
  rejectionObs?: string | null;
  rejectedAt?: string | null;
  photos?: TrackingPhoto[];
  createdAt: string;
  bultos: number;
  origin: { city: string; region: string };
  destination: { street: string; city: string; region: string };
  routeCode: string | null;
  driverName: string | null;
  tenant: { name: string; logo: string | null };
  expiresAt: string;
  notifications?: { channel: string; sentAt: string }[];
}

export interface ProgressStep {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface TimelineEvent {
  at: Date;
  title: string;
  location: string;
  done: boolean;
  highlight?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  in_transit: 'En ruta',
  delivered: 'Entregado',
  rejected: 'Rechazada',
  cancelled: 'Cancelado',
  returned: 'Devuelto',
};

export const PROGRESS_STEPS: ProgressStep[] = [
  { id: 'preparation', label: 'En preparación', icon: Box },
  { id: 'transit', label: 'En tránsito', icon: Truck },
  { id: 'out_for_delivery', label: 'En reparto', icon: Truck },
  { id: 'delivered', label: 'Entregado', icon: PackageCheck },
];

export function resolveStatusLabel(slug: string): string {
  return STATUS_LABELS[slug] ?? slug.replace(/_/g, ' ');
}

/** Índice del paso activo (0–3) según estado del pedido. */
export function getActiveStepIndex(info: TrackingInfo): number {
  const s = info.status.toLowerCase();
  if (s === 'delivered') return 3;
  if (s === 'rejected' || s === 'cancelled') return -1;
  if (s === 'in_transit') return info.driverName ? 2 : 1;
  if (s === 'confirmed') return 0;
  return 0; // pending y otros
}

export function getStatusHeadline(info: TrackingInfo): { title: string; subtitle: string } {
  const label = resolveStatusLabel(info.status);
  const tenant = info.tenant.name;

  switch (info.status) {
    case 'delivered':
      return {
        title: 'Pedido entregado',
        subtitle: `¡Gracias por confiar en ${tenant}! Tu envío fue recibido correctamente.`,
      };
    case 'rejected':
      return {
        title: 'Entrega no realizada',
        subtitle: info.rejectionMotive
          ? `Motivo: ${info.rejectionMotive}. Contacta a tu operador logístico si necesitas ayuda.`
          : 'El pedido fue marcado como rechazado. Contacta a tu operador logístico si necesitas ayuda.',
      };
    case 'in_transit':
      return info.driverName
        ? {
            title: 'Tu pedido está en reparto',
            subtitle: `Chofer asignado: ${info.driverName}. Pronto llegará a destino.`,
          }
        : {
            title: 'Tu pedido está en tránsito',
            subtitle: `En camino hacia ${info.destination.city}. Te avisaremos cuando salga a reparto.`,
          };
    default:
      return {
        title: `Estado: ${label}`,
        subtitle: `Estamos preparando tu envío. Fecha estimada de entrega visible abajo.`,
      };
  }
}

/** Construye eventos de línea de tiempo (más reciente primero, agrupable por fecha). */
export function buildTimeline(info: TrackingInfo): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const dest = info.destination.city;
  const now = new Date();
  const created = new Date(info.createdAt);
  const estimated = new Date(info.estimatedDelivery);

  const deliveredIso = info.deliveredAt ?? info.actualDelivery;

  if (deliveredIso) {
    events.push({
      at: new Date(deliveredIso),
      title: 'Entregado',
      location: dest,
      done: true,
      highlight: true,
    });
  }

  if (info.status === 'in_transit' || info.status === 'delivered') {
    const repartoAt = deliveredIso
      ? new Date(new Date(deliveredIso).getTime() - 3 * 3_600_000)
      : new Date(now.getTime() - 2 * 3_600_000);
    if (info.driverName) {
      events.push({
        at: repartoAt,
        title: 'En reparto',
        location: dest,
        done: info.status === 'delivered',
      });
    }
    events.push({
      at: new Date(repartoAt.getTime() - 24 * 3_600_000),
      title: 'Paquete en centro de distribución',
      location: info.origin.city || dest,
      done: true,
    });
    events.push({
      at: new Date(repartoAt.getTime() - 48 * 3_600_000),
      title: 'En tránsito hacia destino',
      location: `${info.origin.city} → ${dest}`,
      done: true,
    });
  }

  if (info.routeCode) {
    events.push({
      at: new Date(created.getTime() + 3_600_000),
      title: `Asignado a ruta ${info.routeCode}`,
      location: info.origin.city || 'Origen',
      done: true,
    });
  }

  if (info.status === 'rejected') {
    events.push({
      at: info.rejectedAt ? new Date(info.rejectedAt) : now,
      title: info.rejectionMotive
        ? `Entrega rechazada · ${info.rejectionMotive}`
        : 'Entrega rechazada',
      location: dest,
      done: true,
      highlight: true,
    });
  }

  for (const n of info.notifications ?? []) {
    const ch = n.channel === 'email' ? 'Notificación por email' : 'Link de seguimiento enviado';
    events.push({
      at: new Date(n.sentAt),
      title: ch,
      location: '—',
      done: true,
    });
  }

  events.push({
    at: created,
    title: 'Pedido registrado',
    location: info.clientName,
    done: true,
  });

  events.push({
    at: estimated,
    title: 'Fecha estimada de entrega',
    location: dest,
    done: info.status === 'delivered',
  });

  const seen = new Set<string>();
  return events
    .filter((e) => {
      const key = `${e.at.toISOString()}-${e.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.at.getTime() - a.at.getTime());
}

export function groupTimelineByDate(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const fmt = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  const map = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    const key = fmt.format(e.at);
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return map;
}

export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}
