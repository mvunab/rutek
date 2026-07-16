import type { DbDeliveryRecord } from '../types/api';

export type DeliveryReceiverInfo = {
  name: string;
  rut: string;
  /** ISO de fecha/hora de entrega (delivery_records.fecha_hora). */
  deliveredAt: string | null;
};

export type RejectionInfo = {
  motivo: string;
  obs: string;
};

const DELIVERED_RECORD_STATES = new Set(['entregado', 'delivered']);
const REJECTED_RECORD_STATES = new Set(['rejected', 'rechazado', 'rechazo']);

const deliveryDateTimeFmt = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/** Formato legible de fecha/hora de entrega para Excel y enlaces públicos. */
export function formatDeliveryDateTime(iso: string | null | undefined): string {
  if (!iso?.trim()) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return deliveryDateTimeFmt.format(d);
}

/**
 * Registros ligados al pedido.
 * Muchos históricos solo tienen `pedido`/`ref` (código), sin `order_id` ni `route_id`.
 */
function recordsForOrder(
  records: DbDeliveryRecord[],
  orderId: string,
  orderCode?: string | null,
): DbDeliveryRecord[] {
  const code = orderCode?.trim();
  return records.filter((r) => {
    if (r.order_id && r.order_id === orderId) return true;
    if (code && (r.pedido?.trim() === code || r.ref?.trim() === code)) return true;
    return false;
  });
}

/** Registro de entrega asociado a un pedido (prioriza estado entregado). */
export function pickDeliveryReceiverForOrder(
  records: DbDeliveryRecord[],
  orderId: string,
  orderCode?: string | null,
): DeliveryReceiverInfo | null {
  const forOrder = recordsForOrder(records, orderId, orderCode);
  if (forOrder.length === 0) return null;

  const delivered =
    forOrder.find((r) => DELIVERED_RECORD_STATES.has(r.estado.trim().toLowerCase())) ??
    null;

  // Preferir entregas; si no hay, un registro con receptor/RUT explícito
  // (evitar usar `entrega` de rechazos, que guarda el motivo).
  const record =
    delivered ??
    forOrder.find((r) => Boolean(r.recepcion?.trim() || r.rut?.trim())) ??
    null;
  if (!record) return null;

  const isDelivered = DELIVERED_RECORD_STATES.has(record.estado.trim().toLowerCase());
  const name = isDelivered
    ? record.recepcion?.trim() || record.entrega?.trim() || ''
    : record.recepcion?.trim() || '';
  const rut = record.rut?.trim() ?? '';
  const deliveredAt = isDelivered ? record.fecha_hora?.trim() || null : null;
  if (!name && !rut && !deliveredAt) return null;

  return { name, rut, deliveredAt };
}

/** Registro de rechazo asociado a un pedido. */
export function pickRejectionInfoForOrder(
  records: DbDeliveryRecord[],
  orderId: string,
  orderCode?: string | null,
): RejectionInfo | null {
  const forOrder = recordsForOrder(records, orderId, orderCode);
  if (forOrder.length === 0) return null;

  const record =
    forOrder.find((r) => REJECTED_RECORD_STATES.has(r.estado.trim().toLowerCase())) ??
    forOrder.find((r) => r.tipo?.trim().toLowerCase() === 'rechazo') ??
    null;
  if (!record) return null;

  const obs = record.obs?.trim() || record.entrega?.trim() || '';
  if (!obs) return null;

  const parts = obs.split(' — ');
  const motivo = parts[0]?.trim() ?? '';
  const extraObs = parts.slice(1).join(' — ').trim();

  return {
    motivo: motivo || obs,
    obs: extraObs,
  };
}
