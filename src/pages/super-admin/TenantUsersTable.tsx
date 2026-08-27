import { AlertCircle, CheckCircle2, Key, Pencil, Shield, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { TenantUser } from './tenantDetailUtils';

export function TenantUsersTable({
  users,
  onEdit,
  onResetPassword,
  onDelete,
  onToggleActive,
}: {
  users: TenantUser[];
  onEdit: (user: TenantUser) => void;
  onResetPassword: (userId: string, userName: string) => void;
  onDelete: (userId: string, userName: string) => void;
  onToggleActive: (userId: string, active: boolean) => void;
}) {
  return (
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
          {users.map((user) => (
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
                <button onClick={() => onToggleActive(user.id, !user.active)} className="flex items-center gap-1.5 text-xs">
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
                    onClick={() => onEdit(user)}
                    aria-label={`Editar ${user.name}`}
                    title="Editar"
                  >
                    <Pencil size={14} className="text-stone-500" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onResetPassword(user.id, user.name)}
                    aria-label={`Resetear contraseña de ${user.name}`}
                    title="Resetear contraseña"
                  >
                    <Key size={14} className="text-amber-500" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onDelete(user.id, user.name)}
                    aria-label={`Eliminar ${user.name}`}
                    title="Eliminar"
                  >
                    <Trash2 size={14} className="text-red-500" aria-hidden="true" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-sm text-stone-400 dark:text-stone-500">No hay usuarios asignados</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
