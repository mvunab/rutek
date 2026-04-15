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
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white border border-stone-200 rounded-xl shadow-sm',
        paddingClasses[padding],
        hover && 'hover:border-stone-300 hover:shadow-md transition-all duration-150 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
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
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-1 ring-blue-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-1 ring-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-1 ring-amber-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-1 ring-violet-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-1 ring-red-100' },
};

export function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }: StatCardProps) {
  const colors = colorClasses[color];
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-stone-500 font-medium">{title}</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-stone-400">{subtitle}</p>}
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              <span className={clsx(
                'text-xs font-medium',
                trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-stone-400">{trend.label}</span>
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
