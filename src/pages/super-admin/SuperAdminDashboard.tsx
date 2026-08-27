import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Globe, Plus, Search } from 'lucide-react';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import type { CreateTenantInput } from '../../services/superAdmin.service';
import { CreateTenantModal } from './CreateTenantModal';
import { SuperAdminKpiCards } from './SuperAdminKpiCards';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminTenantList } from './SuperAdminTenantList';

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { stats, tenants, loading, fetchStats, fetchTenants, createTenant, toggleTenantActive } = useSuperAdminStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateTenantInput>({ name: '', rut: '', plan: 'starter' });
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchStats();
    fetchTenants();
  }, [fetchStats, fetchTenants]);

  const handleCreate = async () => {
    if (!form.name || !form.rut) return;
    await createTenant(form);
    setShowCreateModal(false);
    setForm({ name: '', rut: '', plan: 'starter' });
  };

  const filtered = tenants.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.rut.includes(search);
    const matchPlan = planFilter === 'all' || t.plan === planFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? t.active : !t.active);
    return matchSearch && matchPlan && matchStatus;
  });

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3">
        <Activity size={20} className="animate-spin text-primary-600" />
        <span className="text-sm text-stone-500">Cargando...</span>
      </div>
    </div>;
  }

  const s = stats;
  const tenantActivity = (s as any)?.tenant_activity || [];
  const usersByRole = (s as any)?.users_by_role || {};
  const health = (s as any)?.system_health;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe size={24} className="text-violet-600 dark:text-violet-400" />
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Super Admin</h1>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Gestión global de la plataforma SaaS</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)} icon={<Plus size={16} />}>
          Nuevo Tenant
        </Button>
      </div>

      <SuperAdminKpiCards stats={s} health={health} />

      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            id="super-admin-tenant-search"
            label="Buscar"
            leftIcon={<Search size={16} />}
            placeholder="Buscar tenant por nombre o RUT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          id="super-admin-plan-filter"
          label="Plan"
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los planes' },
            { value: 'starter', label: 'Standard' },
            { value: 'professional', label: 'Professional' },
            { value: 'enterprise', label: 'Enterprise' },
          ]}
          containerClassName="w-48"
        />
        <Select
          id="super-admin-status-filter"
          label="Estado"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'active', label: 'Activos' },
            { value: 'inactive', label: 'Inactivos' },
          ]}
          containerClassName="w-40"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <SuperAdminTenantList
          filtered={filtered}
          tenantActivity={tenantActivity}
          onNavigate={navigate}
          onToggleActive={toggleTenantActive}
          onCreateClick={() => setShowCreateModal(true)}
        />
        <SuperAdminSidebar
          stats={s}
          usersByRole={usersByRole}
          onNavigate={navigate}
          onCreateClick={() => setShowCreateModal(true)}
        />
      </div>

      {showCreateModal && (
        <CreateTenantModal
          form={form}
          loading={loading}
          onClose={() => setShowCreateModal(false)}
          onChange={setForm}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
