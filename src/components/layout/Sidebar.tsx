import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, Map, Truck, LogOut,
  ChevronLeft, ChevronRight, Settings, UserCircle, Building2,
  Shield, Globe
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserRole } from '../../types';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', roles: ['admin', 'operator'] },
  { to: '/clientes', icon: <Users size={18} />, label: 'Clientes', roles: ['admin', 'operator'] },
  { to: '/pedidos', icon: <Package size={18} />, label: 'Pedidos', roles: ['admin', 'operator', 'driver', 'client'] },
  { to: '/rutas', icon: <Map size={18} />, label: 'Rutas', roles: ['admin', 'operator', 'driver'] },
  { to: '/usuarios', icon: <UserCircle size={18} />, label: 'Usuarios', roles: ['admin'] },
];

const superAdminNavItems = [
  { to: '/super-admin', icon: <Globe size={18} />, label: 'Dashboard Global' },
  { to: '/super-admin/tenants', icon: <Building2 size={18} />, label: 'Tenants' },
  { to: '/super-admin/users', icon: <Shield size={18} />, label: 'Usuarios Globales' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, tenant, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(
    item => user && item.roles.includes(user.role)
  );

  return (
    <aside className={clsx(
      'flex flex-col h-full bg-white border-r border-stone-200 transition-all duration-300',
      collapsed ? 'w-[72px]' : 'w-60'
    )}>
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-stone-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <Truck size={16} className="text-white" aria-hidden="true" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 truncate">Rutek</p>
              <p className="text-xs text-stone-400 truncate">Logística SaaS</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Tenant info */}
      {!collapsed && tenant && (
        <div className="px-4 py-3 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <Building2 size={13} className="text-stone-400 flex-shrink-0" />
            <p className="text-xs text-stone-600 truncate font-medium">{tenant.name}</p>
          </div>
          <span className="ml-5 text-[10px] font-semibold text-primary-600 uppercase tracking-wide">
            {tenant.plan}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
              isActive
                ? 'bg-primary-50 text-primary-700 border border-primary-100'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            )}
          >
            {({ isActive }) => (
              <>
                <span className={clsx(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-primary-600' : 'text-stone-400 group-hover:text-stone-600'
                )}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Super Admin Nav */}
      {user?.role === 'super_admin' && (
        <>
          <div className="px-4 py-2 border-t border-stone-100">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Super Admin</p>
          </div>
          <nav className="py-1 px-2 space-y-0.5 overflow-y-auto">
            {superAdminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-violet-50 text-violet-700 border border-violet-100'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                )}
              >
                {({ isActive }) => (
                  <>
                    <span className={clsx(
                      'flex-shrink-0 transition-colors',
                      isActive ? 'text-violet-600' : 'text-stone-400 group-hover:text-stone-600'
                    )}>
                      {item.icon}
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </>
      )}

      {/* Footer */}
      <div className="border-t border-stone-100 p-3 space-y-0.5">
        {!collapsed && user && (
          <div className="px-3 py-2.5 mb-1">
            <p className="text-sm font-semibold text-stone-800 truncate">{user.name}</p>
            <p className="text-xs text-stone-400 truncate">{user.email}</p>
          </div>
        )}
        <NavLink
          to="/configuracion"
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            isActive
              ? 'bg-stone-100 text-stone-800'
              : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
          )}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && 'Configuración'}
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  );
}
