import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, TrendingUp, AlertCircle, CheckCircle2,
  Plus, Eye, Pencil, Shield, Activity, Search, Filter,
  ArrowUpRight, Minus, Clock, Globe, Package, Truck, Gauge,
} from 'lucide-react';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { CreateTenantInput } from '../../services/superAdmin.service';

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
  }, []);

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
      {/* Header */}
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

      {/* KPIs globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
            {s && s.total_tenants > 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 size={12} />{s.active_tenants} activos</span>
            )}
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{s?.total_tenants || 0}</p>
          <p className="text-xs text-stone-400">Total Tenants</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Users size={18} className="text-violet-600 dark:text-violet-400" />
            {health && (
              <span className="text-xs text-stone-400">{health.avg_users_per_tenant}/tenant</span>
            )}
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{s?.total_users || 0}</p>
          <p className="text-xs text-stone-400">Usuarios Totales</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Package size={18} className="text-amber-600 dark:text-amber-400" />
            {health && (
              <span className="text-xs text-stone-400">{health.avg_orders_per_tenant}/tenant</span>
            )}
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{s?.total_orders || 0}</p>
          <p className="text-xs text-stone-400">Pedidos Globales</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Truck size={18} className="text-emerald-600 dark:text-emerald-400" />
            {health && (
              <span className={`flex items-center gap-1 text-xs ${health.active_rate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {health.active_rate >= 80 ? <ArrowUpRight size={12} /> : <Minus size={12} />}
                {health.active_rate}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{s?.total_routes || 0}</p>
          <p className="text-xs text-stone-400">Rutas Globales</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            leftIcon={<Search size={16} />}
            placeholder="Buscar tenant por nombre o RUT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
        >
          <option value="all">Todos los planes</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      {/* Grid principal: Tenant cards + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lista de Tenants */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Tenants ({filtered.length})</h2>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Todas las empresas de la plataforma</p>
              </div>
              <Button variant="ghost" size="xs" onClick={() => navigate('/super-admin/tenants')}>
                Ir a gestión completa <ArrowUpRight size={12} />
              </Button>
            </div>

            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 size={40} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                <p className="text-sm text-stone-500 dark:text-stone-400">No se encontraron tenants</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowCreateModal(true)}>
                  <Plus size={14} /> Crear el primero
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {filtered.map((tenant) => {
                  const activity = tenantActivity.find((ta: any) => ta.id === tenant.id);
                  const userCount = activity?.user_count || 0;
                  const orderCount = activity?.order_count || 0;
                  const routeCount = activity?.route_count || 0;

                  return (
                    <div key={tenant.id} className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        tenant.active
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                      }`}>
                        <Building2 size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{tenant.name}</p>
                          {tenant.active ? (
                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full font-medium">Activo</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded-full font-medium">Inactivo</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-stone-400 dark:text-stone-500">{tenant.rut}</span>
                          <span className="text-xs text-stone-300 dark:text-stone-600">·</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${
                            tenant.plan === 'enterprise' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' :
                            tenant.plan === 'professional' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                            'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
                          }`}>{tenant.plan}</span>
                          {tenant.city && (
                            <>
                              <span className="text-xs text-stone-300 dark:text-stone-600">·</span>
                              <span className="text-xs text-stone-400">{tenant.city}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="hidden md:flex items-center gap-6 text-center flex-shrink-0">
                        <div>
                          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{userCount}</p>
                          <p className="text-[10px] text-stone-400">Usuarios</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{orderCount}</p>
                          <p className="text-[10px] text-stone-400">Pedidos</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{routeCount}</p>
                          <p className="text-[10px] text-stone-400">Rutas</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="xs" onClick={() => navigate(`/super-admin/tenants/${tenant.id}`)} title="Ver detalle">
                          <Eye size={14} />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => navigate(`/super-admin/tenants`)} title="Editar">
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => toggleTenantActive(tenant.id, !tenant.active)}
                          title={tenant.active ? 'Desactivar' : 'Activar'}
                        >
                          {tenant.active ? <Minus size={14} className="text-amber-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar derecha */}
        <div className="space-y-4">
          {/* Distribución por rol */}
          {Object.keys(usersByRole).length > 0 && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-violet-600 dark:text-violet-400" />
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Usuarios por rol</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(usersByRole as Record<string, number>).map(([role, count]) => {
                  const total = s?.total_users || 1;
                  const pct = Math.round((Number(count) / total) * 100);
                  const colors: Record<string, string> = {
                    super_admin: 'bg-violet-500',
                    admin: 'bg-blue-500',
                    operator: 'bg-amber-500',
                    driver: 'bg-emerald-500',
                    client: 'bg-rose-500',
                  };
                  return (
                    <div key={role}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-stone-500 capitalize">{role}</span>
                        <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">{count}</span>
                      </div>
                      <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${colors[role] || 'bg-stone-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Planes */}
          {s?.tenants_by_plan && Object.keys(s.tenants_by_plan).length > 0 && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Suscripciones</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(s.tenants_by_plan).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <span className="text-xs capitalize text-stone-500 dark:text-stone-400">{plan}</span>
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-3">Acciones</h3>
            <div className="space-y-2">
              <Button fullWidth variant="primary" onClick={() => setShowCreateModal(true)} icon={<Plus size={14} />}>
                Nuevo Tenant
              </Button>
              <Button fullWidth variant="secondary" onClick={() => navigate('/super-admin/users')} icon={<Users size={14} />}>
                Usuarios Globales
              </Button>
              <Button fullWidth variant="ghost" onClick={() => navigate('/super-admin/observabilidad')} icon={<Gauge size={14} />}>
                Observabilidad
              </Button>
              <Button fullWidth variant="ghost" onClick={() => navigate('/super-admin/tenants')} icon={<Filter size={14} />}>
                Gestión Completa
              </Button>
            </div>
          </div>

          {/* Actividad reciente */}
          {s?.recent_orders && s.recent_orders.length > 0 && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Actividad</h3>
              </div>
              <div className="space-y-2">
                {s.recent_orders.slice(0, 4).map((o: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <Package size={14} className="text-amber-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-stone-700 dark:text-stone-200 truncate">{o.code || 'Pedido'}</p>
                      <p className="text-[10px] text-stone-400 capitalize">{o.status} · {new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal crear tenant */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Nuevo Tenant</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                <AlertCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
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
                  <option value="starter">Starter</option>
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
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Ciudad</label>
                <Input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200 dark:border-stone-800">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleCreate} disabled={loading}>Crear Tenant</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
