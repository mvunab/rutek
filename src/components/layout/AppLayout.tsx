import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../store/useAuthStore';
import { useEffect, useState } from 'react';

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Resumen operacional en tiempo real' },
  '/clientes': { title: 'Gestión de Clientes', subtitle: 'Administra y consulta tu cartera de clientes' },
  '/pedidos': { title: 'Gestión de Pedidos', subtitle: 'Crea, modifica y rastrea pedidos' },
  '/rutas': { title: 'Gestión de Rutas', subtitle: 'Planifica y monitorea rutas de distribución' },
  '/usuarios': { title: 'Usuarios', subtitle: 'Gestiona los usuarios del sistema' },
  '/configuracion': { title: 'Configuración', subtitle: 'Ajustes del tenant y la plataforma' },
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
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main
          className={`flex-1 overflow-y-auto p-6 transition-opacity duration-200 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
