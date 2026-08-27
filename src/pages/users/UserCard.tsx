import { Key, Pencil, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { User } from '../../types';
import { roleConfig } from './usersPageShared';

type UserCardProps = {
  user: User;
  isSelf: boolean;
  canManage: boolean;
  onToggleActive: (user: User) => void;
  onEdit: (user: User) => void;
  onReset: (user: User) => void;
  onDelete: (user: User) => void;
};

export function UserCard({
  user,
  isSelf,
  canManage,
  onToggleActive,
  onEdit,
  onReset,
  onDelete,
}: UserCardProps) {
  const config = roleConfig[user.role];

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-md transition-[border-color,box-shadow] shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div aria-hidden="true" className="size-11 bg-primary-100 dark:bg-primary-950/50 rounded-xl flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-sm">
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">
            {user.name}
            {isSelf && <span className="ml-1.5 text-[10px] font-medium text-primary-600 dark:text-primary-400">(tú)</span>}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{user.email}</p>
        </div>
        {canManage && user.role !== 'super_admin' && !isSelf ? (
          <button
            type="button"
            onClick={() => onToggleActive(user)}
            aria-pressed={user.active}
            aria-label={user.active ? `Desactivar a ${user.name}` : `Activar a ${user.name}`}
            title={user.active ? 'Click para desactivar' : 'Click para activar'}
            className={clsx(
              'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              user.active
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 focus-visible:ring-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 focus-visible:ring-stone-500 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
            )}
          >
            <span aria-hidden="true" className={clsx('size-1.5 rounded-full', user.active ? 'bg-emerald-500' : 'bg-stone-400')} />
            {user.active ? 'Activo' : 'Inactivo'}
          </button>
        ) : (
          <Badge variant={user.active ? 'success' : 'slate'}>
            {user.active ? 'Activo' : 'Inactivo'}
          </Badge>
        )}
      </div>

      <div className={clsx('flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium', config.color)}>
        {config.icon}
        {config.label}
        <span className="ml-auto text-[10px] opacity-60">{config.description}</span>
      </div>

      {user.phone && (
        <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">📞 {user.phone}</p>
      )}
      <p className="mt-1.5 text-xs text-stone-300 dark:text-stone-500">Desde {user.createdAt}</p>

      {canManage && user.role !== 'super_admin' && (
        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-1">
          <Button variant="ghost" size="xs" onClick={() => onEdit(user)} aria-label={`Editar ${user.name}`} title="Editar">
            <Pencil size={14} className="text-stone-500" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="xs" onClick={() => onReset(user)} aria-label={`Resetear contraseña de ${user.name}`} title="Resetear contraseña">
            <Key size={14} className="text-amber-500" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onDelete(user)}
            disabled={isSelf}
            aria-label={`Eliminar ${user.name}`}
            title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Eliminar'}
          >
            <Trash2 size={14} className={isSelf ? 'text-stone-300 dark:text-stone-600' : 'text-red-500'} aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
