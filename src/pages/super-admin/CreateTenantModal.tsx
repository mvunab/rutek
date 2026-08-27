import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import type { CreateTenantInput } from '../../services/superAdmin.service';

const PLAN_OPTIONS = [
  { value: 'starter', label: 'Standard' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

export function CreateTenantModal({
  form,
  loading,
  onClose,
  onChange,
  onSubmit,
}: {
  form: CreateTenantInput;
  loading: boolean;
  onClose: () => void;
  onChange: (form: CreateTenantInput) => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Nuevo Tenant"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onSubmit} disabled={loading}>Crear Tenant</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          id="create-tenant-name"
          label="Nombre *"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="Empresa S.A."
        />
        <Input
          id="create-tenant-rut"
          label="RUT *"
          value={form.rut}
          onChange={(e) => onChange({ ...form, rut: e.target.value })}
          placeholder="76.123.456-7"
        />
        <Select
          id="create-tenant-plan"
          label="Plan"
          value={form.plan}
          onChange={(e) => onChange({ ...form, plan: e.target.value as CreateTenantInput['plan'] })}
          options={PLAN_OPTIONS}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="create-tenant-email"
            label="Email"
            value={form.email || ''}
            onChange={(e) => onChange({ ...form, email: e.target.value })}
            placeholder="email@empresa.cl"
          />
          <Input
            id="create-tenant-phone"
            label="Teléfono"
            value={form.phone || ''}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
            placeholder="+56 9 1234 5678"
          />
        </div>
        <Input
          id="create-tenant-city"
          label="Ciudad"
          value={form.city || ''}
          onChange={(e) => onChange({ ...form, city: e.target.value })}
        />
      </div>
    </Modal>
  );
}
