import { Plus, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import type { UserRole } from '../../types';
import { roleConfig } from './usersPageShared';

type UserToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: UserRole | 'all';
  onRoleFilterChange: (role: UserRole | 'all') => void;
  canManage: boolean;
  onCreate: () => void;
};

export function UserToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  canManage,
  onCreate,
}: UserToolbarProps) {
  return (
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
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shadow-sm"
        />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['all', 'admin', 'operator', 'driver', 'peoneta', 'client'] as const).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={roleFilter === r}
            onClick={() => onRoleFilterChange(r)}
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
        <Button onClick={onCreate} icon={<Plus size={16} />}>
          Nuevo usuario
        </Button>
      )}
    </div>
  );
}
