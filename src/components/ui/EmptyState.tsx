import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-stone-100 rounded-2xl text-stone-400 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-stone-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-stone-400 max-w-sm mb-6">{description}</p>}
      {action && (
        <Button onClick={action.onClick} icon={action.icon} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
