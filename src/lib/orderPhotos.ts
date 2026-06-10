import type { Order, Route, RoutePhoto } from '../types';

/** Evidencias de un pedido en una ruta (por id o código). */
export function photosForOrderOnRoute(
  photos: RoutePhoto[],
  route: Pick<Route, 'id' | 'code'>,
  order: Pick<Order, 'id' | 'code'>,
): RoutePhoto[] {
  const seen = new Set<string>();
  const result: RoutePhoto[] = [];

  for (const photo of photos) {
    const routeMatch = photo.routeId === route.id || photo.routeCode === route.code;
    if (!routeMatch) continue;

    const orderMatch = photo.orderId === order.id || photo.orderCode === order.code;
    if (!orderMatch) continue;

    if (seen.has(photo.id)) continue;
    seen.add(photo.id);
    result.push(photo);
  }

  return result;
}
