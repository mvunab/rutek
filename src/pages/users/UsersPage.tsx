import { useEffect, useId, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { User, UserRole } from '../../types';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { UserCard } from './UserCard';
import { UserRoleSummaryCards } from './UserRoleSummaryCards';
import { UserToolbar } from './UserToolbar';
import {
  generatePassword,
  getApiMessage,
  type CreateForm,
  type EditForm,
  type ManagedRole,
} from './usersPageShared';

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
      <UserToolbar
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        canManage={canManage}
        onCreate={openCreate}
      />

      <UserRoleSummaryCards
        users={users}
        roleFilter={roleFilter}
        onToggleRole={(role) => setRoleFilter(roleFilter === role ? 'all' : role)}
      />

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
          {filtered.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              isSelf={currentUser?.id === u.id}
              canManage={canManage}
              onToggleActive={handleToggleActive}
              onEdit={openEdit}
              onReset={openReset}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateUserModal
        idPrefix={createId}
        open={createOpen}
        form={createForm}
        error={createError}
        creating={creating}
        onChange={setCreateForm}
        onClose={closeCreate}
        onSubmit={() => void handleCreate()}
      />

      <EditUserModal
        idPrefix={editId}
        open={editTarget !== null}
        form={editForm}
        error={editError}
        editing={editing}
        onChange={setEditForm}
        onClose={closeEdit}
        onSubmit={() => void handleEdit()}
      />

      <ResetPasswordModal
        idPrefix={resetId}
        target={resetTarget}
        value={resetValue}
        error={resetError}
        resetting={resetting}
        onChange={setResetValue}
        onClose={closeReset}
        onSubmit={() => void handleReset()}
      />
    </div>
  );
}
