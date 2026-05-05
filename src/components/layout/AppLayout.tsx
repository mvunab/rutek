import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { TopNavbar } from './TopNavbar';
import { useAuthStore } from '../../store/useAuthStore';

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard':      { title: 'Dashboard',              subtitle: 'Resumen operacional en tiempo real' },
  '/clientes':       { title: 'Clientes',               subtitle: 'Administra y consulta tu cartera de clientes' },
  '/pedidos':        { title: 'Gestión de Pedidos',     subtitle: 'Crea, modifica y rastrea pedidos' },
  '/rutas':          { title: 'Admin. de Rutas',        subtitle: 'Planifica y monitorea rutas de distribución' },
  '/usuarios':       { title: 'Usuarios Sistema',       subtitle: 'Gestiona los usuarios de la plataforma' },
  '/fotos':          { title: 'Admin. Fotos',           subtitle: 'Fotografías de inspección y entrega desde la app móvil' },
  '/peonetas':       { title: 'Peonetas',               subtitle: 'Asistentes de entrega asignables a rutas' },
  '/configuracion':  { title: 'Configuración',          subtitle: 'Tema de la interfaz y datos de la empresa' },
};

export function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const pageInfo = pageTitles[location.pathname] ?? { title: 'Rutek' };

  return (
    <div className="flex flex-col h-screen bg-stone-50 dark:bg-stone-950 overflow-hidden">
      <TopNavbar />

      {/* Título + contenido: misma animación al cambiar de ruta */}
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

        <main className="flex-1 overflow-y-auto p-6 min-h-0 bg-stone-50 dark:bg-stone-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
