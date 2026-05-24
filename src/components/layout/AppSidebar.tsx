import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Package, Map, UserCircle2,
  Users, Bell, LogOut, Settings, ChevronLeft,
  Shield, Building2, FileClock, Car, X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserRole } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import { NotificationCenter } from '../notifications/NotificationCenter';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: UserRole[];
  end?: boolean;
}

const tenantNavItems: NavItem[] = [
  { to: '/dashboard',  icon: <LayoutDashboard size={18} />, label: 'Back Office',      roles: ['admin', 'operator'] },
  { to: '/rutas',      icon: <Truck size={18} />,           label: 'Rutas',            roles: ['admin', 'operator', 'driver'] },
  { to: '/pedidos',    icon: <Package size={18} />,         label: 'Pedidos',          roles: ['client'] },
  { to: '/clientes',   icon: <Users size={18} />,           label: 'Clientes',         roles: ['admin', 'operator'] },
  { to: '/vehiculos',  icon: <Car size={18} />,             label: 'Vehículos',        roles: ['admin', 'operator'] },
  { to: '/usuarios',   icon: <UserCircle2 size={18} />,     label: 'Usuarios Sistema', roles: ['admin'] },
];

const superAdminNavItems: NavItem[] = [
  { to: '/super-admin',            icon: <LayoutDashboard size={18} />, label: 'Resumen Global', roles: ['super_admin'], end: true },
  { to: '/super-admin/tenants',    icon: <Building2 size={18} />,       label: 'Tenants',        roles: ['super_admin'] },
  { to: '/super-admin/users',      icon: <Users size={18} />,           label: 'Usuarios',       roles: ['super_admin'] },
  { to: '/super-admin/auditoria',  icon: <FileClock size={18} />,       label: 'Auditoría',      roles: ['super_admin'] },
];

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  operator: 'Operador Logístico',
  driver: 'Repartidor',
  peoneta: 'Peoneta',
  client: 'Cliente',
};

