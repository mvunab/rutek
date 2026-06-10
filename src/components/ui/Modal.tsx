import { useEffect, useState, type ReactNode } from 'react';
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
        className="absolute inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-modal-backdrop-enter motion-reduce:animate-none"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          'relative w-full bg-white border border-stone-200 rounded-2xl shadow-2xl',
          'dark:bg-stone-900 dark:border-stone-700',
          'flex flex-col max-h-[90vh]',
          'animate-modal-content-enter motion-reduce:animate-none',
          sizeClasses[size],
        )}
      >
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

interface TypeToConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  /** Texto exacto que el usuario debe escribir (comparación sin distinguir mayúsculas). */
  confirmPhrase?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export function TypeToConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmPhrase = 'eliminar',
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  loading = false,
}: TypeToConfirmModalProps) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const canConfirm =
    typed.trim().toLowerCase() === confirmPhrase.trim().toLowerCase();

  const handleConfirm = () => {
    if (!canConfirm || loading) return;
    void Promise.resolve(onConfirm());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="text-sm text-stone-600 dark:text-stone-300">{message}</div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
          Escribe <span translate="no" className="font-mono text-red-600 dark:text-red-400">{confirmPhrase}</span> para confirmar
          <input
            type="text"
            name="delete_confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={loading}
            className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            placeholder={confirmPhrase}
            aria-describedby="type-to-confirm-hint"
          />
        </label>
        <p id="type-to-confirm-hint" className="text-xs text-stone-500 dark:text-stone-400">
          Esta acción no se puede deshacer.
        </p>
      </div>
    </Modal>
  );
}
