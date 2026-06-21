import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, X, CheckCircle2, AlertCircle, Key, UserPlus } from 'lucide-react';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatTenantPlanLabel } from '../../lib/tenantPlan';
import type { CreateTenantInput } from '../../services/superAdmin.service';

export function TenantsPage() {
  const navigate = useNavigate();
  const { tenants, loading, error, fetchTenants, createTenant, updateTenant, deleteTenant, toggleTenantActive } = useSuperAdminStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<CreateTenantInput>({ name: '', rut: '', plan: 'starter' });
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showAdminSection, setShowAdminSection] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const openCreate = () => {
    setEditing(null);
    const pass = generatePassword();
    setGeneratedPassword(pass);
    setForm({ name: '', rut: '', plan: 'starter', adminPassword: pass });
    setShowAdminSection(true);
    setShowModal(true);
  };

  const openEdit = (tenant: any) => {
    setEditing(tenant);
    setForm({
      name: tenant.name,
      rut: tenant.rut,
      plan: tenant.plan,
      legalName: tenant.legal_name,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      city: tenant.city,
      region: tenant.region,
    });
    setShowAdminSection(false);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.rut) return;
    if (editing) {
      await updateTenant(editing.id, form);
    } else {
      if (showAdminSection && (!form.adminName || !form.adminEmail || !form.adminPassword)) return;
      await createTenant(form);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTenant(id);
    setConfirmDelete(null);
  };

  const handleToggle = async (id: string, active: boolean) => {
    await toggleTenantActive(id, active);
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

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 dark:bg-stone-800/50">
            <tr>
              <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Tenant</th>
              <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Plan</th>
              <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Estado</th>
              <th className="text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Creado</th>
              <th className="text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-5 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {filtered.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{tenant.name}</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">{tenant.rut}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    tenant.plan === 'enterprise' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' :
                    tenant.plan === 'professional' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                    'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
                  }`}>
                    {formatTenantPlanLabel(tenant.plan)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button onClick={() => handleToggle(tenant.id, !tenant.active)} className="flex items-center gap-1.5 text-xs">
                    {tenant.active ? (
                      <><CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /><span className="text-emerald-700 dark:text-emerald-400 font-medium">Activo</span></>
                    ) : (
                      <><AlertCircle size={14} className="text-red-600 dark:text-red-400" /><span className="text-red-700 dark:text-red-400 font-medium">Inactivo</span></>
                    )}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-xs text-stone-500 dark:text-stone-400">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="xs" onClick={() => openEdit(tenant)} title="Editar">
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => navigate(`/super-admin/tenants/${tenant.id}`)} title="Ver detalle">
                      <Eye size={14} />
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => setConfirmDelete(tenant.id)} title="Eliminar">
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div className="p-8 text-center text-sm text-stone-400 dark:text-stone-500">No se encontraron tenants</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                {editing ? 'Editar Tenant' : 'Nuevo Tenant'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nombre *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Empresa S.A." />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">RUT *</label>
                <Input value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} placeholder="76.123.456-7" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value as any })}
                  className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value="starter">Standard</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Email</label>
                  <Input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.cl" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Teléfono</label>
                  <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+56 9 1234 5678" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Ciudad</label>
                  <Input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Región</label>
                  <Input value={form.region || ''} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Dirección</label>
                <Input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              {!editing && (
                <div className="border-t border-stone-200 dark:border-stone-800 pt-4 mt-2">
                  <button
                    onClick={() => setShowAdminSection(!showAdminSection)}
                    className="flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mb-3"
                  >
                    <UserPlus size={16} />
                    {showAdminSection ? 'Ocultar' : 'Crear administrador del tenant'}
                  </button>

                  {showAdminSection && (
                    <div className="space-y-3 bg-violet-50/50 dark:bg-violet-950/20 p-4 rounded-lg border border-violet-100 dark:border-violet-900/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Key size={14} className="text-violet-600 dark:text-violet-400" />
                        <p className="text-xs font-medium text-violet-700 dark:text-violet-300">Se creará un usuario admin para este tenant</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nombre del admin *</label>
                        <Input value={form.adminName || ''} onChange={(e) => setForm({ ...form, adminName: e.target.value })} placeholder="Nombre completo" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Email del admin *</label>
                        <Input type="email" value={form.adminEmail || ''} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@empresa.cl" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Contraseña temporal *</label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={form.adminPassword || ''}
                            onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                            placeholder="Se generó automáticamente"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const pass = generatePassword();
                              setGeneratedPassword(pass);
                              setForm({ ...form, adminPassword: pass });
                            }}
                            className="flex-shrink-0"
                          >
                            Generar
                          </Button>
                        </div>
                        {generatedPassword && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Copia esta contraseña, se enviará por correo al admin
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Teléfono del admin</label>
                        <Input value={form.adminPhone || ''} onChange={(e) => setForm({ ...form, adminPhone: e.target.value })} placeholder="+56 9 1234 5678" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 dark:border-stone-800">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Tenant'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-red-500" />
              <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Eliminar Tenant</h3>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">¿Estás seguro? Esta acción eliminará todos los datos asociados.</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="primary" onClick={() => handleDelete(confirmDelete)} disabled={loading}>
                {loading ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
