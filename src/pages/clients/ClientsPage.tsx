import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, Mail, MapPin, ArrowRight, Edit2, Trash2, Building2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ClientDeleteModal } from '../../components/clients/ClientDeleteModal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useClientStore } from '../../store/useClientStore';
import { toast } from '../../store/useToastStore';
import type { Client } from '../../types';
import { clsx } from 'clsx';
import { chileRegionSelectOptions } from '../../lib/chileRegions';

interface ClientFormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  rut: string;
  address: string;
  city: string;
  region: string;
  notes: string;
  active: boolean;
}

const emptyForm: ClientFormData = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  rut: '',
  address: '',
  city: '',
  region: '',
  notes: '',
  active: true,
};

interface ClientFormProps {
  initial?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

const EMPTY_INITIAL: Partial<ClientFormData> = {};

function ClientForm({ initial = EMPTY_INITIAL, onSubmit, onCancel, submitLabel = 'Guardar' }: ClientFormProps) {
  const [form, setForm] = useState<ClientFormData>({ ...emptyForm, ...initial });
  const [errors, setErrors] = useState<Partial<ClientFormData>>({});
  const regionOptions = chileRegionSelectOptions(form.region);

  const validate = () => {
    const newErrors: Partial<ClientFormData> = {};
    if (!form.companyName.trim()) newErrors.companyName = 'Requerido';
    if (!form.contactName.trim()) newErrors.contactName = 'Requerido';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email inválido';
    if (!form.phone.trim()) newErrors.phone = 'Requerido';
    if (!form.rut.trim()) newErrors.rut = 'Requerido';
    if (!form.address.trim()) newErrors.address = 'Requerido';
    if (!form.city.trim()) newErrors.city = 'Requerido';
    return newErrors;
  };

  const handleSubmit = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onSubmit(form);
  };

