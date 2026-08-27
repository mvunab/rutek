import { NavLink } from 'react-router-dom';
import {
  Map, Shield, ChevronLeft, X, Bell, Settings, LogOut,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Tenant, User } from '../../types';
import { NAV_TOUR_TARGET_ATTR } from '../../lib/navTour';
import { roleLabels, type NavItem } from './appSidebarNavItems';

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

export interface AppSidebarContentProps {
  isMobile: boolean;
  showLabels: boolean;
  collapsed: boolean;
  inSuperAdmin: boolean;
  accentBg: string;
  activeItemCls: string;
  activeIconCls: string;
  filteredItems: NavItem[];
  user: User | null;
  tenant: Tenant | null;
  unreadCount: number;
  onToggleCollapsed: () => void;
  onMobileClose: () => void;
  onLogout: () => void;
  onOpenNotifications: () => void;
}

export function AppSidebarContent({
  isMobile,
  showLabels,
  collapsed,
  inSuperAdmin,
  accentBg,
  activeItemCls,
  activeIconCls,
  filteredItems,
  user,
  tenant,
  unreadCount,
  onToggleCollapsed,
  onMobileClose,
  onLogout,
  onOpenNotifications,
}: AppSidebarContentProps) {
  return (
    <>
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

        {!showLabels && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={clsx('size-7 rounded-md flex items-center justify-center', accentBg)}
            aria-label="Expandir menú lateral"
            aria-expanded="false"
          >
            {inSuperAdmin ? <Shield size={14} className="text-white" /> : <Map size={14} className="text-white" />}
          </button>
        )}

        {showLabels && !isMobile && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Colapsar menú lateral"
            aria-expanded="true"
            className="ml-auto p-1.5 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
        )}

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
                {...{ [NAV_TOUR_TARGET_ATTR]: item.to }}
                aria-label={!showLabels ? item.label : undefined}
                className={({ isActive }) => clsx(
                  'flex items-center rounded-lg text-sm font-medium',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
                  showLabels ? 'gap-3 px-3 py-2.5' : 'justify-center py-3',
                  isActive
                    ? activeItemCls
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-surface-hover dark:hover:bg-stone-800',
                )}
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={clsx(
                        'flex-shrink-0 transition-colors duration-150',
                        isActive ? activeIconCls : 'text-stone-400 dark:text-stone-500',
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

              {!isMobile && collapsed && <CollapsedTooltip label={item.label} />}
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex-shrink-0 border-t border-stone-100 dark:border-stone-800">
        <ul className="p-2 space-y-0.5" role="list">
          <li className="relative group/item">
            <button
              type="button"
              {...{ [NAV_TOUR_TARGET_ATTR]: 'notifications' }}
              aria-label={unreadCount > 0 ? `Notificaciones — ${unreadCount} sin leer` : 'Notificaciones'}
              onClick={onOpenNotifications}
              className={clsx(
                'w-full flex items-center rounded-lg text-sm font-medium',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
                'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-surface-hover dark:hover:bg-stone-800',
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
              {...{ [NAV_TOUR_TARGET_ATTR]: '/configuracion' }}
              aria-label={!showLabels ? 'Configuración' : undefined}
              className={({ isActive }) => clsx(
                'flex items-center rounded-lg text-sm font-medium',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
                showLabels ? 'gap-3 px-3 py-2.5' : 'justify-center py-3',
                isActive
                  ? 'bg-surface-muted text-stone-900 dark:bg-stone-800 dark:text-stone-100'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-surface-hover dark:hover:bg-stone-800',
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
                onClick={onLogout}
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
                onClick={onLogout}
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
}
