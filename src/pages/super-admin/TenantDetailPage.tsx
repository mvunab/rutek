import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Shield, Trash2, X, CheckCircle2, AlertCircle, Package, Truck, Users, Building2, Key } from 'lucide-react';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedTenant, loading, fetchTenantDetail, createTenantAdmin, updateUser, deleteUser, resetUserPassword } = useSuperAdminStore();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [resetModalUserId, setResetModalUserId] = useState<string | null>(null);
  const [resetModalUserName, setResetModalUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (id) fetchTenantDetail(id);
  }, [id]);

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleCreateAdmin = async () => {
    if (!id || !adminForm.name || !adminForm.email || !adminForm.password) return;
    await createTenantAdmin(id, adminForm);
    setShowAdminModal(false);
    setAdminForm({ name: '', email: '', password: '', phone: '' });
  };

  const openResetPassword = (userId: string, userName: string) => {
    setResetModalUserId(userId);
    setResetModalUserName(userName);
    setNewPassword(generatePassword());
  };

  const handleResetPassword = async () => {
    if (!resetModalUserId || !newPassword) return;
    await resetUserPassword(resetModalUserId, newPassword);
    setResetModalUserId(null);
    setResetModalUserName('');
    setNewPassword('');
  };

  if (!selectedTenant && !loading) {
    return <div className="p-6">Tenant no encontrado</div>;
  }

  const stats = (selectedTenant as any)?.stats;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin')} icon={<ArrowLeft size={16} />}>
          Volver
        </Button>
      </div>

      {selectedTenant && (
        <>
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-50 dark:bg-violet-950/30 rounded-lg flex items-center justify-center">
                  <Building2 size={20} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">{selectedTenant.name}</h1>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{selectedTenant.rut}</p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                selectedTenant.active
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
              }`}>
                {selectedTenant.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <p className="text-xs text-stone-400 mb-1">Plan</p>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 capitalize">{selectedTenant.plan}</p>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <p className="text-xs text-stone-400 mb-1">Ciudad</p>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{selectedTenant.city || selectedTenant.region || '—'}</p>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <p className="text-xs text-stone-400 mb-1">Email contacto</p>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{selectedTenant.email || '—'}</p>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <p className="text-xs text-stone-400 mb-1">Teléfono</p>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{selectedTenant.phone || '—'}</p>
              </div>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-violet-600 dark:text-violet-400" />
                  <p className="text-xs text-stone-400">Usuarios</p>
                </div>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats.user_count}</p>
              </div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Package size={16} className="text-amber-600 dark:text-amber-400" />
                  <p className="text-xs text-stone-400">Pedidos</p>
                </div>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats.order_count}</p>
              </div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Truck size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs text-stone-400">Rutas</p>
                </div>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats.route_count}</p>
              </div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-stone-400">Vehículos</p>
                </div>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats.vehicle_count}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Usuarios del Tenant</h2>
            <Button variant="primary" onClick={() => setShowAdminModal(true)} icon={<Plus size={16} />}>
              Agregar Usuario
            </Button>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-stone-50 dark:bg-stone-800/50">
                <tr>
                  <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Nombre</th>
                  <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Rol</th>
                  <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Estado</th>
                  <th className="text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {selectedTenant.users?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-stone-400" />
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-stone-500 dark:text-stone-400">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                        user.role === 'admin' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                        user.role === 'operator' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                        user.role === 'driver' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => updateUser(user.id, { active: !user.active })} className="flex items-center gap-1.5 text-xs">
                        {user.active ? (
                          <><CheckCircle2 size={14} className="text-emerald-600" /><span className="text-emerald-700 dark:text-emerald-400">Activo</span></>
                        ) : (
                          <><AlertCircle size={14} className="text-red-600" /><span className="text-red-700 dark:text-red-400">Inactivo</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="xs" onClick={() => openResetPassword(user.id, user.name)} title="Resetear contraseña">
                          <Key size={14} className="text-amber-500" />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => deleteUser(user.id)} title="Eliminar">
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!selectedTenant.users || selectedTenant.users.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-stone-400 dark:text-stone-500">No hay usuarios asignados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Nuevo Usuario</h2>
              <button onClick={() => setShowAdminModal(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nombre *</label>
                <Input value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} placeholder="Nombre completo" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Email *</label>
                <Input type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="usuario@empresa.cl" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Contraseña *</label>
                <Input type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Teléfono</label>
                <Input value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} placeholder="+56 9 1234 5678" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 dark:border-stone-800">
              <Button variant="ghost" onClick={() => setShowAdminModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleCreateAdmin} disabled={loading}>
                {loading ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {resetModalUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Resetear Contraseña</h2>
              <button onClick={() => setResetModalUserId(null)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Se reseteará la contraseña de <strong>{resetModalUserName}</strong>. Se enviará un correo con la nueva contraseña.
              </p>
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nueva contraseña</label>
                <div className="flex gap-2">
                  <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <Button variant="ghost" size="sm" onClick={() => setNewPassword(generatePassword())}>
                    Generar
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 dark:border-stone-800">
              <Button variant="ghost" onClick={() => setResetModalUserId(null)}>Cancelar</Button>
              <Button variant="primary" onClick={handleResetPassword} disabled={loading || !newPassword}>
                {loading ? 'Reseteando...' : 'Resetear Contraseña'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
