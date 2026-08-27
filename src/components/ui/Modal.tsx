import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react';
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
  /** id del título para aria-labelledby (opcional). */
  titleId?: string;
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
  titleId,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleDomId = titleId ?? (title ? 'rutek-modal-title' : undefined);
  const onCloseEvent = useEffectEvent(onClose);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onCloseEvent();
    };
    /** Cierre al click en el backdrop nativo (`showModal`), no en el panel. */
    const onBackdropClick = (e: MouseEvent) => {
      if (e.target === dialog) onCloseEvent();
    };
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('click', onBackdropClick);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('click', onBackdropClick);
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleDomId}
      className={clsx(
        'fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] border border-stone-200 rounded-2xl shadow-2xl p-0',
        'bg-white dark:bg-stone-900 dark:border-stone-700',
        'flex flex-col max-h-[90vh] open:flex',
        'backdrop:bg-stone-900/40 dark:backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        'animate-modal-content-enter motion-reduce:animate-none',
        sizeClasses[size],
      )}
    >
      {!bare && (title || description) ? (
        <div className="flex items-start justify-between gap-4 p-6 border-b border-stone-100 dark:border-stone-800">
          <div>
            {title ? (
              <h2 id={titleDomId} className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                {title}
              </h2>
            ) : null}
            {description ? <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{description}</p> : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon={<X size={16} />}
            className="flex-shrink-0 -mt-1 -mr-2"
            aria-label="Cerrar"
          />
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
    </dialog>
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
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    setTyped('');
  }

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
