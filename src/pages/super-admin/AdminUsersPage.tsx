import { useEffect, useState } from 'react';
import { Shield, Trash2, CheckCircle2, AlertCircle, Key, X } from 'lucide-react';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';

const roleColors: Record<string, string> = {
  admin: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  operator: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  driver: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  client: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
};

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export function AdminUsersPage() {
  const { allUsers, loading, fetchAllUsers, updateUser, deleteUser, resetUserPassword } = useSuperAdminStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [resetModalUserId, setResetModalUserId] = useState<string | null>(null);
  const [resetModalUserName, setResetModalUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

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

  const filtered = allUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Gestión de Usuarios</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">{allUsers.length} usuarios en el sistema</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            id="admin-users-search"
            label="Buscar"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          id="admin-users-role-filter"
          label="Rol"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los roles' },
            { value: 'admin', label: 'Admin' },
            { value: 'operator', label: 'Operador' },
            { value: 'driver', label: 'Repartidor' },
            { value: 'client', label: 'Cliente' },
          ]}
          containerClassName="w-48"
        />
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 dark:bg-stone-800/50">
            <tr>
              <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Usuario</th>
              <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Tenant</th>
              <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Rol</th>
              <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Estado</th>
              <th className="text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-stone-400" />
                    <div>
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{user.name}</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-stone-500 dark:text-stone-400">
                  {user.tenants?.name || '—'}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[user.role] || 'bg-stone-100 text-stone-700 dark:bg-stone-800'}`}>
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
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div className="p-8 text-center text-sm text-stone-400 dark:text-stone-500">No se encontraron usuarios</div>
        )}
      </div>

      {resetModalUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Resetear Contraseña</h2>
              <button
                type="button"
                onClick={() => setResetModalUserId(null)}
                aria-label="Cerrar"
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Se reseteará la contraseña de <strong>{resetModalUserName}</strong>. Se enviará un correo con la nueva contraseña.
              </p>
              <Input
                id="admin-reset-password"
                label="Nueva contraseña"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button variant="ghost" size="sm" onClick={() => setNewPassword(generatePassword())}>
                Generar
              </Button>
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
