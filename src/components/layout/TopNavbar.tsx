import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Package, Map, UserCircle2,
  Users, Bell, Search, ChevronDown, LogOut, Settings,
  Menu, X, Shield, Building2, FileClock, Car,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserRole } from '../../types';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: UserRole[];
  end?: boolean;
}

const tenantNavItems: NavItem[] = [
  { to: '/dashboard',    icon: <LayoutDashboard size={15} />, label: 'Back Office',         roles: ['admin', 'operator'] },
  { to: '/rutas',        icon: <Truck size={15} />,           label: 'Rutas',             roles: ['admin', 'operator', 'driver'] },
  { to: '/pedidos',      icon: <Package size={15} />,         label: 'Pedidos',            roles: ['client'] },
  { to: '/clientes',     icon: <Users size={15} />,           label: 'Clientes',            roles: ['admin', 'operator'] },
  { to: '/vehiculos',    icon: <Car size={15} />,             label: 'Vehículos',           roles: ['admin', 'operator'] },
  { to: '/usuarios',     icon: <UserCircle2 size={15} />,     label: 'Usuarios Sistema',    roles: ['admin'] },
];

const superAdminNavItems: NavItem[] = [
  { to: '/super-admin',          icon: <LayoutDashboard size={15} />, label: 'Resumen Global', roles: ['super_admin'], end: true },
  { to: '/super-admin/tenants',  icon: <Building2 size={15} />,       label: 'Tenants',        roles: ['super_admin'] },
  { to: '/super-admin/users',    icon: <Users size={15} />,           label: 'Usuarios',       roles: ['super_admin'] },
  { to: '/super-admin/auditoria',icon: <FileClock size={15} />,       label: 'Auditoría',      roles: ['super_admin'] },
];

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  operator: 'Operador Logístico',
  driver: 'Repartidor',
  client: 'Cliente',
};

export function TopNavbar() {
  const { user, tenant, isSuperAdmin, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const inSuperAdminContext = isSuperAdmin || pathname.startsWith('/super-admin');

  const filteredItems = useMemo(() => {
    if (!user) return [];
    const items = inSuperAdminContext ? superAdminNavItems : tenantNavItems;
    return items.filter(item => item.roles.includes(user.role));
  }, [user, inSuperAdminContext]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  const openMobileMenu = () => {
    setMobileMenuOpen(true);
    setShowUserMenu(false);
    setShowNotifications(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-sm flex-shrink-0 relative z-40">
      {/* Top strip: logo + search + user controls */}
      <div className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 h-14 border-b border-stone-100 dark:border-stone-800">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 sm:mr-2 min-w-0 flex-shrink-0">
          <div
            aria-hidden="true"
            className={clsx(
              'size-7 rounded-md flex items-center justify-center flex-shrink-0',
              inSuperAdminContext ? 'bg-violet-600' : 'bg-primary-700',
            )}
          >
            {inSuperAdminContext ? <Shield size={14} className="text-white" /> : <Map size={14} className="text-white" />}
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Rutek</p>
            {inSuperAdminContext ? (
              <p className="text-[10px] text-violet-600 dark:text-violet-400 leading-none font-semibold uppercase tracking-wider">
                Panel Global
              </p>
            ) : (
              tenant && (
                <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-none truncate max-w-[100px] sm:max-w-[140px]">{tenant.name}</p>
              )
            )}
          </div>
        </div>

        {/* Menú móvil */}
        <button
          type="button"
          onClick={() => (mobileMenuOpen ? closeMobileMenu() : openMobileMenu())}
          className="lg:hidden flex-shrink-0 p-2 rounded-lg text-stone-600 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileMenuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>

        {/* Search — oculto en móvil (está en el panel colapsable) */}
        <div className="hidden lg:block flex-1 max-w-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg">
            <Search size={13} className="text-stone-400 dark:text-stone-500 flex-shrink-0" aria-hidden />
            <input
              type="search"
              name="q"
              autoComplete="off"
              placeholder="Buscar en el sistema…"
              className="bg-transparent text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none w-full"
            />
          </div>
        </div>

        <div className="hidden lg:block flex-1" />

        {/* Notifications */}
        <div className="relative ml-auto lg:ml-0">
          <button
            type="button"
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); closeMobileMenu(); }}
            className="relative p-2 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
            aria-label="Notificaciones"
          >
            <Bell size={17} aria-hidden />
            <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-1.5 bg-primary-500 rounded-full" />
          </button>

          {showNotifications && (
            <div
              role="region"
              aria-label="Notificaciones"
              className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-50"
            >
              <div className="p-3 border-b border-stone-100 dark:border-stone-800">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">Notificaciones</p>
              </div>
              <div className="p-6 text-center" aria-live="polite">
                <p className="text-xs text-stone-400 dark:text-stone-500">Sin notificaciones</p>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); closeMobileMenu(); }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
            aria-expanded={showUserMenu}
            aria-haspopup="true"
            aria-label="Menú de usuario"
          >
            <div
              aria-hidden="true"
              className={clsx(
                'size-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0',
                inSuperAdminContext ? 'bg-violet-600' : 'bg-primary-700',
              )}
            >
              {user?.name.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-tight">{user ? roleLabels[user.role] : ''}</p>
            </div>
            <ChevronDown size={13} className="text-stone-400 dark:text-stone-500 hidden sm:block" aria-hidden />
          </button>

          {showUserMenu && user && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="px-3 py-2.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80">
                <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 truncate">{user.name}</p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">{user.email}</p>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">{roleLabels[user.role]}</p>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/configuracion');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <Settings size={14} aria-hidden="true" />
                  <span className="text-xs">Configuración</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut size={14} aria-hidden="true" />
                  <span className="text-xs">Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav tabs — solo escritorio */}
      <nav
        className="hidden lg:flex items-center gap-0.5 px-4 h-11"
        aria-label={inSuperAdminContext ? 'Panel global' : 'Principal'}
      >
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => clsx(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900',
              isActive
                ? inSuperAdminContext
                  ? 'bg-violet-600 text-white shadow-sm focus-visible:ring-violet-500'
                  : 'bg-primary-700 text-white shadow-sm focus-visible:ring-primary-500'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:ring-primary-500'
            )}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Panel móvil colapsable */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-14 z-[45] bg-stone-900/40 lg:hidden"
            aria-hidden
            tabIndex={-1}
            onClick={closeMobileMenu}
          />
          <div
            id="mobile-nav"
            role="navigation"
            aria-label="Principal"
            className="fixed top-14 left-0 right-0 z-50 max-h-[calc(100vh-3.5rem)] lg:hidden bg-white dark:bg-stone-900 shadow-xl border-t border-stone-200 dark:border-stone-800 overflow-y-auto overscroll-y-contain"
          >
            <div className="p-4 border-b border-stone-100 dark:border-stone-800">
              <label htmlFor="mobile-search" className="sr-only">Buscar en el sistema</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg">
                <Search size={15} className="text-stone-400 dark:text-stone-500 flex-shrink-0" aria-hidden />
                <input
                  id="mobile-search"
                  type="search"
                  name="q-mobile"
                  autoComplete="off"
                  placeholder="Buscar en el sistema…"
                  className="bg-transparent text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none w-full"
                />
              </div>
            </div>
            <ul className="p-2">
              {filteredItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={closeMobileMenu}
                    className={({ isActive }) => clsx(
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? inSuperAdminContext
                          ? 'bg-violet-600 text-white'
                          : 'bg-primary-700 text-white'
                        : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                    )}
                  >
                    <span className="flex-shrink-0 opacity-90" aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </header>
  );
}
