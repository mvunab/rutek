import { AlertCircle, CheckCircle2, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatTenantPlanLabel } from '../../lib/tenantPlan';

type TenantRow = {
  id: string;
  name: string;
  rut: string;
  plan: string;
  active: boolean;
  createdAt: string;
};

export function TenantsTable({
  filtered,
  loading,
  onEdit,
  onView,
  onDelete,
  onToggle,
}: {
  filtered: TenantRow[];
  loading: boolean;
  onEdit: (tenant: TenantRow) => void;
  onView: (tenantId: string) => void;
  onDelete: (tenantId: string) => void;
  onToggle: (tenantId: string, active: boolean) => void;
}) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-stone-50 dark:bg-stone-800/50">
          <tr>
            <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Tenant</th>
            <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Plan</th>
            <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Estado</th>
            <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Creado</th>
            <th className="text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
          {filtered.map((tenant) => (
            <tr key={tenant.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
              <td className="px-5 py-3.5">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{tenant.name}</p>
                <p className="text-xs text-stone-400 dark:text-stone-500">{tenant.rut}</p>
              </td>
              <td className="px-5 py-3.5">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  tenant.plan === 'enterprise' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' :
                  tenant.plan === 'professional' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                  'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
                }`}>
                  {formatTenantPlanLabel(tenant.plan)}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <button onClick={() => onToggle(tenant.id, !tenant.active)} className="flex items-center gap-1.5 text-xs">
                  {tenant.active ? (
                    <><CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /><span className="text-emerald-700 dark:text-emerald-400 font-medium">Activo</span></>
                  ) : (
                    <><AlertCircle size={14} className="text-red-600 dark:text-red-400" /><span className="text-red-700 dark:text-red-400 font-medium">Inactivo</span></>
                  )}
                </button>
              </td>
              <td className="px-5 py-3.5 text-xs text-stone-500 dark:text-stone-400">
                {new Date(tenant.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="xs" onClick={() => onEdit(tenant)} title="Editar">
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => onView(tenant.id)} title="Ver detalle">
                    <Eye size={14} />
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => onDelete(tenant.id)} title="Eliminar">
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && !loading && (
        <div className="p-8 text-center text-sm text-stone-400 dark:text-stone-500">No se encontraron tenants</div>
      )}
    </div>
  );
}
