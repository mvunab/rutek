import { parseOrderReferenceFields } from './orderReferenceFields';
import type { Order } from '../types';

/** Normaliza texto para comparar sin distinguir mayúsculas, tildes ni espacios extra. */
export function normalizeSearchText(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * true si el pedido coincide con la búsqueda por número de referencia
 * (OC, factura, referencia, código) o por destino (calle, ciudad, región, cliente).
 */
export function orderMatchesSearch(order: Order, query: string): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;

  const refs = parseOrderReferenceFields(order.notes);
  const haystack = [
    order.code,
    refs?.numeroOc,
    refs?.factura,
    refs?.referencia,
    order.clientName,
    order.destination?.street,
    order.destination?.city,
    order.destination?.region,
  ];

  return haystack.some((field) => normalizeSearchText(field).includes(q));
}
