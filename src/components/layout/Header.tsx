import { Bell, Search, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserRole } from '../../types';

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  operator: 'Operador Logístico',
  driver: 'Repartidor',
  client: 'Cliente',
};

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-stone-200 flex items-center gap-4 px-6 shadow-sm">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-stone-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-stone-400 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg">
          <Search size={14} className="text-stone-400" aria-hidden="true" />
          <label htmlFor="header-search" className="sr-only">
            Buscar
          </label>
          <input
            id="header-search"
            type="search"
            name="q"
            autoComplete="off"
            placeholder="Buscar…"
            className="bg-transparent text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none w-40"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            aria-label="Notificaciones"
          >
            <Bell size={18} aria-hidden="true" />
          </button>
          {showNotifications && (
            <div
              role="region"
              aria-label="Notificaciones"
              className="absolute right-0 top-full mt-2 w-72 bg-white border border-stone-200 rounded-xl shadow-xl z-50"
            >
              <div className="p-4 border-b border-stone-100">
                <p className="text-sm font-semibold text-stone-800">Notificaciones</p>
              </div>
              <div className="p-6 text-center" aria-live="polite">
                <p className="text-xs text-stone-400">Sin notificaciones</p>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            aria-expanded={showUserMenu}
            aria-haspopup="menu"
            aria-label="Menú de usuario"
          >
            <div aria-hidden="true" className="size-7 bg-primary-600 rounded-full flex items-center justify-center text-xs font-semibold text-white">
              {user?.name.charAt(0) ?? '?'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-stone-800 leading-tight">
                {user?.name ?? '—'}
              </p>
              <p className="text-[10px] text-stone-400 leading-tight">
                {user ? roleLabels[user.role] : ''}
              </p>
            </div>
            <ChevronDown size={14} className="text-stone-400" aria-hidden="true" />
          </button>

          {showUserMenu && user && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="px-3 py-2.5 border-b border-stone-100 bg-stone-50">
                <p className="text-xs font-semibold text-stone-700 truncate">{user.name}</p>
                <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/configuracion');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  <Settings size={14} aria-hidden="true" />
                  <span className="text-xs">Configuración</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} aria-hidden="true" />
                  <span className="text-xs">Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
