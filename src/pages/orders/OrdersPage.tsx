import { useState } from 'react';
import {
  Plus, Search, Filter, Package, MapPin, Weight,
  Edit2, Trash2, Eye, Link2, X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { OrderStatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useOrderStore } from '../../store/useOrderStore';
import { useClientStore } from '../../store/useClientStore';
import { useRouteStore } from '../../store/useRouteStore';
import type { Order, OrderStatus, OrderPriority, OrderItem } from '../../types';
import { clsx } from 'clsx';

interface OrderFormData {
  clientId: string;
  priority: OrderPriority;
  originStreet: string;
  originCity: string;
  destStreet: string;
  destCity: string;
  destRegion: string;
  estimatedDelivery: string;
  notes: string;
  items: OrderItem[];
}

const emptyForm: OrderFormData = {
  clientId: '',
  priority: 'medium',
  originStreet: 'Bodega Central, Av. Principal 100',
  originCity: 'Santiago',
  destStreet: '',
  destCity: '',
  destRegion: 'Metropolitana',
  estimatedDelivery: '',
  notes: '',
  items: [{ id: '1', description: '', quantity: 1, weight: 1, volume: 0.1, fragile: false }],
};

interface OrderFormProps {
  initial?: Partial<OrderFormData>;
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

function OrderForm({ initial = {}, onSubmit, onCancel, submitLabel = 'Guardar' }: OrderFormProps) {
  const [form, setForm] = useState<OrderFormData>({ ...emptyForm, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { clients } = useClientStore();

  const setField = (field: keyof OrderFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number | boolean) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((it, i) => i === index ? { ...it, [field]: value } : it),
    }));
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { id: String(Date.now()), description: '', quantity: 1, weight: 1, volume: 0.1, fragile: false }],
    }));
  };

  const removeItem = (index: number) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.clientId) errs.clientId = 'Selecciona un cliente';
    if (!form.destStreet.trim()) errs.destStreet = 'Requerido';
    if (!form.destCity.trim()) errs.destCity = 'Requerido';
    if (!form.estimatedDelivery) errs.estimatedDelivery = 'Requerido';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(form);
  };

  const clientOptions = [
    { value: '', label: 'Seleccionar cliente...' },
    ...clients.filter(c => c.active).map(c => ({ value: c.id, label: c.companyName })),
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Información general</h4>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Cliente" value={form.clientId} onChange={setField('clientId')} options={clientOptions} error={errors.clientId} containerClassName="col-span-2" />
          <Select label="Prioridad" value={form.priority} onChange={setField('priority')} options={priorityOptions} />
          <Input label="Entrega estimada" type="date" value={form.estimatedDelivery} onChange={setField('estimatedDelivery')} error={errors.estimatedDelivery} />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Origen</h4>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Dirección" value={form.originStreet} onChange={setField('originStreet')} containerClassName="col-span-2" />
          <Input label="Ciudad" value={form.originCity} onChange={setField('originCity')} />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Destino</h4>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Dirección" placeholder="Calle y número" value={form.destStreet} onChange={setField('destStreet')} error={errors.destStreet} containerClassName="col-span-2" />
          <Input label="Ciudad" placeholder="Santiago" value={form.destCity} onChange={setField('destCity')} error={errors.destCity} />
          <Input label="Región" value={form.destRegion} onChange={setField('destRegion')} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Artículos</h4>
          <Button variant="ghost" size="xs" onClick={addItem} icon={<Plus size={12} />}>Agregar</Button>
        </div>
        <div className="space-y-2">
          {form.items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-stone-50 rounded-lg border border-stone-200">
              <div className="col-span-4">
                <label className="text-xs text-stone-500 mb-1 block">Descripción</label>
                <input
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Ej: Cajas de conservas"
                  className="w-full bg-white border border-stone-300 rounded-md px-2 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-stone-500 mb-1 block">Cantidad</label>
                <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} className="w-full bg-white border border-stone-300 rounded-md px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-stone-500 mb-1 block">Peso (kg)</label>
                <input type="number" min={0.1} step={0.1} value={item.weight} onChange={(e) => updateItem(index, 'weight', Number(e.target.value))} className="w-full bg-white border border-stone-300 rounded-md px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-stone-500 mb-1 block">Frágil</label>
                <button
                  type="button"
                  onClick={() => updateItem(index, 'fragile', !item.fragile)}
                  className={clsx('w-full py-1.5 rounded-md text-xs font-medium border transition-colors', item.fragile ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-stone-500 border-stone-300')}
                >
                  {item.fragile ? 'Sí' : 'No'}
                </button>
              </div>
              <div className="col-span-2 flex justify-end">
                {form.items.length > 1 && (
                  <button onClick={() => removeItem(index)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Textarea label="Notas" placeholder="Instrucciones especiales de entrega..." value={form.notes} onChange={setField('notes')} rows={2} />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={`Pedido ${order.code}`} size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <PriorityBadge priority={order.priority} />
          <span className="text-xs text-stone-400">Creado: {order.createdAt}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Origen</p>
            <p className="text-sm text-stone-800">{order.origin.street}</p>
            <p className="text-xs text-stone-400">{order.origin.city}, {order.origin.region}</p>
          </div>
          <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Destino</p>
            <p className="text-sm text-stone-800">{order.destination.street}</p>
            <p className="text-xs text-stone-400">{order.destination.city}, {order.destination.region}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Cliente</p>
          <p className="text-sm text-stone-800">{order.clientName}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Artículos ({order.items.length})</p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div>
                  <p className="text-sm text-stone-800">{item.description}</p>
                  <p className="text-xs text-stone-400">{item.quantity} unidades · {item.weight}kg c/u</p>
                </div>
                {item.fragile && <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Frágil</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Weight size={13} />
              <span className="font-semibold text-stone-700">{order.totalWeight} kg</span> total
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-700 mb-1">Notas</p>
            <p className="text-xs text-stone-700">{order.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-xs text-stone-400">Entrega estimada</p>
            <p className="text-sm font-semibold text-stone-800">{order.estimatedDelivery}</p>
          </div>
          <div className="text-center p-3 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-xs text-stone-400">Entrega real</p>
            <p className="text-sm font-semibold text-stone-800">{order.actualDelivery ?? '—'}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AssignRouteModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { routes } = useRouteStore();
  const { assignToRoute } = useOrderStore();
  const { addOrderToRoute } = useRouteStore();

  const availableRoutes = routes.filter(r => r.status === 'planned' || r.status === 'active');

  const handleAssign = (routeId: string) => {
    assignToRoute(order.id, routeId);
    addOrderToRoute(routeId, order.id);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Asignar a ruta" description={`Pedido ${order.code}`} size="md">
      {availableRoutes.length === 0 ? (
        <p className="text-sm text-stone-400 text-center py-6">No hay rutas disponibles para asignar</p>
      ) : (
        <div className="space-y-2">
          {availableRoutes.map((route) => (
            <button
              key={route.id}
              onClick={() => handleAssign(route.id)}
              className="w-full flex items-center justify-between p-4 bg-stone-50 hover:bg-primary-50 border border-stone-200 hover:border-primary-200 rounded-lg transition-all text-left"
            >
              <div>
                <p className="text-sm font-semibold text-stone-800">{route.name}</p>
                <p className="text-xs text-stone-400 mt-0.5">{route.code} · {route.orderIds.length} pedidos · {route.estimatedDistance}km</p>
              </div>
              <span className="text-xs text-primary-600 font-medium">Asignar →</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
  pending: 'confirmed',
  confirmed: 'in_transit',
  in_transit: 'delivered',
  delivered: null,
  cancelled: null,
  returned: null,
};

const nextStatusLabel: Partial<Record<OrderStatus, string>> = {
  pending: 'Confirmar',
  confirmed: 'Despachar',
  in_transit: 'Marcar entregado',
};

export function OrdersPage() {
  const { getFilteredOrders, filters, setFilters, addOrder, updateOrder, updateOrderStatus, deleteOrder } = useOrderStore();
  const { clients } = useClientStore();

  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [assignOrder, setAssignOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredOrders = getFilteredOrders();

  const handleAdd = (data: OrderFormData) => {
    const client = clients.find(c => c.id === data.clientId);
    addOrder({
      clientId: data.clientId,
      clientName: client?.companyName ?? '',
      status: 'pending',
      priority: data.priority,
      origin: { street: data.originStreet, city: data.originCity, region: 'Metropolitana' },
      destination: { street: data.destStreet, city: data.destCity, region: data.destRegion },
      items: data.items,
      totalWeight: data.items.reduce((acc, i) => acc + i.quantity * i.weight, 0),
      totalVolume: data.items.reduce((acc, i) => acc + i.quantity * i.volume, 0),
      estimatedDelivery: data.estimatedDelivery,
      notes: data.notes,
    });
    setShowForm(false);
  };

  const handleEdit = (data: OrderFormData) => {
    if (!editingOrder) return;
    const client = clients.find(c => c.id === data.clientId);
    updateOrder(editingOrder.id, {
      clientId: data.clientId,
      clientName: client?.companyName ?? editingOrder.clientName,
      priority: data.priority,
      destination: { street: data.destStreet, city: data.destCity, region: data.destRegion },
      estimatedDelivery: data.estimatedDelivery,
      notes: data.notes,
      items: data.items,
      totalWeight: data.items.reduce((acc, i) => acc + i.quantity * i.weight, 0),
      totalVolume: data.items.reduce((acc, i) => acc + i.quantity * i.volume, 0),
    });
    setEditingOrder(null);
  };

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'in_transit', label: 'En tránsito' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'Todas las prioridades' },
    { value: 'urgent', label: 'Urgente' },
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Media' },
    { value: 'low', label: 'Baja' },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por código, cliente o ciudad..."
              value={filters.search ?? ''}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            />
          </div>
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} icon={<Filter size={15} />}>
            Filtros
            {(filters.status !== 'all' || filters.priority !== 'all') && (
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary-500" />
            )}
          </Button>
          <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
            Nuevo pedido
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 p-4 bg-white border border-stone-200 rounded-xl shadow-sm">
            <Select
              value={filters.status ?? 'all'}
              onChange={(e) => setFilters({ status: e.target.value as OrderStatus | 'all' })}
              options={statusOptions}
              containerClassName="w-48"
            />
            <Select
              value={filters.priority ?? 'all'}
              onChange={(e) => setFilters({ priority: e.target.value as 'all' | 'low' | 'medium' | 'high' | 'urgent' })}
              options={priorityOptions}
              containerClassName="w-48"
            />
            <Button variant="ghost" size="sm" onClick={() => { setFilters({ status: 'all', priority: 'all' }); setShowFilters(false); }}>
              Limpiar
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-stone-500">
        <span className="font-semibold text-stone-800">{filteredOrders.length}</span> pedidos
        {filters.status !== 'all' && <span>· filtrado por estado</span>}
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={<Package size={32} />}
          title="No se encontraron pedidos"
          description="Crea un nuevo pedido o ajusta los filtros"
          action={{ label: 'Crear pedido', onClick: () => setShowForm(true), icon: <Plus size={14} /> }}
        />
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Código</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Destino</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Prioridad</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Entrega</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredOrders.map((order) => {
                const nextStatus = statusFlow[order.status];
                const nextLabel = nextStatusLabel[order.status];
                return (
                  <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-stone-700">{order.code}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-stone-700 truncate max-w-[160px]">{order.clientName}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <MapPin size={11} className="text-stone-400" />
                        <span className="truncate max-w-[140px]">{order.destination.city}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={order.priority} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-stone-500">{order.estimatedDelivery}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {nextStatus && nextLabel && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => updateOrderStatus(order.id, nextStatus)}
                            className="text-primary-600 hover:text-primary-700 text-[11px]"
                          >
                            {nextLabel}
                          </Button>
                        )}
                        <Button variant="ghost" size="xs" onClick={() => setDetailOrder(order)} icon={<Eye size={13} />} />
                        {!order.routeId && order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <Button variant="ghost" size="xs" onClick={() => setAssignOrder(order)} icon={<Link2 size={13} />} />
                        )}
                        <Button variant="ghost" size="xs" onClick={() => setEditingOrder(order)} icon={<Edit2 size={13} />} />
                        <Button variant="ghost" size="xs" onClick={() => setDeleteTarget(order)} icon={<Trash2 size={13} />} className="hover:text-red-600" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Crear pedido" size="xl">
        <OrderForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} submitLabel="Crear pedido" />
      </Modal>

      {editingOrder && (
        <Modal open onClose={() => setEditingOrder(null)} title="Modificar pedido" description={editingOrder.code} size="xl">
          <OrderForm
            initial={{
              clientId: editingOrder.clientId,
              priority: editingOrder.priority,
              destStreet: editingOrder.destination.street,
              destCity: editingOrder.destination.city,
              destRegion: editingOrder.destination.region,
              estimatedDelivery: editingOrder.estimatedDelivery,
              notes: editingOrder.notes ?? '',
              items: editingOrder.items,
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditingOrder(null)}
            submitLabel="Guardar cambios"
          />
        </Modal>
      )}

      {detailOrder && <OrderDetail order={detailOrder} onClose={() => setDetailOrder(null)} />}
      {assignOrder && <AssignRouteModal order={assignOrder} onClose={() => setAssignOrder(null)} />}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deleteOrder(deleteTarget.id); setDeleteTarget(null); } }}
        title="Eliminar pedido"
        message={`¿Seguro que deseas eliminar el pedido "${deleteTarget?.code}"?`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
