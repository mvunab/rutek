import {
  Clock, Filter, Gauge, Package, Plus, Shield, TrendingUp, Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

type Stats = {
  total_users?: number;
  tenants_by_plan?: Record<string, number>;
  recent_orders?: Array<{ code?: string; status?: string; created_at?: string }>;
};

export function SuperAdminSidebar({
  stats,
  usersByRole,
  onNavigate,
  onCreateClick,
}: {
  stats: Stats | null;
  usersByRole: Record<string, number>;
  onNavigate: (path: string) => void;
  onCreateClick: () => void;
}) {
  return (
    <div className="space-y-4">
      {Object.keys(usersByRole).length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-violet-600 dark:text-violet-400" />
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Usuarios por rol</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(usersByRole).map(([role, count]) => {
              const total = stats?.total_users || 1;
              const pct = Math.round((Number(count) / total) * 100);
              const colors: Record<string, string> = {
                super_admin: 'bg-violet-500',
                admin: 'bg-blue-500',
                operator: 'bg-amber-500',
                driver: 'bg-emerald-500',
                client: 'bg-rose-500',
              };
              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-stone-500 capitalize">{role}</span>
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">{count}</span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${colors[role] || 'bg-stone-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats?.tenants_by_plan && Object.keys(stats.tenants_by_plan).length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Suscripciones</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(stats.tenants_by_plan).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-xs capitalize text-stone-500 dark:text-stone-400">{plan}</span>
                <span className="text-sm font-bold text-stone-900 dark:text-stone-100">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-3">Acciones</h3>
        <div className="space-y-2">
          <Button fullWidth variant="primary" onClick={onCreateClick} icon={<Plus size={14} />}>
            Nuevo Tenant
          </Button>
          <Button fullWidth variant="secondary" onClick={() => onNavigate('/super-admin/users')} icon={<Users size={14} />}>
            Usuarios Globales
          </Button>
          <Button fullWidth variant="ghost" onClick={() => onNavigate('/super-admin/observabilidad')} icon={<Gauge size={14} />}>
            Observabilidad
          </Button>
          <Button fullWidth variant="ghost" onClick={() => onNavigate('/super-admin/tenants')} icon={<Filter size={14} />}>
            Gestión Completa
          </Button>
        </div>
      </div>

      {stats?.recent_orders && stats.recent_orders.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Actividad</h3>
          </div>
          <div className="space-y-2">
            {stats.recent_orders.slice(0, 4).map((o) => (
              <div key={`${o.code ?? 'order'}-${o.created_at ?? o.status ?? ''}`} className="flex items-center gap-2 py-1">
                <Package size={14} className="text-amber-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-stone-700 dark:text-stone-200 truncate">{o.code || 'Pedido'}</p>
                  <p className="text-[10px] text-stone-400 capitalize">{o.status} · {new Date(o.created_at!).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
