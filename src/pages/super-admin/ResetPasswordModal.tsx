import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export function ResetPasswordModal({
  userName,
  newPassword,
  loading,
  resetError,
  onClose,
  onPasswordChange,
  onGenerate,
  onSubmit,
}: {
  userName: string;
  newPassword: string;
  loading: boolean;
  resetError: string | null;
  onClose: () => void;
  onPasswordChange: (password: string) => void;
  onGenerate: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Resetear Contraseña"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onSubmit} disabled={loading || !newPassword}>
            {loading ? 'Reseteando…' : 'Resetear Contraseña'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Se reseteará la contraseña de <strong>{userName}</strong>. Copia la nueva contraseña y entrégasela al usuario por un canal seguro: no se envía email automático.
        </p>
        <div>
          <Input
            id="reset-pw-input"
            label="Nueva contraseña"
            name="password"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={newPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
          <div className="mt-2">
            <Button variant="ghost" size="sm" onClick={onGenerate}>
              Generar
            </Button>
          </div>
        </div>
        {resetError && (
          <div role="alert" aria-live="polite" className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
            <p className="text-xs text-red-700 dark:text-red-300">{resetError}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
