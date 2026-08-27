import { clsx } from 'clsx';
import type { User, UserRole } from '../../types';
import { roleConfig } from './usersPageShared';

type UserRoleSummaryCardsProps = {
  users: User[];
  roleFilter: UserRole | 'all';
  onToggleRole: (role: UserRole) => void;
};

export function UserRoleSummaryCards({ users, roleFilter, onToggleRole }: UserRoleSummaryCardsProps) {
  const cards = [];
  for (const [role, config] of Object.entries(roleConfig) as [UserRole, typeof roleConfig[UserRole]][]) {
    if (role === 'super_admin') continue;
    const count = users.filter((u) => u.role === role).length;
    cards.push(
      <button
        key={role}
        type="button"
        aria-pressed={roleFilter === role}
        onClick={() => onToggleRole(role)}
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
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards}
    </div>
  );
}
