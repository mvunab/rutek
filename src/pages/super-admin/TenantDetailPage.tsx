import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Shield, Trash2, X, CheckCircle2, AlertCircle, Package, Truck, Users, Building2, Key, Pencil } from 'lucide-react';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';
import { ApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  active: boolean;
};

type EditForm = {
  name: string;
  email: string;
  role: string;
  phone: string;
};

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'operator', label: 'Operativo' },
  { value: 'driver', label: 'Chofer' },
] as const;

function getApiMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.body) as { message?: string | string[] };
      if (Array.isArray(parsed.message)) return parsed.message.join('. ');
      if (parsed.message) return parsed.message;
    } catch {
      // body no es JSON, devolvemos texto crudo si tiene sentido
    }
    if (err.status === 409) return 'Ese email ya está registrado.';
    if (err.status === 400) return err.body || 'Datos inválidos.';
    return `Error ${err.status}`;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedTenant, loading, fetchTenantDetail, createTenantAdmin, updateUser, deleteUser, resetUserPassword } = useSuperAdminStore();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', phone: '', role: 'admin' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [resetModalUserId, setResetModalUserId] = useState<string | null>(null);
  const [resetModalUserName, setResetModalUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<TenantUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', email: '', role: '', phone: '' });
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchTenantDetail(id);
  }, [id, fetchTenantDetail]);

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const openCreateAdmin = () => {
    setAdminForm({ name: '', email: '', password: '', phone: '', role: 'admin' });
    setCreateError(null);
    setShowAdminModal(true);
  };

  const closeCreateAdmin = () => {
    setShowAdminModal(false);
    setCreateError(null);
  };

  const handleCreateAdmin = async () => {
    if (!id) return;
    const name = adminForm.name.trim();
    const email = adminForm.email.trim().toLowerCase();
    const password = adminForm.password;
    const phone = adminForm.phone.trim();
    const role = adminForm.role as 'admin' | 'operator';

    if (!name || !email || !password) {
      setCreateError('Nombre, email y contraseña son obligatorios.');
      return;
    }
    if (password.length < 6) {
      setCreateError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setCreateError(null);
      await createTenantAdmin(id, {
        name,
        email,
        password,
        role,
        ...(phone ? { phone } : {}),
      });
      setShowAdminModal(false);
      setAdminForm({ name: '', email: '', password: '', phone: '', role: 'admin' });
    } catch (err) {
      setCreateError(getApiMessage(err, 'No se pudo crear el usuario.'));
    }
  };

  const openResetPassword = (userId: string, userName: string) => {
    setResetModalUserId(userId);
    setResetModalUserName(userName);
    setNewPassword(generatePassword());
    setResetError(null);
  };

  const handleResetPassword = async () => {
    if (!resetModalUserId || !newPassword) return;
    if (newPassword.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      setResetError(null);
      await resetUserPassword(resetModalUserId, newPassword);
      setResetModalUserId(null);
      setResetModalUserName('');
      setNewPassword('');
    } catch (err) {
      setResetError(getApiMessage(err, 'No se pudo resetear la contraseña.'));
    }
  };

  const openEdit = (user: TenantUser) => {
    setEditTarget(user);
    setEditForm({
      name: user.name ?? '',
      email: user.email ?? '',
      role: user.role ?? 'admin',
      phone: user.phone ?? '',
    });
    setEditError(null);
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditError('Nombre y email son obligatorios');
      return;
    }
    const patch: { name?: string; email?: string; role?: string; phone?: string } = {};
    if (editForm.name.trim() !== editTarget.name) patch.name = editForm.name.trim();
    if (editForm.email.trim() !== editTarget.email) patch.email = editForm.email.trim().toLowerCase();
    if (editForm.role !== editTarget.role) patch.role = editForm.role;
    const phoneTrim = editForm.phone.trim();
    if (phoneTrim !== (editTarget.phone ?? '')) patch.phone = phoneTrim;

    if (Object.keys(patch).length === 0) {
      closeEdit();
      return;
    }
    try {
      await updateUser(editTarget.id, patch);
      if (id) await fetchTenantDetail(id);
      closeEdit();
    } catch (err) {
      setEditError(getApiMessage(err, 'No se pudo actualizar el usuario.'));
    }
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
                <div aria-hidden="true" className="size-10 bg-violet-50 dark:bg-violet-950/30 rounded-lg flex items-center justify-center">
                  <Building2 size={20} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">{selectedTenant.name}</h1>
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
                <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{stats.user_count}</p>
              </div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Package size={16} className="text-amber-600 dark:text-amber-400" />
                  <p className="text-xs text-stone-400">Pedidos</p>
                </div>
                <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{stats.order_count}</p>
              </div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Truck size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs text-stone-400">Rutas</p>
                </div>
                <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{stats.route_count}</p>
              </div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-stone-400">Vehículos</p>
                </div>
                <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{stats.vehicle_count}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Usuarios del Tenant</h2>
            <Button variant="primary" onClick={openCreateAdmin} icon={<Plus size={16} />}>
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
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => openEdit(user as TenantUser)}
                          aria-label={`Editar ${user.name}`}
                          title="Editar"
                        >
                          <Pencil size={14} className="text-stone-500" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => openResetPassword(user.id, user.name)}
                          aria-label={`Resetear contraseña de ${user.name}`}
                          title="Resetear contraseña"
                        >
                          <Key size={14} className="text-amber-500" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar a ${user.name}? Esta acción no se puede deshacer.`)) {
                              deleteUser(user.id);
                            }
                          }}
                          aria-label={`Eliminar ${user.name}`}
                          title="Eliminar"
                        >
                          <Trash2 size={14} className="text-red-500" aria-hidden="true" />
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
          <div role="dialog" aria-modal="true" aria-labelledby="new-user-title" className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 id="new-user-title" className="text-lg font-semibold text-stone-900 dark:text-stone-100">Nuevo Usuario</h2>
              <button
                type="button"
                onClick={closeCreateAdmin}
                aria-label="Cerrar"
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="new-user-name" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nombre *</label>
                <Input id="new-user-name" name="name" autoComplete="name" value={adminForm.name} onChange={(e) => setAdminForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Nombre completo" />
              </div>
              <div>
                <label htmlFor="new-user-email" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Email *</label>
                <Input id="new-user-email" name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={adminForm.email} onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))} placeholder="usuario@empresa.cl" />
              </div>
              <div>
                <label htmlFor="new-user-password" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Contraseña *</label>
                <Input id="new-user-password" name="new-password" type="password" autoComplete="new-password" value={adminForm.password} onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label htmlFor="new-user-role" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Rol</label>
                <select
                  id="new-user-role"
                  name="role"
                  value={adminForm.role}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <option value="admin">Admin</option>
                  <option value="operator">Operativo</option>
                </select>
              </div>
              <div>
                <label htmlFor="new-user-phone" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Teléfono</label>
                <Input id="new-user-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={adminForm.phone} onChange={(e) => setAdminForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+56 9 1234 5678" />
              </div>
              {createError && (
                <div role="alert" aria-live="polite" className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                  <p className="text-xs text-red-700 dark:text-red-300">{createError}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 dark:border-stone-800">
              <Button variant="ghost" onClick={closeCreateAdmin}>Cancelar</Button>
              <Button variant="primary" onClick={handleCreateAdmin} disabled={loading}>
                {loading ? 'Creando…' : 'Crear Usuario'}
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
                Se reseteará la contraseña de <strong>{resetModalUserName}</strong>. Copia la nueva contraseña y entrégasela al usuario por un canal seguro: no se envía email automático.
              </p>
              <div>
                <label htmlFor="reset-pw-input" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nueva contraseña</label>
                <div className="flex gap-2">
                  <Input id="reset-pw-input" name="password" type="text" autoComplete="off" spellCheck={false} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <Button variant="ghost" size="sm" onClick={() => setNewPassword(generatePassword())}>
                    Generar
                  </Button>
                </div>
              </div>
              {resetError && (
                <div role="alert" aria-live="polite" className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                  <p className="text-xs text-red-700 dark:text-red-300">{resetError}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 dark:border-stone-800">
              <Button variant="ghost" onClick={() => setResetModalUserId(null)}>Cancelar</Button>
              <Button variant="primary" onClick={handleResetPassword} disabled={loading || !newPassword}>
                {loading ? 'Reseteando…' : 'Resetear Contraseña'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="edit-user-title" className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 id="edit-user-title" className="text-lg font-semibold text-stone-900 dark:text-stone-100">Editar usuario</h2>
              <button
                type="button"
                onClick={closeEdit}
                aria-label="Cerrar"
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="edit-user-name" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nombre *</label>
                <Input
                  id="edit-user-name"
                  name="name"
                  autoComplete="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label htmlFor="edit-user-email" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Email *</label>
                <Input
                  id="edit-user-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@empresa.cl"
                />
              </div>
              <div>
                <label htmlFor="edit-user-role" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Rol</label>
                <select
                  id="edit-user-role"
                  name="role"
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-user-phone" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Teléfono</label>
                <Input
                  id="edit-user-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              {editError && (
                <div role="alert" aria-live="polite" className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                  <p className="text-xs text-red-700 dark:text-red-300">{editError}</p>
                </div>
              )}
              <p className="text-[11px] text-stone-400 dark:text-stone-500">
                Para cambiar la contraseña usa el botón de la llave en la tabla.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 dark:border-stone-800">
              <Button variant="ghost" onClick={closeEdit}>Cancelar</Button>
              <Button variant="primary" onClick={handleSaveEdit} disabled={loading}>
                {loading ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
