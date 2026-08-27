import { Suspense, use, useMemo, useState, type ReactNode, Component } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { AuditFiltersPanel } from './AuditFiltersPanel';
import { AuditLogList } from './AuditLogList';
import { AuditPageHeader } from './AuditPageHeader';
import { AuditStatsCards } from './AuditStatsCards';
import type { AuditListResponse } from './auditPageShared';
import { ApiError, invalidateAuditList, loadAuditList } from './auditListLoader';

class AuditErrorBoundary extends Component<
  { children: ReactNode; fallback: (error: Error) => ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}

export function AuditPage() {
  const [actionFilter, setActionFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    invalidateAuditList(actionFilter, targetTypeFilter);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AuditPageHeader loading={false} onRefresh={handleRefresh} />

      <AuditFiltersPanel
        actionFilter={actionFilter}
        targetTypeFilter={targetTypeFilter}
        onActionFilterChange={setActionFilter}
        onTargetTypeFilterChange={setTargetTypeFilter}
      />

      <AuditErrorBoundary
        fallback={(error) => (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 p-3 text-sm dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          >
            {error instanceof ApiError
              ? `No se pudo cargar la auditoría (HTTP ${error.status}).`
              : 'No se pudo cargar la auditoría.'}
          </div>
        )}
      >
        <Suspense
          key={`${actionFilter}|${targetTypeFilter}|${refreshKey}`}
          fallback={
            <div className="text-sm text-stone-500 dark:text-stone-400" role="status" aria-live="polite">
              Cargando auditoría…
            </div>
          }
        >
          <AuditPageResults actionFilter={actionFilter} targetTypeFilter={targetTypeFilter} />
        </Suspense>
      </AuditErrorBoundary>
    </div>
  );
}

function AuditPageResults({
  actionFilter,
  targetTypeFilter,
}: {
  actionFilter: string;
  targetTypeFilter: string;
}) {
  const initial = use(loadAuditList(actionFilter, targetTypeFilter));
  const [items, setItems] = useState(initial.items);
  const [nextCursor, setNextCursor] = useState(initial.next_cursor);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (targetTypeFilter !== 'all') params.set('target_type', targetTypeFilter);
      params.set('limit', '50');
      params.set('cursor', nextCursor);
      const res = await api.get<AuditListResponse>(`/audit-logs?${params.toString()}`);
      setItems((prev) => [...prev, ...res.items]);
      setNextCursor(res.next_cursor);
    } catch {
      setError('No se pudieron cargar más registros.');
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stats = useMemo(() => {
    const byAction: Record<string, number> = {};
    for (const it of items) {
      byAction[it.action] = (byAction[it.action] ?? 0) + 1;
    }
    return byAction;
  }, [items]);

  return (
    <>
      <AuditStatsCards total={items.length} stats={stats} />

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 p-3 text-sm dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
        >
          {error}
        </div>
      )}

      <AuditLogList
        items={items}
        loading={false}
        expanded={expanded}
        onToggleExpanded={toggleExpanded}
      />

      {nextCursor && (
        <div className="flex justify-center">
          <Button type="button" variant="secondary" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? 'Cargando…' : 'Cargar más'}
          </Button>
        </div>
      )}
    </>
  );
}
