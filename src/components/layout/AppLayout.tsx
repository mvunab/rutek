import { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Map, Menu, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { AppSidebar } from './AppSidebar';
import { useAuthStore } from '../../store/useAuthStore';

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard':     { title: 'Dashboard',         subtitle: 'Resumen operacional en tiempo real' },
  '/clientes':      { title: 'Clientes',          subtitle: 'Administra y consulta tu cartera de clientes' },
  '/pedidos': {
    title: 'Mis pedidos',
    subtitle: 'Seguimiento de tus envíos. El alta y la planificación en ruta las gestiona tu operador desde Rutas.',
  },
  '/rutas': {
    title: 'Rutas',
    subtitle: 'Itinerarios de salida: folio, nombre, fecha, pedidos, bultos y estado. Usa Pedidos en cada fila para gestionar la ruta.',
  },
  '/usuarios':      { title: 'Usuarios Sistema', subtitle: 'Administradores, operadores, repartidores, peonetas y clientes de la plataforma' },
  '/fotos':         { title: 'Admin. Fotos',      subtitle: 'Fotografías de inspección y entrega desde la app móvil' },
  '/configuracion': { title: 'Configuración',     subtitle: 'Tema de la interfaz y datos de la empresa' },
  '/vehiculos':     { title: 'Vehículos',         subtitle: 'Flota, VIN, mantención y vencimientos de documentación con alertas' },
};

export function AppLayout() {
  const { isAuthenticated, isSuperAdmin } = useAuthStore();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const inSuperAdmin = isSuperAdmin || location.pathname.startsWith('/super-admin');
  const pageInfo = pageTitles[location.pathname] ?? { title: 'Rutek' };

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950 overflow-hidden">
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
      />

      {/* Content column */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex-shrink-0">
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
          <div className="bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 px-6 py-3 flex-shrink-0">
            <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100">{pageInfo.title}</h1>
            {pageInfo.subtitle && (
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{pageInfo.subtitle}</p>
            )}
          </div>

          <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-6 min-h-0 bg-stone-50 dark:bg-stone-950 focus:outline-none">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
