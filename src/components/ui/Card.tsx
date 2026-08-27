import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className, padding = 'md', hover, onClick }: CardProps) {
  const classes = clsx(
    'bg-surface border border-stone-200/80 rounded-2xl shadow-card',
    'dark:bg-stone-900 dark:border-stone-800 dark:shadow-none',
    paddingClasses[padding],
    hover && 'hover:border-stone-300 hover:shadow-soft dark:hover:border-stone-600 transition-[box-shadow,border-color] duration-150 cursor-pointer',
    onClick && 'cursor-pointer text-left w-full',
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {children}
      </button>
    );
  }

  return (
    <div className={classes}>
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: 'blue' | 'emerald' | 'amber' | 'violet' | 'red';
}

const colorClasses = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-1 ring-blue-100 dark:ring-blue-900/60' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-1 ring-emerald-100 dark:ring-emerald-900/60' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-1 ring-amber-100 dark:ring-amber-900/60' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-1 ring-violet-100 dark:ring-violet-900/60' },
  red: { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-600 dark:text-red-400', ring: 'ring-1 ring-red-100 dark:ring-red-900/60' },
};

export function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }: StatCardProps) {
  const colors = colorClasses[color];
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">{title}</p>
          <p className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">{subtitle}</p>}
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              <span className={clsx(
                'text-xs font-medium',
                trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={clsx(
          'p-2.5 rounded-xl',
          colors.bg, colors.text, colors.ring
        )}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
