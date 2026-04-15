import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useState } from 'react';
import type { UserRole } from '../../types';
import { clsx } from 'clsx';

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  operator: 'Operador Logístico',
  driver: 'Repartidor',
  client: 'Cliente',
};

const roleDemoAccounts = [
  { email: 'admin@translogistica.cl', role: 'admin' as UserRole, name: 'Carlos Mendoza' },
  { email: 'operadora@translogistica.cl', role: 'operator' as UserRole, name: 'María González' },
  { email: 'rsoto@translogistica.cl', role: 'driver' as UserRole, name: 'Roberto Soto' },
  { email: 'pvargas@empresa.cl', role: 'client' as UserRole, name: 'Pedro Vargas' },
];

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, switchRole } = useAuthStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-stone-200 flex items-center gap-4 px-6 shadow-sm">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-stone-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-stone-400 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg">
          <Search size={14} className="text-stone-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none w-40"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowRoleMenu(false); }}
            className="relative p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary-500 rounded-full" />
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-stone-200 rounded-xl shadow-xl z-50">
              <div className="p-4 border-b border-stone-100">
                <p className="text-sm font-semibold text-stone-800">Notificaciones</p>
              </div>
              <div className="p-3 space-y-1">
                {[
                  { msg: 'Pedido PED-2024-0001 en camino', time: 'hace 10 min', dot: 'bg-blue-500' },
                  { msg: 'Ruta RUT-2024-001 iniciada', time: 'hace 25 min', dot: 'bg-emerald-500' },
                  { msg: 'Nuevo pedido de Ferretería Central', time: 'hace 1 h', dot: 'bg-amber-500' },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-stone-50 cursor-pointer">
                    <span className={clsx('h-2 w-2 rounded-full mt-1.5 flex-shrink-0', n.dot)} />
                    <div>
                      <p className="text-xs text-stone-700">{n.msg}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User / Role switcher */}
        <div className="relative">
          <button
            onClick={() => { setShowRoleMenu(!showRoleMenu); setShowNotifications(false); }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {user?.name.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-stone-800 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-stone-400 leading-tight">{user ? roleLabels[user.role] : ''}</p>
            </div>
            <ChevronDown size={14} className="text-stone-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-stone-100 bg-stone-50">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Demo — Cambiar rol</p>
              </div>
              <div className="p-1.5">
                {roleDemoAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => { switchRole(account.role); setShowRoleMenu(false); }}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      user?.role === account.role
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-stone-700 hover:bg-stone-50'
                    )}
                  >
                    <div className="w-6 h-6 bg-stone-200 rounded-full flex items-center justify-center text-xs font-bold text-stone-600">
                      {account.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{account.name}</p>
                      <p className="text-[10px] text-stone-400">{roleLabels[account.role]}</p>
                    </div>
                    {user?.role === account.role && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
