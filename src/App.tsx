import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { AppLayout } from './components/layout/AppLayout';
import { AnimatedPage } from './components/layout/AnimatedPage';
import { useAuthStore } from './store/useAuthStore';
import { BackendGuard } from './components/system/BackendGuard';
import { ToastContainer } from './components/ui/Toast';

const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const Dashboard = lazy(() =>
  import('./pages/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })),
);
const ClientsPage = lazy(() =>
  import('./pages/clients/ClientsPage').then((m) => ({
    default: m.ClientsPage,
  })),
);
const OrdersPage = lazy(() =>
  import('./pages/orders/OrdersPage').then((m) => ({ default: m.OrdersPage })),
);
const RoutesPage = lazy(() =>
  import('./pages/routes/RoutesPage').then((m) => ({ default: m.RoutesPage })),
);
const UsersPage = lazy(() =>
  import('./pages/users/UsersPage').then((m) => ({ default: m.UsersPage })),
);
const PhotosPage = lazy(() =>
  import('./pages/photos/PhotosPage').then((m) => ({ default: m.PhotosPage })),
);
const VehiclesPage = lazy(() =>
  import('./pages/vehicles/VehiclesPage').then((m) => ({
    default: m.VehiclesPage,
  })),
);
const SettingsPage = lazy(() =>
  import('./pages/settings/SettingsPage').then((m) => ({
    default: m.SettingsPage,
  })),
);
const SuperAdminDashboard = lazy(() =>
  import('./pages/super-admin/SuperAdminDashboard').then((m) => ({
    default: m.SuperAdminDashboard,
  })),
);
const TenantsPage = lazy(() =>
  import('./pages/super-admin/TenantsPage').then((m) => ({
    default: m.TenantsPage,
  })),
);
const TenantDetailPage = lazy(() =>
  import('./pages/super-admin/TenantDetailPage').then((m) => ({
    default: m.TenantDetailPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import('./pages/super-admin/AdminUsersPage').then((m) => ({
    default: m.AdminUsersPage,
  })),
);
const AuditPage = lazy(() =>
  import('./pages/super-admin/AuditPage').then((m) => ({
    default: m.AuditPage,
  })),
);
const NotFound = lazy(() =>
  import('./pages/NotFound').then((m) => ({ default: m.NotFound })),
);

function PageFallback() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Cargando página"
    >
      <Activity
        size={28}
        className="text-stone-400 dark:text-stone-500 animate-spin"
        aria-hidden="true"
      />
    </div>
  );
}

function ProtectedRoute({
  children,
  requireSuperAdmin = false,
}: {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}) {
  const { isAuthenticated, isSuperAdmin, loading } = useAuthStore();

  if (loading) {
    return <PageFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function GuardedOutlet() {
  return (
    <BackendGuard>
      <Outlet />
    </BackendGuard>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              <AnimatedPage className="min-h-screen">
                <LoginPage />
              </AnimatedPage>
            }
          />
          <Route element={<GuardedOutlet />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes"
                element={
                  <ProtectedRoute>
                    <ClientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pedidos"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="rutas"
                element={
                  <ProtectedRoute>
                    <RoutesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="usuarios"
                element={
                  <ProtectedRoute>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fotos"
                element={
                  <ProtectedRoute>
                    <PhotosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="peonetas"
                element={<Navigate to="/usuarios" replace />}
              />
              <Route
                path="vehiculos"
                element={
                  <ProtectedRoute>
                    <VehiclesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="configuracion"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="super-admin"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="super-admin/tenants"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <TenantsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="super-admin/tenants/:id"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <TenantDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="super-admin/users"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="super-admin/auditoria"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <AuditPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route
              path="*"
              element={
                <AnimatedPage className="min-h-screen">
                  <NotFound />
                </AnimatedPage>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
