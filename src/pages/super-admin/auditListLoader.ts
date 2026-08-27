import { api, ApiError } from '../../lib/api';
import type { AuditListResponse } from './auditPageShared';

const auditListCache = new Map<string, Promise<AuditListResponse>>();

function cacheKey(actionFilter: string, targetTypeFilter: string) {
  return `${actionFilter}|${targetTypeFilter}`;
}

export function loadAuditList(
  actionFilter: string,
  targetTypeFilter: string,
): Promise<AuditListResponse> {
  const key = cacheKey(actionFilter, targetTypeFilter);
  let pending = auditListCache.get(key);
  if (!pending) {
    pending = (async () => {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (targetTypeFilter !== 'all') params.set('target_type', targetTypeFilter);
      params.set('limit', '50');
      return api.get<AuditListResponse>(`/audit-logs?${params.toString()}`);
    })().catch((err) => {
      auditListCache.delete(key);
      throw err;
    });
    auditListCache.set(key, pending);
  }
  return pending;
}

export function invalidateAuditList(actionFilter: string, targetTypeFilter: string) {
  auditListCache.delete(cacheKey(actionFilter, targetTypeFilter));
}

export { ApiError };
