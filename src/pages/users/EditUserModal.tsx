import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { MANAGED_ROLES, type EditForm } from './usersPageShared';

type EditUserModalProps = {
  idPrefix: string;
  open: boolean;
  form: EditForm;
  error: string | null;
  editing: boolean;
  onChange: (form: EditForm) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function EditUserModal({
  idPrefix,
  open,
  form,
  error,
  editing,
  onChange,
  onClose,
  onSubmit,
}: EditUserModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar usuario"
      titleId={`${idPrefix}-title`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={editing}>
            {editing ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor={`${idPrefix}-name`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nombre *</label>
          <Input id={`${idPrefix}-name`} name="name" autoComplete="name" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="Nombre completo" />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-email`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Email *</label>
          <Input id={`${idPrefix}-email`} name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} placeholder="usuario@empresa.cl" />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-role`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Rol</label>
          <select
            id={`${idPrefix}-role`}
            name="role"
            value={form.role}
            onChange={(e) => onChange({ ...form, role: e.target.value as EditForm['role'] })}
            className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {MANAGED_ROLES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-phone`} className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Teléfono</label>
          <Input id={`${idPrefix}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} placeholder="+56 9 1234 5678" />
        </div>
        {error && (
          <div role="alert" aria-live="polite" className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        <p className="text-[11px] text-stone-400 dark:text-stone-500">
          Para cambiar la contraseña usa el botón de la llave en la tarjeta.
        </p>
      </div>
    </Modal>
  );
}
