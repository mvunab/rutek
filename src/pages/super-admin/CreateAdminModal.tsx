import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

type AdminForm = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
};

export function CreateAdminModal({
  form,
  loading,
  createError,
  onClose,
  onChange,
  onSubmit,
}: {
  form: AdminForm;
  loading: boolean;
  createError: string | null;
  onClose: () => void;
  onChange: (form: AdminForm) => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Nuevo Usuario"
      titleId="new-user-title"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onSubmit} disabled={loading}>
            {loading ? 'Creando…' : 'Crear Usuario'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="new-user-name" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nombre *</label>
          <Input id="new-user-name" name="name" autoComplete="name" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="Nombre completo" />
        </div>
        <div>
          <label htmlFor="new-user-email" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Email *</label>
          <Input id="new-user-email" name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} placeholder="usuario@empresa.cl" />
        </div>
        <div>
          <label htmlFor="new-user-password" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Contraseña *</label>
          <Input id="new-user-password" name="new-password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => onChange({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
        </div>
        <div>
          <label htmlFor="new-user-role" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Rol</label>
          <select
            id="new-user-role"
            name="role"
            value={form.role}
            onChange={(e) => onChange({ ...form, role: e.target.value })}
            className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <option value="admin">Admin</option>
            <option value="operator">Operativo</option>
          </select>
        </div>
        <div>
          <label htmlFor="new-user-phone" className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Teléfono</label>
          <Input id="new-user-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} placeholder="+56 9 1234 5678" />
        </div>
        {createError && (
          <div role="alert" aria-live="polite" className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
            <p className="text-xs text-red-700 dark:text-red-300">{createError}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
