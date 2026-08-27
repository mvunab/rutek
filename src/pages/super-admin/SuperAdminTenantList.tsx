import {
  ArrowUpRight, Building2, CheckCircle2, Eye, Minus, Pencil, Plus,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatTenantPlanLabel } from '../../lib/tenantPlan';

type Tenant = {
  id: string;
  name: string;
  rut: string;
  plan: string;
  active: boolean;
  city?: string | null;
};

type TenantActivity = {
  id: string;
  user_count?: number;
  order_count?: number;
  route_count?: number;
};

export function SuperAdminTenantList({
  filtered,
  tenantActivity,
  onNavigate,
  onToggleActive,
  onCreateClick,
}: {
  filtered: Tenant[];
  tenantActivity: TenantActivity[];
  onNavigate: (path: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onCreateClick: () => void;
}) {
  return (
    <div className="lg:col-span-3">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Tenants ({filtered.length})</h2>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Todas las empresas de la plataforma</p>
          </div>
          <Button variant="ghost" size="xs" onClick={() => onNavigate('/super-admin/tenants')}>
            Ir a gestión completa <ArrowUpRight size={12} />
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 size={40} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
            <p className="text-sm text-stone-500 dark:text-stone-400">No se encontraron tenants</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={onCreateClick}>
              <Plus size={14} /> Crear el primero
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filtered.map((tenant) => {
              const activity = tenantActivity.find((ta) => ta.id === tenant.id);
              const userCount = activity?.user_count || 0;
              const orderCount = activity?.order_count || 0;
              const routeCount = activity?.route_count || 0;

              return (
                <div key={tenant.id} className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    tenant.active
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                  }`}>
                    <Building2 size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{tenant.name}</p>
                      {tenant.active ? (
                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full font-medium">Activo</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded-full font-medium">Inactivo</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-stone-400 dark:text-stone-500">{tenant.rut}</span>
                      <span className="text-xs text-stone-300 dark:text-stone-600">·</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${
                        tenant.plan === 'enterprise' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' :
                        tenant.plan === 'professional' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                        'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
                      }`}>{formatTenantPlanLabel(tenant.plan)}</span>
                      {tenant.city && (
                        <>
                          <span className="text-xs text-stone-300 dark:text-stone-600">·</span>
                          <span className="text-xs text-stone-400">{tenant.city}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-center flex-shrink-0">
                    <div>
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{userCount}</p>
                      <p className="text-[10px] text-stone-400">Usuarios</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{orderCount}</p>
                      <p className="text-[10px] text-stone-400">Pedidos</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{routeCount}</p>
                      <p className="text-[10px] text-stone-400">Rutas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="xs" onClick={() => onNavigate(`/super-admin/tenants/${tenant.id}`)} title="Ver detalle">
                      <Eye size={14} />
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => onNavigate('/super-admin/tenants')} title="Editar">
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onToggleActive(tenant.id, !tenant.active)}
                      title={tenant.active ? 'Desactivar' : 'Activar'}
                    >
                      {tenant.active ? <Minus size={14} className="text-amber-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
