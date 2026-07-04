import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Map, Menu, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { AppSidebar } from './AppSidebar';
import { NavbarTour } from '../onboarding/NavbarTour';
import { useAuthStore } from '../../store/useAuthStore';
import { Activity } from 'lucide-react';

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard':     { title: 'Dashboard',         subtitle: 'Resumen operacional en tiempo real' },
  '/clientes':      { title: 'Clientes',           subtitle: 'Administra y consulta tus clientes y mandantes' },
  '/pedidos': {
    title: 'Mis pedidos',
    subtitle: 'Seguimiento de tus envíos. El alta y la planificación en ruta las gestiona tu operador desde Rutas.',
  },
  '/rutas': {
    title: 'Rutas',
    subtitle: 'Selecciona un itinerario en el listado para ver el detalle y gestionar pedidos en el panel lateral.',
  },
  '/usuarios':      { title: 'Usuarios Sistema', subtitle: 'Administradores, operadores, repartidores, peonetas y clientes de la plataforma' },
  '/fotos':         { title: 'Admin. Fotos',      subtitle: 'Fotografías de inspección y entrega desde la app móvil' },
  '/valorizacion':  { title: 'Valorización',      subtitle: 'Cobro a clientes y pago a choferes y peonetas por pedido' },
  '/configuracion': { title: 'Configuración',     subtitle: 'Tema, app móvil y datos de la empresa' },
  '/vehiculos':     { title: 'Vehículos',         subtitle: 'Flota, VIN, mantención y vencimientos de documentación con alertas' },
  '/mis-rutas':     { title: 'Mis Rutas',          subtitle: 'Pedidos que tienes asignados en las rutas de hoy' },
};

export function AppLayout() {
  const { user, isAuthenticated, isSuperAdmin, loading, restoreSession } = useAuthStore();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [tourSidebarExpanded, setTourSidebarExpanded] = useState(false);

  const prepareSidebarForTour = useCallback(() => {
    setTourSidebarExpanded(true);
    setMobileSidebarOpen(true);
    try {
      localStorage.setItem('sidebar-collapsed', 'false');
    } catch {
      /* ignore */
    }
  }, []);

  const handleTourEnd = useCallback(() => {
    setTourSidebarExpanded(false);
    setMobileSidebarOpen(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void restoreSession().finally(() => {
      if (!cancelled) setSessionReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [restoreSession]);

  if (!sessionReady || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-canvas dark:bg-stone-950"
        role="status"
        aria-live="polite"
      >
        <Activity size={24} className="animate-spin text-primary-600 mr-2" aria-hidden />
        <span className="text-sm text-stone-500 dark:text-stone-400">Cargando sesión…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const inSuperAdmin = isSuperAdmin || location.pathname.startsWith('/super-admin');
  const vehicleDetailMatch = /^\/vehiculos\/[^/]+$/.test(location.pathname);
  const clientDetailMatch = /^\/clientes\/[^/]+$/.test(location.pathname);
  const pageInfo = vehicleDetailMatch
    ? {
        title: 'Ficha de vehículo',
        subtitle: 'Identificación, documentación y actividad reciente en rutas y pedidos',
      }
    : clientDetailMatch
      ? {
          title: 'Ficha de cliente',
          subtitle: 'Actividad comercial, oportunidades e historial de pedidos',
        }
      : pageTitles[location.pathname] ?? { title: 'Rutek' };
  /** Rutas usa layout de altura fija: scroll solo en listado y panel de detalle. */
  const isRoutesPage = location.pathname === '/rutas';

  return (
    <div className="flex h-screen bg-canvas dark:bg-stone-950 overflow-hidden">
      {/* Skip link — accesibilidad teclado */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:dark:bg-stone-900 focus:text-primary-700 focus:text-sm focus:font-medium focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
      >
        Ir al contenido principal
      </a>

      <AppSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        tourForceExpanded={tourSidebarExpanded}
      />

      {user && (
        <NavbarTour
          userId={user.id}
          role={user.role}
          isSuperAdmin={isSuperAdmin}
          onPrepareSidebar={prepareSidebarForTour}
          onTourEnd={handleTourEnd}
        />
      )}

      {/* Content column */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-surface dark:bg-stone-900 border-b border-stone-200/80 dark:border-stone-800 flex-shrink-0 shadow-card dark:shadow-none">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
            aria-label="Abrir menú"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2" aria-hidden="true">
            <div className={clsx('size-6 rounded-md flex items-center justify-center', inSuperAdmin ? 'bg-violet-600' : 'bg-primary-700')}>
              {inSuperAdmin
                ? <Shield size={12} className="text-white" />
                : <Map size={12} className="text-white" />}
            </div>
            <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">Rutek</span>
          </div>
        </div>

        {/* Animated page area */}
        <div
          key={location.pathname}
          className="flex flex-col flex-1 min-h-0 animate-page-enter motion-reduce:animate-none"
        >
          {/* Page title bar */}
          <div className="mx-6 mt-4 flex-shrink-0 bg-surface dark:bg-stone-900 rounded-2xl shadow-card border border-stone-200/60 dark:border-stone-800 dark:shadow-none px-6 py-3 lg:mx-4 lg:mt-3">
            <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100">{pageInfo.title}</h1>
            {pageInfo.subtitle && (
              <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">{pageInfo.subtitle}</p>
            )}
          </div>

          <main
            id="main-content"
            tabIndex={-1}
            className={clsx(
              'flex-1 min-h-0 px-6 pb-6 pt-4 bg-canvas dark:bg-stone-950 focus:outline-none',
              isRoutesPage ? 'overflow-hidden flex flex-col' : 'overflow-y-auto',
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
