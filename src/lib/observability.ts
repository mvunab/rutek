import type { ApiObservabilityDashboard, LoadScoreBreakdown } from '../types/observability';

function num(raw: unknown, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function str(raw: unknown, fallback = ''): string {
  return raw != null ? String(raw) : fallback;
}

function mapModule(raw: Record<string, unknown>) {
  return {
    module: str(raw.module),
    label: str(raw.label, str(raw.module)),
    requestCount: num(raw.request_count),
    errorCount: num(raw.error_count),
    errorRate: num(raw.error_rate),
    avgMs: num(raw.avg_ms),
    p95Ms: num(raw.p95_ms),
    maxMs: num(raw.max_ms),
    isBottleneck: Boolean(raw.is_bottleneck),
    severity: (['ok', 'warning', 'critical'].includes(String(raw.severity))
      ? String(raw.severity)
      : 'ok') as 'ok' | 'warning' | 'critical',
  };
}

function mapLoadBreakdown(raw: unknown): LoadScoreBreakdown {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    operational: num(o.operational),
    performanceStress: num(o.performance_stress),
    fromOrders7d: num(o.from_orders_7d),
    fromRoutes7d: num(o.from_routes_7d),
    fromApiRequests: num(o.from_api_requests),
    fromHistory: num(o.from_history),
    fromLatency: num(o.from_latency),
    fromErrors: num(o.from_errors),
  };
}

function mapTenant(raw: Record<string, unknown>) {
  return {
    id: str(raw.id),
    name: str(raw.name),
    plan: str(raw.plan),
    active: Boolean(raw.active),
    userCount: num(raw.user_count),
    clientCount: num(raw.client_count),
    orderCount: num(raw.order_count),
    routeCount: num(raw.route_count),
    vehicleCount: num(raw.vehicle_count),
    ordersLast7d: num(raw.orders_last_7d),
    routesLast7d: num(raw.routes_last_7d),
    lastActivityAt: raw.last_activity_at != null ? str(raw.last_activity_at) : null,
    apiRequests15m: num(raw.api_requests_15m),
    apiAvgMs: num(raw.api_avg_ms),
    apiErrors15m: num(raw.api_errors_15m),
    loadScore: num(raw.load_score),
    loadBreakdown: mapLoadBreakdown(raw.load_breakdown),
    healthStatus: str(raw.health_status, 'healthy') as ApiObservabilityDashboard['tenants'][0]['healthStatus'],
  };
}

export function normalizeObservabilityDashboard(raw: Record<string, unknown>): ApiObservabilityDashboard {
  const platform =
    raw.platform && typeof raw.platform === 'object'
      ? (raw.platform as Record<string, unknown>)
      : {};
  const db =
    platform.database && typeof platform.database === 'object'
      ? (platform.database as Record<string, unknown>)
      : {};
  const mem =
    platform.memory_mb && typeof platform.memory_mb === 'object'
      ? (platform.memory_mb as Record<string, unknown>)
      : {};
  const totals =
    raw.request_totals && typeof raw.request_totals === 'object'
      ? (raw.request_totals as Record<string, unknown>)
      : {};
  const summary =
    raw.summary && typeof raw.summary === 'object'
      ? (raw.summary as Record<string, unknown>)
      : {};

  const modulesRaw = Array.isArray(raw.modules) ? raw.modules : [];
  const bottlenecksRaw = Array.isArray(raw.bottlenecks) ? raw.bottlenecks : [];
  const slowRaw = Array.isArray(raw.slow_endpoints) ? raw.slow_endpoints : [];
  const tenantsRaw = Array.isArray(raw.tenants) ? raw.tenants : [];

  return {
    generatedAt: str(raw.generated_at, new Date().toISOString()),
    platform: {
      uptimeSeconds: num(platform.uptime_seconds),
      memoryMb: {
        rss: num(mem.rss),
        heapUsed: num(mem.heap_used),
        heapTotal: num(mem.heap_total),
      },
      database: {
        status: (['ok', 'degraded', 'down'].includes(String(db.status))
          ? String(db.status)
          : 'ok') as 'ok' | 'degraded' | 'down',
        latencyMs: num(db.latency_ms),
      },
      nodeVersion: str(platform.node_version),
    },
    requestTotals: {
      windowMinutes: num(totals.window_minutes, 15),
      totalRequests: num(totals.total_requests),
      totalErrors: num(totals.total_errors),
      avgMs: num(totals.avg_ms),
      p95Ms: num(totals.p95_ms),
    },
    modules: modulesRaw
      .filter((m): m is Record<string, unknown> => Boolean(m && typeof m === 'object'))
      .map(mapModule),
    bottlenecks: bottlenecksRaw
      .filter((m): m is Record<string, unknown> => Boolean(m && typeof m === 'object'))
      .map(mapModule),
    slowEndpoints: slowRaw
      .filter((m): m is Record<string, unknown> => Boolean(m && typeof m === 'object'))
      .map((row) => ({
        method: str(row.method),
        module: str(row.module),
        label: str(row.label, str(row.module)),
        requestCount: num(row.request_count),
        avgMs: num(row.avg_ms),
        p95Ms: num(row.p95_ms),
        maxMs: num(row.max_ms),
      })),
    tenants: tenantsRaw
      .filter((m): m is Record<string, unknown> => Boolean(m && typeof m === 'object'))
      .map(mapTenant),
    summary: {
      tenantCount: num(summary.tenant_count),
      activeTenants: num(summary.active_tenants),
      highLoadTenants: num(summary.high_load_tenants),
      moduleCount: num(summary.module_count),
      bottleneckCount: num(summary.bottleneck_count),
      criticalModules: num(summary.critical_modules),
    },
  };
}

export function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function tenantHealthLabel(status: ApiObservabilityDashboard['tenants'][0]['healthStatus']): string {
  const labels: Record<string, string> = {
    healthy: 'Saludable',
    moderate: 'Carga moderada',
    high_load: 'Alta carga',
    inactive: 'Inactivo',
    dormant: 'Sin actividad',
  };
  return labels[status] ?? status;
}

export function loadScoreTooltip(b: LoadScoreBreakdown): string {
  const lines = [
    `Operacional: ${b.operational} pts (máx. 70)`,
    `  · Pedidos 7d: ${b.fromOrders7d}`,
    `  · Rutas 7d: ${b.fromRoutes7d}`,
    `  · API 15m: ${b.fromApiRequests}`,
    `  · Histórico: ${b.fromHistory}`,
    `Estrés performance: ${b.performanceStress} pts (máx. 30)`,
    `  · Latencia: ${b.fromLatency}`,
    `  · Errores: ${b.fromErrors}`,
  ];
  return lines.join('\n');
}

export function severityLabel(severity: 'ok' | 'warning' | 'critical'): string {
  if (severity === 'critical') return 'Crítico';
  if (severity === 'warning') return 'Atención';
  return 'Normal';
}
