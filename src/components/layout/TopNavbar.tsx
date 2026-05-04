import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Package, Map, UserCircle2,
  Users, Bell, Search, ChevronDown, LogOut, Settings,
  Menu, X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserRole } from '../../types';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { to: '/dashboard',    icon: <LayoutDashboard size={15} />, label: 'Back Office',         roles: ['admin', 'operator'] },
  { to: '/rutas',        icon: <Truck size={15} />,           label: 'Admin. de Rutas',     roles: ['admin', 'operator', 'driver'] },
  { to: '/pedidos',      icon: <Package size={15} />,         label: 'Pedidos',             roles: ['admin', 'operator', 'driver', 'client'] },
  { to: '/clientes',     icon: <Users size={15} />,           label: 'Personas / Recepción',roles: ['admin', 'operator'] },
  { to: '/usuarios',     icon: <UserCircle2 size={15} />,     label: 'Usuarios Sistema',    roles: ['admin'] },
];

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  operator: 'Operador Logístico',
  driver: 'Repartidor',
  client: 'Cliente',
};

const roleDemoAccounts = [
  { email: 'admin@translogistica.cl',    role: 'admin'    as UserRole, name: 'Carlos Mendoza' },
  { email: 'operadora@translogistica.cl', role: 'operator' as UserRole, name: 'María González' },
  { email: 'rsoto@translogistica.cl',    role: 'driver'   as UserRole, name: 'Roberto Soto' },
  { email: 'pvargas@empresa.cl',         role: 'client'   as UserRole, name: 'Pedro Vargas' },
];

export function TopNavbar() {
  const { user, tenant, logout, switchRole } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredItems = navItems.filter(
    item => user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
          <div className="w-7 h-7 bg-primary-700 rounded-md flex items-center justify-center flex-shrink-0">
            <Map size={14} className="text-white" />
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">Rutek</p>
            {tenant && (
              <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-none truncate max-w-[100px] sm:max-w-[140px]">{tenant.name}</p>
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
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-primary-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-50">
              <div className="p-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">Notificaciones</p>
                <span className="text-[10px] text-primary-600 dark:text-primary-400 font-medium cursor-pointer">Ver todas</span>
              </div>
              <div className="p-2">
                {[
                  { msg: 'Pedido PED-2024-0001 en camino', time: 'hace 10 min', dot: 'bg-blue-500' },
                  { msg: 'Ruta RUT-2024-001 iniciada',     time: 'hace 25 min', dot: 'bg-emerald-500' },
                  { msg: 'Nuevo pedido de Ferretería',      time: 'hace 1 h',   dot: 'bg-amber-500' },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer">
                    <span className={clsx('h-2 w-2 rounded-full mt-1.5 flex-shrink-0', n.dot)} />
                    <div>
                      <p className="text-xs text-stone-700 dark:text-stone-200">{n.msg}</p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
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
            <div className="w-7 h-7 bg-primary-700 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.name.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-tight">{user ? roleLabels[user.role] : ''}</p>
            </div>
            <ChevronDown size={13} className="text-stone-400 dark:text-stone-500 hidden sm:block" aria-hidden />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Demo — Cambiar rol</p>
              </div>
              <div className="p-1.5">
                {roleDemoAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => { switchRole(account.role); setShowUserMenu(false); }}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors',
                      user?.role === account.role
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                        : 'text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'
                    )}
                  >
                    <div className="w-6 h-6 bg-stone-200 dark:bg-stone-700 rounded-full flex items-center justify-center text-xs font-bold text-stone-600 dark:text-stone-300 flex-shrink-0">
                      {account.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{account.name}</p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500">{roleLabels[account.role]}</p>
                    </div>
                    {user?.role === account.role && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-stone-100 dark:border-stone-800 p-1.5">
                <button
                  onClick={() => navigate('/configuracion')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <Settings size={14} />
                  <span className="text-xs">Configuración</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut size={14} />
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
        aria-label="Principal"
      >
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 whitespace-nowrap',
              isActive
                ? 'bg-primary-700 text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
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
                    onClick={closeMobileMenu}
                    className={({ isActive }) => clsx(
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-700 text-white'
                        : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                    )}
                  >
                    <span className="flex-shrink-0 opacity-90">{item.icon}</span>
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
