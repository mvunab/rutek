import { useState } from 'react';
import { Search, Shield, Truck, Users, Building2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { mockUsers } from '../../data/mockData';
import type { UserRole } from '../../types';
import { clsx } from 'clsx';

const roleConfig: Record<UserRole, { label: string; color: string; card: string; icon: React.ReactNode; description: string }> = {
  admin: {
    label: 'Administrador',
    color: 'bg-blue-50 text-blue-700 border border-blue-200',
    card: 'bg-blue-50 border-blue-200',
    icon: <Shield size={14} />,
    description: 'Acceso total al sistema',
  },
  operator: {
    label: 'Operador Logístico',
    color: 'bg-violet-50 text-violet-700 border border-violet-200',
    card: 'bg-violet-50 border-violet-200',
    icon: <Building2 size={14} />,
    description: 'Gestiona pedidos y rutas',
  },
  driver: {
    label: 'Repartidor',
    color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    card: 'bg-emerald-50 border-emerald-200',
    icon: <Truck size={14} />,
    description: 'Ejecuta entregas',
  },
  client: {
    label: 'Cliente',
    color: 'bg-amber-50 text-amber-700 border border-amber-200',
    card: 'bg-amber-50 border-amber-200',
    icon: <Users size={14} />,
    description: 'Consulta sus pedidos',
  },
};

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const filtered = mockUsers.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    const term = search.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'admin', 'operator', 'driver', 'client'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                roleFilter === r
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
              )}
            >
              {r === 'all' ? 'Todos' : roleConfig[r].label}
            </button>
          ))}
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.entries(roleConfig) as [UserRole, typeof roleConfig[UserRole]][]).map(([role, config]) => {
          const count = mockUsers.filter(u => u.role === role).length;
          return (
            <div
              key={role}
              onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
              className={clsx(
                'p-4 rounded-xl border text-center cursor-pointer transition-all shadow-sm hover:shadow-md',
                roleFilter === role ? config.card : 'bg-white border-stone-200 hover:border-stone-300'
              )}
            >
              <div className="flex items-center justify-center gap-1.5 mb-2 text-stone-600">
                {config.icon}
                <span className="text-xs font-semibold">{config.label}</span>
              </div>
              <p className="text-2xl font-bold text-stone-900">{count}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{config.description}</p>
            </div>
          );
        })}
      </div>

      {/* Users grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((user) => {
          const config = roleConfig[user.role];
          return (
            <div key={user.id} className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-300 hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-800 truncate">{user.name}</p>
                  <p className="text-xs text-stone-400 truncate">{user.email}</p>
                </div>
                <Badge variant={user.active ? 'success' : 'slate'}>
                  {user.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <div className={clsx('flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium', config.color)}>
                {config.icon}
                {config.label}
                <span className="ml-auto text-[10px] opacity-60">{config.description}</span>
              </div>

              {user.phone && (
                <p className="mt-3 text-xs text-stone-400">📞 {user.phone}</p>
              )}
              <p className="mt-1.5 text-xs text-stone-300">Desde {user.createdAt}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
