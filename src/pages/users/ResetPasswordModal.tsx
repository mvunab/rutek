import type { User } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { generatePassword } from './usersPageShared';

type ResetPasswordModalProps = {
  idPrefix: string;
  target: User | null;
  value: string;
  error: string | null;
  resetting: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ResetPasswordModal({
  idPrefix,
  target,
  value,
  error,
  resetting,
  onChange,
  onClose,
  onSubmit,
}: ResetPasswordModalProps) {
  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title="Resetear contraseña"
      titleId={`${idPrefix}-title`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={resetting || !value}>
            {resetting ? 'Reseteando…' : 'Resetear contraseña'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {target && (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Se reseteará la contraseña de <strong>{target.name}</strong>. Copia la nueva contraseña y entrégasela al usuario por un canal seguro: no se envía email automático.
          </p>
        )}
        <div>
          <label htmlFor={`${idPrefix}-pw`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nueva contraseña</label>
          <div className="flex gap-2">
            <Input id={`${idPrefix}-pw`} name="password" type="text" autoComplete="off" spellCheck={false} value={value} onChange={(e) => onChange(e.target.value)} />
            <Button variant="ghost" size="sm" onClick={() => onChange(generatePassword())}>
              Generar
            </Button>
          </div>
        </div>
        {error && (
          <div role="alert" aria-live="polite" className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
