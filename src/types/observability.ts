export interface ObservabilityModule {
  module: string;
  label: string;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  isBottleneck: boolean;
  severity: 'ok' | 'warning' | 'critical';
}

export interface LoadScoreBreakdown {
  operational: number;
  performanceStress: number;
  fromOrders7d: number;
  fromRoutes7d: number;
  fromApiRequests: number;
  fromHistory: number;
  fromLatency: number;
  fromErrors: number;
}

export const LOAD_THRESHOLDS = {
  high: 85,
  moderate: 45,
} as const;

export interface ObservabilityTenant {
  id: string;
  name: string;
  plan: string;
  active: boolean;
  userCount: number;
  clientCount: number;
  orderCount: number;
  routeCount: number;
  vehicleCount: number;
  ordersLast7d: number;
  routesLast7d: number;
  lastActivityAt: string | null;
  apiRequests15m: number;
  apiAvgMs: number;
  apiErrors15m: number;
  loadScore: number;
  loadBreakdown: LoadScoreBreakdown;
  healthStatus: 'healthy' | 'moderate' | 'high_load' | 'inactive' | 'dormant';
}

export interface ApiObservabilityDashboard {
  generatedAt: string;
  platform: {
    uptimeSeconds: number;
    memoryMb: { rss: number; heapUsed: number; heapTotal: number };
    database: { status: 'ok' | 'degraded' | 'down'; latencyMs: number };
    nodeVersion: string;
  };
  requestTotals: {
    windowMinutes: number;
    totalRequests: number;
    totalErrors: number;
    avgMs: number;
    p95Ms: number;
  };
  modules: ObservabilityModule[];
  bottlenecks: ObservabilityModule[];
  slowEndpoints: {
    method: string;
    module: string;
    label: string;
    requestCount: number;
    avgMs: number;
    p95Ms: number;
    maxMs: number;
  }[];
  tenants: ObservabilityTenant[];
  summary: {
    tenantCount: number;
    activeTenants: number;
    highLoadTenants: number;
    moduleCount: number;
    bottleneckCount: number;
    criticalModules: number;
  };
}
