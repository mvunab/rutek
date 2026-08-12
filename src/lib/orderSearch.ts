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
 * (OC, factura, referencia), destino (calle, ciudad, región, cliente) o
 * equipo asignado (chofer, peoneta).
 *
 * Deliberadamente NO compara contra `order.code` (folio/id interno, ej. "1083-1")
 * ni contra la posición del pedido en la lista, para evitar falsos positivos
 * al buscar por un número.
 */
export function orderMatchesSearch(order: Order, query: string): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;

  const refs = parseOrderReferenceFields(order.notes);
  const haystack = [
    refs?.numeroOc,
    refs?.factura,
    refs?.referencia,
    order.clientName,
    order.destination?.street,
    order.destination?.city,
    order.destination?.region,
    order.driverName,
    order.peonetaName,
  ];

  return haystack.some((field) => normalizeSearchText(field).includes(q));
}
