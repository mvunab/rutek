import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ROLE_OPTIONS, type EditForm } from './tenantDetailUtils';

export function EditUserModal({
  form,
  loading,
  editError,
  onClose,
  onChange,
  onSubmit,
}: {
  form: EditForm;
  loading: boolean;
  editError: string | null;
  onClose: () => void;
  onChange: (form: EditForm) => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Editar usuario"
      titleId="edit-user-title"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onSubmit} disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="edit-user-name" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nombre *</label>
          <Input
            id="edit-user-name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="Nombre completo"
          />
        </div>
        <div>
          <label htmlFor="edit-user-email" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Email *</label>
          <Input
            id="edit-user-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            value={form.email}
            onChange={(e) => onChange({ ...form, email: e.target.value })}
            placeholder="usuario@empresa.cl"
          />
        </div>
        <div>
          <label htmlFor="edit-user-role" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Rol</label>
          <select
            id="edit-user-role"
            name="role"
            value={form.role}
            onChange={(e) => onChange({ ...form, role: e.target.value })}
            className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="edit-user-phone" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Teléfono</label>
          <Input
            id="edit-user-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
            placeholder="+56 9 1234 5678"
          />
        </div>
        {editError && (
          <div role="alert" aria-live="polite" className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
            <p className="text-xs text-red-700 dark:text-red-300">{editError}</p>
          </div>
        )}
        <p className="text-[11px] text-stone-400 dark:text-stone-500">
          Para cambiar la contraseña usa el botón de la llave en la tabla.
        </p>
      </div>
    </Modal>
  );
}
