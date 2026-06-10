import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'violet' | 'violet-soft';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm disabled:bg-primary-300',
  secondary:
    'bg-surface hover:bg-surface-hover text-stone-700 border border-stone-200 shadow-card disabled:opacity-50 dark:bg-stone-900 dark:hover:bg-stone-800 dark:text-stone-200 dark:border-stone-600 dark:shadow-none',
  ghost:
    'hover:bg-surface-hover text-stone-600 hover:text-stone-900 disabled:text-stone-300 dark:hover:bg-stone-800 dark:text-stone-300 dark:hover:text-stone-100',
  danger:
    'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 disabled:opacity-50 dark:bg-red-950/40 dark:hover:bg-red-950/60 dark:border-red-900 dark:text-red-300',
  success:
    'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-50 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-300',
  violet:
    'bg-violet-600 hover:bg-violet-700 text-white shadow-sm disabled:bg-violet-300 dark:bg-violet-600 dark:hover:bg-violet-500 dark:disabled:bg-violet-900',
  'violet-soft':
    'bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 shadow-sm disabled:opacity-50 dark:bg-violet-950/45 dark:hover:bg-violet-950/65 dark:border-violet-800 dark:text-violet-200',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs rounded-md gap-1',
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className,
  fullWidth,
  disabled,
  ...props
}: ButtonProps) {
  const focusRingClass =
    variant === 'violet' || variant === 'violet-soft'
      ? 'focus:ring-violet-500/50'
      : 'focus:ring-primary-500/50';

  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-stone-950',
        focusRingClass,
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
}
