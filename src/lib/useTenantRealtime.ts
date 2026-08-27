import { useEffect, useRef } from 'react';
import { getApiUrl } from './api';

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
 * Autenticación vía cookie HttpOnly (`withCredentials`); sin token en la URL.
 */
export function useTenantRealtime(
  enabled: boolean,
  onEvent: Handler,
  debounceMs = 400,
) {
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    const url = `${getApiUrl()}/events/stream`;
    let closed = false;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retryMs = 1_500;
    let source = new EventSource(url, { withCredentials: true });

    const flush = (payload: TenantRealtimeEvent) => {
      if (payload.type === 'ping') return;
      if (debounceTimer !== undefined) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        handlerRef.current(payload);
      }, debounceMs);
    };

    const onMessage = (msg: MessageEvent) => {
      try {
        const data = JSON.parse(String(msg.data)) as TenantRealtimeEvent;
        flush(data);
        retryMs = 1_500;
      } catch {
        // ignore malformed
      }
    };

    const bind = (es: EventSource) => {
      es.onmessage = onMessage;
      es.onerror = () => {
        es.close();
        if (closed) return;
        if (retryTimer !== undefined) clearTimeout(retryTimer);
        const wait = retryMs;
        retryMs = Math.min(retryMs * 1.6, 20_000);
        retryTimer = setTimeout(() => {
          if (closed) return;
          source = new EventSource(url, { withCredentials: true });
          bind(source);
        }, wait);
      };
    };

    bind(source);

    return () => {
      closed = true;
      if (debounceTimer !== undefined) clearTimeout(debounceTimer);
      if (retryTimer !== undefined) clearTimeout(retryTimer);
      source.close();
    };
  }, [enabled, debounceMs]);
}
