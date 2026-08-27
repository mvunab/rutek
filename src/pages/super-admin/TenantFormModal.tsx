import { Key, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import type { CreateTenantInput } from '../../services/superAdmin.service';

const PLAN_OPTIONS = [
  { value: 'starter', label: 'Standard' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

export function TenantFormModal({
  editing,
  form,
  loading,
  showAdminSection,
  generatedPassword,
  onClose,
  onChange,
  onSubmit,
  onToggleAdminSection,
  onGeneratePassword,
}: {
  editing: unknown;
  form: CreateTenantInput;
  loading: boolean;
  showAdminSection: boolean;
  generatedPassword: string;
  onClose: () => void;
  onChange: (form: CreateTenantInput) => void;
  onSubmit: () => void;
  onToggleAdminSection: () => void;
  onGeneratePassword: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Editar Tenant' : 'Nuevo Tenant'}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onSubmit} disabled={loading}>
            {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Tenant'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          id="tenant-form-name"
          label="Nombre *"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="Empresa S.A."
        />
        <Input
          id="tenant-form-rut"
          label="RUT *"
          value={form.rut}
          onChange={(e) => onChange({ ...form, rut: e.target.value })}
          placeholder="76.123.456-7"
        />
        <Select
          id="tenant-form-plan"
          label="Plan"
          value={form.plan}
          onChange={(e) => onChange({ ...form, plan: e.target.value as CreateTenantInput['plan'] })}
          options={PLAN_OPTIONS}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="tenant-form-email"
            label="Email"
            value={form.email || ''}
            onChange={(e) => onChange({ ...form, email: e.target.value })}
            placeholder="email@empresa.cl"
          />
          <Input
            id="tenant-form-phone"
            label="Teléfono"
            value={form.phone || ''}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
            placeholder="+56 9 1234 5678"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="tenant-form-city"
            label="Ciudad"
            value={form.city || ''}
            onChange={(e) => onChange({ ...form, city: e.target.value })}
          />
          <Input
            id="tenant-form-region"
            label="Región"
            value={form.region || ''}
            onChange={(e) => onChange({ ...form, region: e.target.value })}
          />
        </div>
        <Input
          id="tenant-form-address"
          label="Dirección"
          value={form.address || ''}
          onChange={(e) => onChange({ ...form, address: e.target.value })}
        />

        {!editing && (
          <div className="border-t border-stone-200 dark:border-stone-800 pt-4 mt-2">
            <button
              type="button"
              onClick={onToggleAdminSection}
              className="flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mb-3"
            >
              <UserPlus size={16} aria-hidden />
              {showAdminSection ? 'Ocultar' : 'Crear administrador del tenant'}
            </button>

            {showAdminSection && (
              <div className="space-y-3 bg-violet-50/50 dark:bg-violet-950/20 p-4 rounded-lg border border-violet-100 dark:border-violet-900/50">
                <div className="flex items-center gap-2 mb-1">
                  <Key size={14} className="text-violet-600 dark:text-violet-400" aria-hidden />
                  <p className="text-xs font-medium text-violet-700 dark:text-violet-300">Se creará un usuario admin para este tenant</p>
                </div>
                <Input
                  id="tenant-form-admin-name"
                  label="Nombre del admin *"
                  value={form.adminName || ''}
                  onChange={(e) => onChange({ ...form, adminName: e.target.value })}
                  placeholder="Nombre completo"
                />
                <Input
                  id="tenant-form-admin-email"
                  label="Email del admin *"
                  type="email"
                  value={form.adminEmail || ''}
                  onChange={(e) => onChange({ ...form, adminEmail: e.target.value })}
                  placeholder="admin@empresa.cl"
                />
                <div>
                  <Input
                    id="tenant-form-admin-password"
                    label="Contraseña temporal *"
                    type="text"
                    value={form.adminPassword || ''}
                    onChange={(e) => onChange({ ...form, adminPassword: e.target.value })}
                    placeholder="Se generó automáticamente"
                  />
                  <div className="mt-2">
                    <Button variant="ghost" size="sm" onClick={onGeneratePassword}>
                      Generar
                    </Button>
                  </div>
                  {generatedPassword && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Copia esta contraseña, se enviará por correo al admin
                    </p>
                  )}
                </div>
                <Input
                  id="tenant-form-admin-phone"
                  label="Teléfono del admin"
                  value={form.adminPhone || ''}
                  onChange={(e) => onChange({ ...form, adminPhone: e.target.value })}
                  placeholder="+56 9 1234 5678"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
