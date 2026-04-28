import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { TopNavbar } from './TopNavbar';
import { useAuthStore } from '../../store/useAuthStore';
import { useEffect, useState } from 'react';

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard':      { title: 'Dashboard',              subtitle: 'Resumen operacional en tiempo real' },
  '/clientes':       { title: 'Personas / Recepción',   subtitle: 'Administra y consulta tu cartera de clientes' },
  '/pedidos':        { title: 'Gestión de Pedidos',     subtitle: 'Crea, modifica y rastrea pedidos' },
  '/rutas':          { title: 'Admin. de Rutas',        subtitle: 'Planifica y monitorea rutas de distribución' },
  '/usuarios':       { title: 'Usuarios Sistema',       subtitle: 'Gestiona los usuarios de la plataforma' },
  '/fotos':          { title: 'Admin. Fotos',           subtitle: 'Fotografías de inspección y entrega desde la app móvil' },
  '/peonetas':       { title: 'Mis Peonetas',           subtitle: 'Asistentes de entrega asignables a rutas' },
  '/configuracion':  { title: 'Configuración',          subtitle: 'Ajustes del tenant y la plataforma' },
};

export function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const pageInfo = pageTitles[location.pathname] ?? { title: 'Rutek' };

  return (
    <div className="flex flex-col h-screen bg-stone-50 overflow-hidden">
      <TopNavbar />

      {/* Page title bar */}
      <div className="bg-white border-b border-stone-100 px-6 py-3 flex-shrink-0">
        <h1 className="text-base font-semibold text-stone-900">{pageInfo.title}</h1>
        {pageInfo.subtitle && (
          <p className="text-xs text-stone-400 mt-0.5">{pageInfo.subtitle}</p>
        )}
      </div>

      <main
        className={`flex-1 overflow-y-auto p-6 transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
