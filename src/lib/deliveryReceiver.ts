import type { DbDeliveryRecord } from '../types/api';

export type DeliveryReceiverInfo = {
  name: string;
  rut: string;
};

const DELIVERED_RECORD_STATES = new Set(['entregado', 'delivered']);

/** Registro de entrega asociado a un pedido (prioriza estado entregado). */
export function pickDeliveryReceiverForOrder(
  records: DbDeliveryRecord[],
  orderId: string,
): DeliveryReceiverInfo | null {
  const forOrder = records.filter((r) => r.order_id === orderId);
  if (forOrder.length === 0) return null;

  const record =
    forOrder.find((r) => DELIVERED_RECORD_STATES.has(r.estado.trim().toLowerCase())) ??
    forOrder[0];

  const name = record.recepcion?.trim() || record.entrega?.trim() || '';
  const rut = record.rut?.trim() ?? '';
  if (!name && !rut) return null;

  return { name, rut };
}
