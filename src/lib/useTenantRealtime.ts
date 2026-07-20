import { useEffect, useRef } from 'react';
import { getAccessToken, getApiUrl } from './api';

export type TenantRealtimeEvent = {
  type: 'order.updated' | 'route.updated' | 'valuation.updated' | 'ping';
  tenantId: string;
  at: string;
  orderId?: string;
  routeId?: string;
  status?: string;
};

type Handler = (event: TenantRealtimeEvent) => void;

/**
 * Suscripción SSE a cambios de pedidos/rutas del tenant.
 * Debounce interno para evitar cascadas de refetch.
 */
export function useTenantRealtime(
  enabled: boolean,
  onEvent: Handler,
  debounceMs = 400,
) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const token = getAccessToken();
    if (!token) return;

    let es: EventSource | null = null;
    let closed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let retryMs = 1_500;

    const flush = (payload: TenantRealtimeEvent) => {
      if (payload.type === 'ping') return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        handlerRef.current(payload);
      }, debounceMs);
    };

    const connect = () => {
      if (closed) return;
      const url = `${getApiUrl()}/events/stream?access_token=${encodeURIComponent(token)}`;
      es = new EventSource(url);
      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data) as TenantRealtimeEvent;
          flush(data);
          retryMs = 1_500;
        } catch {
          // ignore malformed
        }
      };
      es.onerror = () => {
        es?.close();
        es = null;
        if (closed) return;
        const wait = retryMs;
        retryMs = Math.min(retryMs * 1.6, 20_000);
        setTimeout(connect, wait);
      };
    };

    connect();

    return () => {
      closed = true;
      if (timer) clearTimeout(timer);
      es?.close();
    };
  }, [enabled, debounceMs]);
}
