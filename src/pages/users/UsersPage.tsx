import { useEffect, useId, useMemo, useState } from 'react';
import { Key, Pencil, Plus, Search, Shield, Trash2, Truck, Users, Building2, X, PersonStanding } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ApiError } from '../../lib/api';
import type { User, UserRole } from '../../types';
import { clsx } from 'clsx';

type ManagedRole = Exclude<UserRole, 'super_admin'>;

const roleConfig: Record<UserRole, { label: string; color: string; card: string; icon: React.ReactNode; description: string }> = {
  super_admin: {
    label: 'Super Admin',
    color: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/45 dark:text-red-300 dark:border-red-800',
    card: 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800',
    icon: <Shield size={14} />,
    description: 'Acceso total al sistema multi-tenant',
  },
  admin: {
    label: 'Administrador',
    color: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/45 dark:text-blue-300 dark:border-blue-800',
    card: 'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800',
    icon: <Shield size={14} />,
    description: 'Acceso total al sistema',
  },
  operator: {
    label: 'Operador Logístico',
    color: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/45 dark:text-violet-300 dark:border-violet-800',
    card: 'bg-violet-50 border-violet-200 dark:bg-violet-950/50 dark:border-violet-800',
    icon: <Building2 size={14} />,
    description: 'Gestiona pedidos y rutas',
  },
  driver: {
    label: 'Repartidor',
    color: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/45 dark:text-emerald-300 dark:border-emerald-800',
    card: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800',
    icon: <Truck size={14} />,
    description: 'Ejecuta entregas',
  },
  peoneta: {
    label: 'Peoneta',
    color: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/45 dark:text-orange-300 dark:border-orange-800',
    card: 'bg-orange-50 border-orange-200 dark:bg-orange-950/50 dark:border-orange-800',
    icon: <PersonStanding size={14} />,
    description: 'Asiste en entregas (app móvil)',
  },
  client: {
    label: 'Cliente',
    color: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/45 dark:text-amber-300 dark:border-amber-800',
    card: 'bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800',
    icon: <Users size={14} />,
    description: 'Consulta sus pedidos',
  },
};

const MANAGED_ROLES: { value: ManagedRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'operator', label: 'Operador Logístico' },
  { value: 'driver', label: 'Repartidor' },
  { value: 'peoneta', label: 'Peoneta' },
  { value: 'client', label: 'Cliente' },
];

type CreateForm = {
  name: string;
  email: string;
  password: string;
  role: ManagedRole;
  phone: string;
};

type EditForm = {
  name: string;
  email: string;
  role: ManagedRole;
  phone: string;
};