  const set = (field: keyof ClientFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Empresa" placeholder="Razón social" value={form.companyName} onChange={set('companyName')} error={errors.companyName} containerClassName="col-span-2" />
        <Input label="Contacto" placeholder="Nombre del contacto" value={form.contactName} onChange={set('contactName')} error={errors.contactName} />
        <Input label="RUT" placeholder="76.123.456-7" value={form.rut} onChange={set('rut')} error={errors.rut} />
        <Input label="Email" type="email" placeholder="contacto@empresa.cl" value={form.email} onChange={set('email')} error={errors.email} />
        <Input label="Teléfono" placeholder="+56 2 2345 6789" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <Input label="Dirección" placeholder="Calle y número" value={form.address} onChange={set('address')} error={errors.address} containerClassName="col-span-2" />
        <Input label="Ciudad" placeholder="Santiago" value={form.city} onChange={set('city')} error={errors.city} />
        <Select
          label="Región"
          value={form.region}
          onChange={set('region')}
          options={[{ value: '', label: 'Seleccionar región…' }, ...regionOptions]}
        />
      </div>
      <Textarea label="Notas" placeholder="Instrucciones especiales, horarios, etc." value={form.notes} onChange={set('notes')} rows={3} />
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          role="switch"
          aria-checked={form.active}
          aria-label="Cliente activo"
          onClick={() => setForm(prev => ({ ...prev, active: !prev.active }))}
          className={clsx(
            'relative w-10 h-5 rounded-full transition-colors',
            form.active ? 'bg-primary-500' : 'bg-stone-300 dark:bg-stone-600'
          )}
        >
          <span className={clsx(
            'absolute top-0.5 h-4 w-4 bg-white dark:bg-stone-200 rounded-full shadow transition-transform',
            form.active ? 'translate-x-5' : 'translate-x-0.5'
          )} aria-hidden />
        </button>
        <span className="text-sm text-stone-600 dark:text-stone-300" aria-hidden>
          Cliente activo
        </span>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}

export function ClientsPage() {
  const navigate = useNavigate();
  const { clients, searchTerm, setSearchTerm, addClient, updateClient, deleteClient, getDeletionImpact, fetchClients } = useClientStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = clients.filter((c) => {
    if (filterStatus === 'active' && !c.active) return false;
    if (filterStatus === 'inactive' && c.active) return false;
    const term = searchTerm.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(term) ||
      c.contactName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term)
    );
  });

  const handleAdd = (data: ClientFormData) => {
    addClient(data);
    setShowForm(false);
  };

  const handleEdit = (data: ClientFormData) => {
    if (editingClient) {
      updateClient(editingClient.id, data);
      setEditingClient(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label
            htmlFor="clients-search"
            className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5"
          >
            Buscar
          </label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" aria-hidden />
            <input
              id="clients-search"
              type="text"
              placeholder="Buscar por empresa, contacto, email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filterStatus === s
                  ? 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-950/45 dark:text-primary-300 dark:border-primary-800'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 border border-transparent'
              )}
            >
              {s === 'all' ? 'Todos' : s === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
          Nuevo cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total clientes', value: clients.length, color: 'text-stone-700 dark:text-stone-200', box: 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800' },
          { label: 'Activos', value: clients.filter(c => c.active).length, color: 'text-emerald-700 dark:text-emerald-300', box: 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-100 dark:border-emerald-900/50' },
          { label: 'Inactivos', value: clients.filter(c => !c.active).length, color: 'text-stone-500 dark:text-stone-400', box: 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800' },
        ].map((s) => (
          <div key={s.label} className={clsx('border rounded-xl p-4 text-center shadow-sm', s.box)}>
            <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 size={32} />}
          title="No se encontraron clientes"
          description="Ajusta los filtros o registra un nuevo cliente"
          action={{ label: 'Nuevo cliente', onClick: () => setShowForm(true), icon: <Plus size={14} /> }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <div key={client.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-md transition-[border-color,box-shadow] shadow-sm group">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div aria-hidden="true" className="size-10 bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-800 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm flex-shrink-0">
                    {client.companyName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">{client.companyName}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{client.contactName}</p>
                  </div>
                </div>
                <Badge variant={client.active ? 'success' : 'slate'}>
                  {client.active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                  {client.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <Mail size={12} className="text-stone-400 dark:text-stone-500 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <Phone size={12} className="text-stone-400 dark:text-stone-500 flex-shrink-0" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <MapPin size={12} className="text-stone-400 dark:text-stone-500 flex-shrink-0" />
                  <span className="truncate">{client.city}, {client.region}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 pt-3 border-t border-stone-100 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">RUT: {client.rut}</span>
                <div className="flex-1" />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/clientes/${client.id}`)}
                  icon={<ArrowRight size={14} aria-hidden />}
                  iconPosition="right"
                >
                  Ver ficha
                </Button>
                <Button variant="ghost" size="xs" onClick={() => setEditingClient(client)} icon={<Edit2 size={13} />} />
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setDeleteTarget(client)}
                  icon={<Trash2 size={13} />}
                  aria-label={`Eliminar cliente ${client.companyName}`}
                  className="text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Registrar cliente" description="Completa los datos del nuevo cliente" size="xl">
        <ClientForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} submitLabel="Registrar cliente" />
      </Modal>

      {editingClient && (
        <Modal open onClose={() => setEditingClient(null)} title="Editar cliente" description={editingClient.companyName} size="xl">
          <ClientForm
            initial={editingClient}
            onSubmit={handleEdit}
            onCancel={() => setEditingClient(null)}
            submitLabel="Guardar cambios"
          />
        </Modal>
      )}

      <ClientDeleteModal
        open={!!deleteTarget}
        client={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        loadImpact={getDeletionImpact}
        onConfirmCascade={async () => {
          if (!deleteTarget) return;
          await deleteClient(deleteTarget.id, { cascade: true });
          toast.info('Cliente eliminado', 'Se eliminaron los datos asociados en cadena.');
        }}
      />
    </div>
  );
}
