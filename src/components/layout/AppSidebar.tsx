import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { isValuationModuleEnabled } from '../../lib/valuationModule';
import { isOrdersMapModuleEnabled } from '../../lib/ordersMapModule';
import { superAdminNavItems, tenantNavItems } from './appSidebarNavItems';
import { AppSidebarContent } from './AppSidebarContent';

export interface AppSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  /** Expande el sidebar durante el tour guiado */
  tourForceExpanded?: boolean;
}

export function AppSidebar({ mobileOpen, onMobileClose, tourForceExpanded = false }: AppSidebarProps) {
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
    return items.filter((item) => {
      if (!item.roles.includes(user.role)) return false;
      if (item.to === '/valorizacion' && !isValuationModuleEnabled(tenant)) {
        return false;
      }
      if (item.to === '/mapa-pedidos' && !isOrdersMapModuleEnabled(tenant)) {
        return false;
      }
      return true;
    });
  }, [user, inSuperAdmin, tenant]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('sidebar-collapsed', String(next)); } catch { /* ignore */ }
  };

  const onMobileCloseEvent = useEffectEvent(onMobileClose);

  useEffect(() => { onMobileCloseEvent(); }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onMobileCloseEvent(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const accentBg = inSuperAdmin ? 'bg-violet-600' : 'bg-primary-700';
  const activeItemCls = inSuperAdmin
    ? 'bg-violet-50 text-violet-900 dark:bg-violet-600 dark:text-white dark:shadow-sm'
    : 'bg-surface-muted text-stone-900 dark:bg-primary-700 dark:text-white dark:shadow-sm';
  const activeIconCls = inSuperAdmin
    ? 'text-violet-600 dark:text-white'
    : 'text-primary-600 dark:text-white';

  const contentProps = {
    collapsed,
    inSuperAdmin,
    accentBg,
    activeItemCls,
    activeIconCls,
    filteredItems,
    user,
    tenant,
    unreadCount,
    onToggleCollapsed: toggleCollapsed,
    onMobileClose,
    onLogout: handleLogout,
    onOpenNotifications: () => setNotifOpen(true),
  };

  const renderContent = (isMobile: boolean) => {
    const expandedForTour = tourForceExpanded && !isMobile;
    const showLabels = isMobile || !collapsed || expandedForTour;
    return (
      <AppSidebarContent
        {...contentProps}
        isMobile={isMobile}
        showLabels={showLabels}
      />
    );
  };

  return (
    <>
      <aside
        className={clsx(
          'hidden lg:flex flex-col flex-shrink-0 overflow-hidden',
          'my-3 ml-3 h-[calc(100vh-1.5rem)]',
          'bg-surface dark:bg-stone-900',
          'rounded-2xl shadow-sidebar',
          'dark:shadow-none dark:border dark:border-stone-800 dark:rounded-none dark:my-0 dark:ml-0 dark:h-full dark:border-r',
          'transition-[width] duration-200 ease-in-out',
          collapsed && !tourForceExpanded ? 'w-[68px]' : 'w-60',
        )}
      >
        {renderContent(false)}
      </aside>

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

      <aside
        id="mobile-sidebar"
        aria-label="Menú lateral"
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden',
          'bg-surface dark:bg-stone-900',
          'transition-transform duration-200',
          mobileOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in',
        )}
      >
        {renderContent(true)}
      </aside>

      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
