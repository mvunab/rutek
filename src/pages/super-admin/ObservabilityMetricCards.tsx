import { Activity, AlertTriangle, Database, Gauge, Server, Zap } from 'lucide-react';
import { formatUptime } from '../../lib/observability';
import type { ApiObservabilityDashboard } from '../../types/observability';
import { MetricCard } from './ObservabilityShared';

export function ObservabilityMetricCards({ data }: { data: ApiObservabilityDashboard }) {
  const dbTone =
    data.platform.database.status === 'ok'
      ? 'ok'
      : data.platform.database.status === 'degraded'
        ? 'warning'
        : 'critical';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      <MetricCard
        label="Requests (ventana)"
        value={String(data.requestTotals.totalRequests)}
        hint={`p95 ${data.requestTotals.p95Ms} ms`}
        icon={<Zap size={18} />}
        tone={data.requestTotals.p95Ms > 800 ? 'warning' : 'ok'}
      />
      <MetricCard
        label="Latencia media API"
        value={`${data.requestTotals.avgMs} ms`}
        icon={<Activity size={18} />}
        tone={data.requestTotals.avgMs > 500 ? 'warning' : 'ok'}
      />
      <MetricCard
        label="Errores HTTP"
        value={String(data.requestTotals.totalErrors)}
        icon={<AlertTriangle size={18} />}
        tone={data.requestTotals.totalErrors > 0 ? 'warning' : 'ok'}
      />
      <MetricCard
        label="Base de datos"
        value={`${data.platform.database.latencyMs} ms`}
        hint={data.platform.database.status}
        icon={<Database size={18} />}
        tone={dbTone}
      />
      <MetricCard
        label="Uptime API"
        value={formatUptime(data.platform.uptimeSeconds)}
        hint={data.platform.nodeVersion}
        icon={<Server size={18} />}
      />
      <MetricCard
        label="Memoria heap"
        value={`${data.platform.memoryMb.heapUsed} MB`}
        hint={`RSS ${data.platform.memoryMb.rss} MB`}
        icon={<Gauge size={18} />}
      />
    </div>
  );
}