export interface AppSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/** Tooltip flotante para el sidebar colapsado (CSS puro, accesible por hover) */
function CollapsedTooltip({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      role="tooltip"
      className={clsx(
        'absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60]',
        'px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap',
        'bg-stone-800 dark:bg-stone-700 text-white shadow-lg',
        'pointer-events-none select-none',
        'opacity-0 group-hover/item:opacity-100',
        'transition-opacity duration-100',
      )}
    >
      {label}
    </span>
  );
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const { user, tenant, isSuperAdmin, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useToastStore((s) => s.unreadCount());

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; }
    catch { return false; }
  });

  const inSuperAdmin = isSuperAdmin || pathname.startsWith('/super-admin');

  const filteredItems = useMemo(() => {
    if (!user) return [];
    const items = inSuperAdmin ? superAdminNavItems : tenantNavItems;
    return items.filter(item => item.roles.includes(user.role));
  }, [user, inSuperAdmin]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('sidebar-collapsed', String(next)); } catch { /* ignore */ }
  };

  useEffect(() => { onMobileClose(); }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onMobileClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, onMobileClose]);

  const accentBg = inSuperAdmin ? 'bg-violet-600' : 'bg-primary-700';
  const activeItemCls = inSuperAdmin
    ? 'bg-violet-600 text-white shadow-sm'
    : 'bg-primary-700 text-white shadow-sm';

  const renderNav = (isMobile: boolean) => {
    const showLabels = isMobile || !collapsed;

    return (
      <>
        {/* ── Logo header ── */}
        <div
          className={clsx(
            'flex items-center h-14 flex-shrink-0 border-b border-stone-100 dark:border-stone-800',
            showLabels ? 'px-4' : 'px-0 justify-center',
          )}
        >
          {showLabels && (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={clsx('size-7 rounded-md flex items-center justify-center flex-shrink-0', accentBg)}
                aria-hidden="true"
              >
                {inSuperAdmin
                  ? <Shield size={14} className="text-white" />
                  : <Map size={14} className="text-white" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Rutek</p>
                {inSuperAdmin
                  ? <p className="text-[10px] text-violet-600 dark:text-violet-400 leading-none font-semibold uppercase tracking-wider">Panel Global</p>
                  : tenant && <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-none truncate">{tenant.name}</p>}
              </div>
            </div>
          )}

          {/* Collapsed desktop: logo icon duplica como botón expandir */}
          {!showLabels && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className={clsx('size-7 rounded-md flex items-center justify-center', accentBg)}
              aria-label="Expandir menú lateral"
              aria-expanded="false"
            >
              {inSuperAdmin ? <Shield size={14} className="text-white" /> : <Map size={14} className="text-white" />}
            </button>
          )}

          {/* Botón colapsar (expandido desktop) */}
          {showLabels && !isMobile && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Colapsar menú lateral"
              aria-expanded="true"
              className="ml-auto p-1.5 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <ChevronLeft size={14} aria-hidden="true" />
            </button>
          )}

          {/* Botón cerrar (móvil) */}
          {isMobile && (
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Cerrar menú"
              className="ml-auto p-1.5 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* ── Nav principal ── */}
        <nav
          aria-label={inSuperAdmin ? 'Panel global' : 'Principal'}
          className="flex-1 py-2 px-2 overflow-y-auto"
        >
          <ul className="space-y-0.5" role="list">
            {filteredItems.map((item) => (
              <li key={item.to} className="relative group/item">
                <NavLink
                  to={item.to}
                  end={item.end}
                  aria-label={!showLabels ? item.label : undefined}
                  className={({ isActive }) => clsx(
                    'flex items-center rounded-lg text-sm font-medium',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
                    showLabels ? 'gap-3 px-3 py-2.5' : 'justify-center py-3',
                    isActive
                      ? activeItemCls
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800',
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden="true"
                        className={clsx(
                          'flex-shrink-0 transition-colors duration-150',
                          !isActive && 'text-stone-400 dark:text-stone-500',
                        )}
                      >
                        {item.icon}
                      </span>
                      {showLabels && (
                        <span
                          className={clsx(
                            'truncate transition-opacity duration-150',
                            collapsed ? 'opacity-0' : 'opacity-100 delay-100',
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>

                {/* Tooltip CSS (solo desktop colapsado) */}
                {!isMobile && collapsed && <CollapsedTooltip label={item.label} />}
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 border-t border-stone-100 dark:border-stone-800">
          {/* Notificaciones */}
          <ul className="p-2 space-y-0.5" role="list">
            <li className="relative group/item">
              <button
                type="button"
                aria-label={unreadCount > 0 ? `Notificaciones — ${unreadCount} sin leer` : 'Notificaciones'}
                onClick={() => setNotifOpen(true)}
                className={clsx(
                  'w-full flex items-center rounded-lg text-sm font-medium',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
                  'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800',
                  showLabels ? 'gap-3 px-3 py-2.5' : 'justify-center py-3',
                )}
              >
                <span className="relative flex-shrink-0" aria-hidden="true">
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold tabular-nums">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
                {showLabels && (
                  <span className={clsx('flex-1 transition-opacity duration-150', collapsed ? 'opacity-0' : 'opacity-100 delay-100')}>
                    Notificaciones
                  </span>
                )}
                {showLabels && unreadCount > 0 && !collapsed && (
                  <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold tabular-nums">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {!isMobile && collapsed && <CollapsedTooltip label="Notificaciones" />}
            </li>

            <li className="relative group/item">
              <NavLink
                to="/configuracion"
                aria-label={!showLabels ? 'Configuración' : undefined}
                className={({ isActive }) => clsx(
                  'flex items-center rounded-lg text-sm font-medium',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
                  showLabels ? 'gap-3 px-3 py-2.5' : 'justify-center py-3',
                  isActive
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800',
                )}
              >
                <Settings size={18} className="flex-shrink-0" aria-hidden="true" />
                {showLabels && (
                  <span className={clsx('truncate transition-opacity duration-150', collapsed ? 'opacity-0' : 'opacity-100 delay-100')}>
                    Configuración
                  </span>
                )}
              </NavLink>
              {!isMobile && collapsed && <CollapsedTooltip label="Configuración" />}
            </li>
          </ul>

          {/* Usuario + logout */}
          <div className={clsx(
            'border-t border-stone-100 dark:border-stone-800',
            showLabels ? 'p-3' : 'p-2',
          )}>
            {showLabels && user ? (
              <div className="flex items-center gap-2.5">
                <div
                  aria-hidden="true"
                  className={clsx(
                    'size-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
                    inSuperAdmin ? 'bg-violet-600' : 'bg-primary-700',
                  )}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 truncate">{user.name}</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate">{roleLabels[user.role]}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                  className="p-1.5 rounded-md text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <LogOut size={14} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="relative group/item flex justify-center">
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                  className="p-2.5 rounded-lg text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <LogOut size={18} aria-hidden="true" />
                </button>
                {!isMobile && <CollapsedTooltip label="Cerrar sesión" />}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col h-full flex-shrink-0 overflow-hidden',
          'bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800',
          'transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-[68px]' : 'w-60',
        )}
      >
        {renderNav(false)}
      </aside>

      {/* ── Overlay móvil ── */}
      <div
        className={clsx(
          'fixed inset-0 z-40 lg:hidden',
          'bg-stone-900/50 backdrop-blur-[2px]',
          'transition-opacity duration-200',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden="true"
        onClick={onMobileClose}
      />

      {/* ── Drawer móvil ── */}
      <aside
        id="mobile-sidebar"
        aria-label="Menú lateral"
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden',
          'bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800',
          'transition-transform duration-200',
          mobileOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in',
        )}
      >
        {renderNav(true)}
      </aside>

      {/* ── Centro de notificaciones ── */}
      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
