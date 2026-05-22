import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | '3xl';
  footer?: ReactNode;
  /** Sin cabecera por defecto; el contenido define título y cierre. */
  bare?: boolean;
  contentClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  full: 'max-w-4xl',
  '3xl': 'max-w-5xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer,
  bare = false,
  contentClassName,
}: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={clsx(
        'relative w-full bg-white border border-stone-200 rounded-2xl shadow-2xl',
        'dark:bg-stone-900 dark:border-stone-700',
        'flex flex-col max-h-[90vh]',
        sizeClasses[size]
      )}>
        {!bare && (title || description) ? (
          <div className="flex items-start justify-between gap-4 p-6 border-b border-stone-100 dark:border-stone-800">
            <div>
              {title ? <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{title}</h2> : null}
              {description ? <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{description}</p> : null}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={16} />} className="flex-shrink-0 -mt-1 -mr-2" aria-label="Cerrar" />
          </div>
        ) : null}
        <div className={clsx('overflow-y-auto flex-1', bare ? contentClassName : clsx('p-6', contentClassName))}>
          {children}
        </div>
        {footer && (
          <div className="border-t border-stone-100 dark:border-stone-800 px-6 py-4 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'secondary'}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-stone-600 dark:text-stone-300">{message}</p>
    </Modal>
  );
}
