import { Check, Key } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PasswordFieldWithToggle } from './PasswordFieldWithToggle';

type PasswordForm = { current: string; next: string; confirm: string };

type PasswordSettingsCardProps = {
  form: PasswordForm;
  onChange: (form: PasswordForm) => void;
  error: string;
  saved: boolean;
  authLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export function PasswordSettingsCard({
  form,
  onChange,
  error,
  saved,
  authLoading,
  onSubmit,
}: PasswordSettingsCardProps) {
  return (
    <Card padding="lg">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
          <Key size={20} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Cambiar contraseña
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Actualiza tu contraseña de acceso a la plataforma.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-4">
          <PasswordFieldWithToggle
            label="Contraseña actual"
            value={form.current}
            onChange={(current) => onChange({ ...form, current })}
            autoComplete="current-password"
            showAriaLabel="Mostrar contraseña actual"
            hideAriaLabel="Ocultar contraseña actual"
          />
          <PasswordFieldWithToggle
            label="Nueva contraseña"
            value={form.next}
            onChange={(next) => onChange({ ...form, next })}
            autoComplete="new-password"
            showAriaLabel="Mostrar nueva contraseña"
            hideAriaLabel="Ocultar nueva contraseña"
          />
          <PasswordFieldWithToggle
            label="Confirmar nueva contraseña"
            value={form.confirm}
            onChange={(confirm) => onChange({ ...form, confirm })}
            autoComplete="new-password"
            showAriaLabel="Mostrar confirmación de contraseña"
            hideAriaLabel="Ocultar confirmación de contraseña"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" disabled={authLoading}>
            {authLoading ? 'Cambiando…' : 'Cambiar contraseña'}
          </Button>
          {saved && (
            <span
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"
              role="status"
              aria-live="polite"
            >
              <Check size={16} aria-hidden />
              Contraseña actualizada
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
