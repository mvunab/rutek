import { Building2 } from 'lucide-react';

type TenantInfo = {
  name: string;
  rut: string;
  active: boolean;
  plan: string;
  city?: string | null;
  region?: string | null;
  email?: string | null;
  phone?: string | null;
};

export function TenantDetailHeader({ tenant }: { tenant: TenantInfo }) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="size-10 bg-violet-50 dark:bg-violet-950/30 rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">{tenant.name}</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">{tenant.rut}</p>
          </div>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
          tenant.active
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
        }`}>
          {tenant.active ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
          <p className="text-xs text-stone-400 mb-1">Plan</p>
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 capitalize">{tenant.plan}</p>
        </div>
        <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
          <p className="text-xs text-stone-400 mb-1">Ciudad</p>
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{tenant.city || tenant.region || '—'}</p>
        </div>
        <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
          <p className="text-xs text-stone-400 mb-1">Email contacto</p>
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{tenant.email || '—'}</p>
        </div>
        <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
          <p className="text-xs text-stone-400 mb-1">Teléfono</p>
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{tenant.phone || '—'}</p>
        </div>
      </div>
    </div>
  );
}