function generatePassword(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pass = '';
  for (let i = 0; i < length; i += 1) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function getApiMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.body) as { message?: string | string[] };
      if (Array.isArray(parsed.message)) return parsed.message.join('. ');
      if (parsed.message) return parsed.message;
    } catch {
      // body no es JSON
    }
    if (err.status === 409) return 'Ese email ya está registrado.';
    if (err.status === 403) return 'No tienes permisos para esta acción.';
    if (err.status === 400) return err.body || 'Datos inválidos.';
    return `Error ${err.status}`;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const {
    users, loaded, loading, fetchUsers,
    createUser, updateUser, deleteUser, resetPassword,
  } = useUserStore();

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const createId = useId();
  const editId = useId();
  const resetId = useId();

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: '', email: '', password: '', role: 'operator', phone: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '', email: '', role: 'operator', phone: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetValue, setResetValue] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    });
  }, [users, roleFilter, search]);

  const openCreate = () => {
    setCreateForm({ name: '', email: '', password: generatePassword(), role: 'operator', phone: '' });
    setCreateError(null);
    setCreateOpen(true);
  };
  const closeCreate = () => {
    setCreateOpen(false);
    setCreateError(null);
  };
  const handleCreate = async () => {
    const name = createForm.name.trim();
    const email = createForm.email.trim().toLowerCase();
    const password = createForm.password;
    const phone = createForm.phone.trim();
    if (!name || !email || !password) {
      setCreateError('Nombre, email y contraseña son obligatorios.');
      return;
    }
    if (password.length < 6) {
      setCreateError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      setCreating(true);
      setCreateError(null);
      await createUser({
        name, email, password,
        role: createForm.role,
        ...(phone ? { phone } : {}),
      });
      closeCreate();
    } catch (err) {
      setCreateError(getApiMessage(err, 'No se pudo crear el usuario.'));
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u: User) => {
    setEditTarget(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: (u.role === 'super_admin' ? 'admin' : u.role) as ManagedRole,
      phone: u.phone ?? '',
    });
    setEditError(null);
  };
  const closeEdit = () => {
    setEditTarget(null);
    setEditError(null);
  };
  const handleEdit = async () => {
    if (!editTarget) return;
    const name = editForm.name.trim();
    const email = editForm.email.trim().toLowerCase();
    const phone = editForm.phone.trim();
    if (!name || !email) {
      setEditError('Nombre y email son obligatorios.');
      return;
    }
    const patch: { name?: string; email?: string; role?: ManagedRole; phone?: string } = {};
    if (name !== editTarget.name) patch.name = name;
    if (email !== editTarget.email) patch.email = email;
    if (editForm.role !== editTarget.role) patch.role = editForm.role;
    if (phone !== (editTarget.phone ?? '')) patch.phone = phone;
    if (Object.keys(patch).length === 0) {
      closeEdit();
      return;
    }
    try {
      setEditing(true);
      setEditError(null);
      await updateUser(editTarget.id, patch);
      closeEdit();
    } catch (err) {
      setEditError(getApiMessage(err, 'No se pudo actualizar el usuario.'));
    } finally {
      setEditing(false);
    }
  };

  const openReset = (u: User) => {
    setResetTarget(u);
    setResetValue(generatePassword());
    setResetError(null);
  };
  const closeReset = () => {
    setResetTarget(null);
    setResetError(null);
  };
  const handleReset = async () => {
    if (!resetTarget) return;
    if (resetValue.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      setResetting(true);
      setResetError(null);
      await resetPassword(resetTarget.id, resetValue);
      closeReset();
    } catch (err) {
      setResetError(getApiMessage(err, 'No se pudo resetear la contraseña.'));
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!window.confirm(`¿Eliminar a ${u.name}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteUser(u.id);
    } catch (err) {
      window.alert(getApiMessage(err, 'No se pudo eliminar el usuario.'));
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await updateUser(u.id, { active: !u.active });
    } catch (err) {
      window.alert(getApiMessage(err, 'No se pudo cambiar el estado del usuario.'));
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" aria-hidden="true" />
          <label htmlFor="users-search" className="sr-only">Buscar usuario</label>
          <input
            id="users-search"
            type="search"
            name="q"
            autoComplete="off"
            placeholder="Buscar usuario…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'admin', 'operator', 'driver', 'peoneta', 'client'] as const).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={roleFilter === r}
              onClick={() => setRoleFilter(r)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                roleFilter === r
                  ? 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-950/45 dark:text-primary-300 dark:border-primary-800'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 border border-transparent'
              )}
            >
              {r === 'all' ? 'Todos' : roleConfig[r].label}
            </button>
          ))}
        </div>
        {canManage && (
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Nuevo usuario
          </Button>
        )}
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(Object.entries(roleConfig) as [UserRole, typeof roleConfig[UserRole]][])
          .filter(([role]) => role !== 'super_admin')
          .map(([role, config]) => {
          const count = users.filter(u => u.role === role).length;
          return (
            <button
              key={role}
              type="button"
              aria-pressed={roleFilter === role}
              onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
              className={clsx(
                'p-4 rounded-xl border text-center cursor-pointer transition-[box-shadow,border-color,background-color] shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                roleFilter === role ? config.card : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
              )}
            >
              <span className={clsx(
                'flex items-center justify-center gap-1.5 mb-2',
                roleFilter === role ? 'text-stone-700 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'
              )}>
                {config.icon}
                <span className="text-xs font-semibold">{config.label}</span>
              </span>
              <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{count}</p>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">{config.description}</p>
            </button>
          );
        })}
      </div>

      {/* Users grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title={loaded ? 'Sin usuarios para mostrar' : loading ? 'Cargando usuarios…' : 'Sin usuarios'}
          description={
            loaded && users.length === 0
              ? 'Aún no hay usuarios registrados en el sistema.'
              : 'No se encontraron usuarios con los filtros aplicados.'
          }
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((u) => {
          const config = roleConfig[u.role];
          const isSelf = currentUser?.id === u.id;
          return (
            <div key={u.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div aria-hidden="true" className="size-11 bg-primary-100 dark:bg-primary-950/50 rounded-xl flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-sm">
                  {u.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">{u.name}{isSelf && <span className="ml-1.5 text-[10px] font-medium text-primary-600 dark:text-primary-400">(tú)</span>}</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{u.email}</p>
                </div>
                {canManage && u.role !== 'super_admin' && !isSelf ? (
                  <button
                    type="button"
                    onClick={() => handleToggleActive(u)}
                    aria-pressed={u.active}
                    aria-label={u.active ? `Desactivar a ${u.name}` : `Activar a ${u.name}`}
                    title={u.active ? 'Click para desactivar' : 'Click para activar'}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                      u.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 focus-visible:ring-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 focus-visible:ring-stone-500 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
                    )}
                  >
                    <span aria-hidden="true" className={clsx('size-1.5 rounded-full', u.active ? 'bg-emerald-500' : 'bg-stone-400')} />
                    {u.active ? 'Activo' : 'Inactivo'}
                  </button>
                ) : (
                  <Badge variant={u.active ? 'success' : 'slate'}>
                    {u.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                )}
              </div>

              <div className={clsx('flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium', config.color)}>
                {config.icon}
                {config.label}
                <span className="ml-auto text-[10px] opacity-60">{config.description}</span>
              </div>

              {u.phone && (
                <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">📞 {u.phone}</p>
              )}
              <p className="mt-1.5 text-xs text-stone-300 dark:text-stone-500">Desde {u.createdAt}</p>

              {canManage && u.role !== 'super_admin' && (
                <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-1">
                  <Button variant="ghost" size="xs" onClick={() => openEdit(u)} aria-label={`Editar ${u.name}`} title="Editar">
                    <Pencil size={14} className="text-stone-500" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => openReset(u)} aria-label={`Resetear contraseña de ${u.name}`} title="Resetear contraseña">
                    <Key size={14} className="text-amber-500" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleDelete(u)}
                    disabled={isSelf}
                    aria-label={`Eliminar ${u.name}`}
                    title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Eliminar'}
                  >
                    <Trash2 size={14} className={isSelf ? 'text-stone-300 dark:text-stone-600' : 'text-red-500'} aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Modal Crear */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby={`${createId}-title`} className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 id={`${createId}-title`} className="text-lg font-semibold text-stone-900 dark:text-stone-100">Nuevo usuario</h2>
              <button
                type="button"
                onClick={closeCreate}
                aria-label="Cerrar"
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor={`${createId}-name`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nombre *</label>
                <Input id={`${createId}-name`} name="name" autoComplete="name" value={createForm.name} onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Nombre completo" />
              </div>
              <div>
                <label htmlFor={`${createId}-email`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Email *</label>
                <Input id={`${createId}-email`} name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={createForm.email} onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))} placeholder="usuario@empresa.cl" />
              </div>
              <div>
                <label htmlFor={`${createId}-password`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Contraseña *</label>
                <div className="flex gap-2">
                  <Input id={`${createId}-password`} name="new-password" type="text" autoComplete="new-password" value={createForm.password} onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
                  <Button variant="ghost" size="sm" onClick={() => setCreateForm(prev => ({ ...prev, password: generatePassword() }))}>
                    Generar
                  </Button>
                </div>
                <p className="mt-1 text-[10px] text-stone-400 dark:text-stone-500">Copia esta contraseña antes de guardar; no se mostrará de nuevo.</p>
              </div>
              <div>
                <label htmlFor={`${createId}-role`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Rol</label>
                <select
                  id={`${createId}-role`}
                  name="role"
                  value={createForm.role}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value as ManagedRole }))}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {MANAGED_ROLES.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${createId}-phone`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Teléfono</label>
                <Input id={`${createId}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" value={createForm.phone} onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+56 9 1234 5678" />
              </div>
              {createError && (
                <div role="alert" aria-live="polite" className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                  <p className="text-xs text-red-700 dark:text-red-300">{createError}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 dark:border-stone-800">
              <Button variant="ghost" onClick={closeCreate}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Creando…' : 'Crear usuario'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby={`${editId}-title`} className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 id={`${editId}-title`} className="text-lg font-semibold text-stone-900 dark:text-stone-100">Editar usuario</h2>
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
                <label htmlFor={`${editId}-name`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nombre *</label>
                <Input id={`${editId}-name`} name="name" autoComplete="name" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Nombre completo" />
              </div>
              <div>
                <label htmlFor={`${editId}-email`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Email *</label>
                <Input id={`${editId}-email`} name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} placeholder="usuario@empresa.cl" />
              </div>
              <div>
                <label htmlFor={`${editId}-role`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Rol</label>
                <select
                  id={`${editId}-role`}
                  name="role"
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as ManagedRole }))}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {MANAGED_ROLES.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${editId}-phone`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Teléfono</label>
                <Input id={`${editId}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+56 9 1234 5678" />
              </div>
              {editError && (
                <div role="alert" aria-live="polite" className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                  <p className="text-xs text-red-700 dark:text-red-300">{editError}</p>
                </div>
              )}
              <p className="text-[11px] text-stone-400 dark:text-stone-500">
                Para cambiar la contraseña usa el botón de la llave en la tarjeta.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 dark:border-stone-800">
              <Button variant="ghost" onClick={closeEdit}>Cancelar</Button>
              <Button onClick={handleEdit} disabled={editing}>
                {editing ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset password */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby={`${resetId}-title`} className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 id={`${resetId}-title`} className="text-lg font-semibold text-stone-900 dark:text-stone-100">Resetear contraseña</h2>
              <button
                type="button"
                onClick={closeReset}
                aria-label="Cerrar"
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Se reseteará la contraseña de <strong>{resetTarget.name}</strong>. Copia la nueva contraseña y entrégasela al usuario por un canal seguro: no se envía email automático.
              </p>
              <div>
                <label htmlFor={`${resetId}-pw`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nueva contraseña</label>
                <div className="flex gap-2">
                  <Input id={`${resetId}-pw`} name="password" type="text" autoComplete="off" spellCheck={false} value={resetValue} onChange={(e) => setResetValue(e.target.value)} />
                  <Button variant="ghost" size="sm" onClick={() => setResetValue(generatePassword())}>
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
              <Button variant="ghost" onClick={closeReset}>Cancelar</Button>
              <Button onClick={handleReset} disabled={resetting || !resetValue}>
                {resetting ? 'Reseteando…' : 'Resetear contraseña'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
