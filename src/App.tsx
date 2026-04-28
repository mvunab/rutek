import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { Dashboard } from './pages/dashboard/Dashboard';
import { ClientsPage } from './pages/clients/ClientsPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { RoutesPage } from './pages/routes/RoutesPage';
import { UsersPage } from './pages/users/UsersPage';
import { PhotosPage } from './pages/photos/PhotosPage';
import { PeonetasPage } from './pages/peonetas/PeonetasPage';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="rutas" element={<RoutesPage />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="fotos" element={<PhotosPage />} />
          <Route path="peonetas" element={<PeonetasPage />} />
          <Route path="configuracion" element={
            <div className="flex items-center justify-center h-64 text-slate-500">
              <p>Configuración — Próximamente</p>
            </div>
          } />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
