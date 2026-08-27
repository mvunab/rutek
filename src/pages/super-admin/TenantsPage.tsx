import { useEffect, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus } from 'lucide-react';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DeleteTenantModal } from './DeleteTenantModal';
import { TenantFormModal } from './TenantFormModal';
import { TenantsTable } from './TenantsTable';
import { generatePassword } from './tenantUtils';
import { initialModalState, tenantModalReducer } from './tenantsPageModalState';

export function TenantsPage() {
  const navigate = useNavigate();
  const { tenants, loading, error, fetchTenants, createTenant, updateTenant, deleteTenant, toggleTenantActive } = useSuperAdminStore();
  const [modal, dispatchModal] = useReducer(tenantModalReducer, initialModalState);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const openCreate = () => {
    dispatchModal({ type: 'open_create' });
  };

  const openEdit = (tenant: any) => {
    dispatchModal({
      type: 'open_edit',
      tenant,
      form: {
        name: tenant.name,
        rut: tenant.rut,
        plan: tenant.plan,
        legalName: tenant.legal_name,
        email: tenant.email,
        phone: tenant.phone,
        address: tenant.address,
        city: tenant.city,
        region: tenant.region,
      },
    });
  };

  const handleSubmit = async () => {
    if (!modal.form.name || !modal.form.rut) return;
    if (modal.editing) {
      await updateTenant((modal.editing as { id: string }).id, modal.form);
    } else {
      if (modal.showAdminSection && (!modal.form.adminName || !modal.form.adminEmail || !modal.form.adminPassword)) return;
      await createTenant(modal.form);
    }
    dispatchModal({ type: 'close' });
  };

  const handleDelete = async (id: string) => {
    await deleteTenant(id);
    setConfirmDelete(null);
  };

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.rut.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Gestión de Tenants</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">{tenants.length} tenants registrados</p>
        </div>
        <Button variant="primary" onClick={openCreate} icon={<Plus size={16} />}>
          Nuevo Tenant
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input placeholder="Buscar por nombre o RUT..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <TenantsTable
        filtered={filtered}
        loading={loading}
        onEdit={openEdit}
        onView={(tenantId) => navigate(`/super-admin/tenants/${tenantId}`)}
        onDelete={setConfirmDelete}
        onToggle={(id, active) => void toggleTenantActive(id, active)}
      />

      {modal.open && (
        <TenantFormModal
          editing={modal.editing}
          form={modal.form}
          loading={loading}
          showAdminSection={modal.showAdminSection}
          generatedPassword={modal.generatedPassword}
          onClose={() => dispatchModal({ type: 'close' })}
          onChange={(form) => dispatchModal({ type: 'set_form', form })}
          onSubmit={handleSubmit}
          onToggleAdminSection={() => dispatchModal({ type: 'toggle_admin_section' })}
          onGeneratePassword={() => {
            const pass = generatePassword();
            dispatchModal({ type: 'regenerate_password', password: pass });
          }}
        />
      )}

      {confirmDelete && (
        <DeleteTenantModal
          loading={loading}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}
