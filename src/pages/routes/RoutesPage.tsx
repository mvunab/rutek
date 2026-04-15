import { useState } from 'react';
import {
  Plus, Search, Map, Truck, Clock,
  Edit2, Trash2, Eye, UserCheck, Car, Play,
  CheckCircle2, Package
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RouteStatusBadge, OrderStatusBadge } from '../../components/ui/Badge';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRouteStore } from '../../store/useRouteStore';
import { useOrderStore } from '../../store/useOrderStore';
import { mockUsers, mockVehicles } from '../../data/mockData';
import type { Route, RouteStatus } from '../../types';
import { clsx } from 'clsx';

interface RouteFormData {
  name: string;
  notes: string;
  startTime: string;
  estimatedDistance: number;
  estimatedDuration: number;
}

function RouteForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
}: {
  initial?: Partial<RouteFormData>;
  onSubmit: (data: RouteFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<RouteFormData>({
    name: '',
    notes: '',
    startTime: '08:00',
    estimatedDistance: 0,
    estimatedDuration: 60,
    ...initial,
  });

  const setField = (field: keyof RouteFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
      setForm(prev => ({ ...prev, [field]: val }));
    };

  return (
    <div className="space-y-4">
      <Input label="Nombre de la ruta" placeholder="Ej: Ruta Santiago Norte" value={form.name} onChange={setField('name')} />
      <div className="grid grid-cols-3 gap-3">
        <Input label="Hora de inicio" type="time" value={form.startTime} onChange={setField('startTime')} />
        <Input label="Distancia (km)" type="number" min={0} value={form.estimatedDistance} onChange={setField('estimatedDistance')} />
        <Input label="Duración (min)" type="number" min={0} value={form.estimatedDuration} onChange={setField('estimatedDuration')} />
      </div>
      <Textarea label="Notas" placeholder="Observaciones, instrucciones..." value={form.notes} onChange={setField('notes')} rows={3} />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSubmit(form)} disabled={!form.name.trim()}>{submitLabel}</Button>
      </div>
    </div>
  );
}

function AssignDriverModal({ route, onClose }: { route: Route; onClose: () => void }) {
  const { assignDriver } = useRouteStore();
  const drivers = mockUsers.filter(u => u.role === 'driver' && u.active);

  return (
    <Modal open onClose={onClose} title="Asignar repartidor" description={route.name} size="sm">
      <div className="space-y-2">
        {drivers.map((driver) => (
          <button
            key={driver.id}
            onClick={() => { assignDriver(route.id, driver.id, driver.name); onClose(); }}
            className={clsx(
              'w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left',
              route.driverId === driver.id
                ? 'bg-primary-50 border-primary-200'
                : 'bg-stone-50 border-stone-200 hover:border-stone-300 hover:bg-white'
            )}
          >
            <div className="w-9 h-9 bg-stone-200 rounded-full flex items-center justify-center text-sm font-bold text-stone-600 flex-shrink-0">
              {driver.name.charAt(0)}
            </div>
            <div>
              <p className={clsx('text-sm font-medium', route.driverId === driver.id ? 'text-primary-700' : 'text-stone-800')}>{driver.name}</p>
              <p className="text-xs text-stone-400">{driver.email}</p>
            </div>
            {route.driverId === driver.id && (
              <CheckCircle2 size={16} className="ml-auto text-primary-600" />
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function AssignVehicleModal({ route, onClose }: { route: Route; onClose: () => void }) {
  const { assignVehicle } = useRouteStore();

  const vehicleTypeLabels: Record<string, string> = {
    van: 'Furgoneta',
    truck: 'Camión',
    motorcycle: 'Motocicleta',
    cargo_truck: 'Camión de carga',
  };

  return (
    <Modal open onClose={onClose} title="Asignar vehículo" description={route.name} size="sm">
      <div className="space-y-2">
        {mockVehicles.map((vehicle) => (
          <button
            key={vehicle.id}
            onClick={() => { assignVehicle(route.id, vehicle.id, vehicle.plate); onClose(); }}
            className={clsx(
              'w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left',
              route.vehicleId === vehicle.id
                ? 'bg-primary-50 border-primary-200'
                : vehicle.available
                  ? 'bg-stone-50 border-stone-200 hover:border-stone-300 hover:bg-white'
                  : 'bg-stone-50 border-stone-100 opacity-50 cursor-not-allowed'
            )}
            disabled={!vehicle.available && route.vehicleId !== vehicle.id}
          >
            <div className="p-2 bg-stone-100 rounded-lg flex-shrink-0">
              <Truck size={14} className="text-stone-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800">{vehicle.brand} {vehicle.model}</p>
              <p className="text-xs text-stone-400">{vehicle.plate} · {vehicleTypeLabels[vehicle.type]} · {vehicle.capacity.toLocaleString()} kg</p>
            </div>
            {!vehicle.available && route.vehicleId !== vehicle.id && (
              <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">En uso</span>
            )}
            {route.vehicleId === vehicle.id && (
              <CheckCircle2 size={16} className="text-primary-600" />
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function AddOrdersModal({ route, onClose }: { route: Route; onClose: () => void }) {
  const { orders, assignToRoute } = useOrderStore();
  const { addOrderToRoute } = useRouteStore();

  const availableOrders = orders.filter(
    o => !o.routeId && (o.status === 'pending' || o.status === 'confirmed')
  );

  const handleAssign = (orderId: string) => {
    assignToRoute(orderId, route.id);
    addOrderToRoute(route.id, orderId);
  };

  return (
    <Modal open onClose={onClose} title="Agregar pedidos a ruta" description={route.name} size="lg">
      {availableOrders.length === 0 ? (
        <p className="text-sm text-stone-400 text-center py-6">No hay pedidos disponibles sin ruta asignada</p>
      ) : (
        <div className="space-y-2">
          {availableOrders.map((order) => {
            const isAssigned = route.orderIds.includes(order.id);
            return (
              <div key={order.id} className={clsx(
                'flex items-center gap-4 p-4 rounded-lg border transition-all',
                isAssigned ? 'bg-primary-50 border-primary-200' : 'bg-stone-50 border-stone-200'
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono font-semibold text-stone-700">{order.code}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-stone-400">{order.clientName} · {order.destination.city}</p>
                </div>
                <Button
                  variant={isAssigned ? 'success' : 'secondary'}
                  size="xs"
                  onClick={() => !isAssigned && handleAssign(order.id)}
                  disabled={isAssigned}
                >
                  {isAssigned ? 'Asignado' : 'Asignar'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex justify-end mt-4">
        <Button onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  );
}

function RouteDetail({ route, onClose }: { route: Route; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={route.name} description={route.code} size="xl">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <RouteStatusBadge status={route.status} />
          <span className="text-xs text-stone-400">Creado: {route.createdAt}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-stone-50 rounded-lg p-3 text-center border border-stone-200">
            <p className="text-xl font-bold text-stone-900">{route.estimatedDistance} km</p>
            <p className="text-xs text-stone-400 mt-0.5">Distancia</p>
          </div>
          <div className="bg-stone-50 rounded-lg p-3 text-center border border-stone-200">
            <p className="text-xl font-bold text-stone-900">{Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m</p>
            <p className="text-xs text-stone-400 mt-0.5">Duración est.</p>
          </div>
          <div className="bg-stone-50 rounded-lg p-3 text-center border border-stone-200">
            <p className="text-xl font-bold text-stone-900">{route.orderIds.length}</p>
            <p className="text-xs text-stone-400 mt-0.5">Pedidos</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Repartidor</p>
            {route.driverName ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">
                  {route.driverName.charAt(0)}
                </div>
                <span className="text-sm text-stone-800">{route.driverName}</span>
              </div>
            ) : (
              <span className="text-sm text-stone-400">Sin asignar</span>
            )}
          </div>
          <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Vehículo</p>
            {route.vehiclePlate ? (
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-stone-500" />
                <span className="text-sm text-stone-800">{route.vehiclePlate}</span>
              </div>
            ) : (
              <span className="text-sm text-stone-400">Sin asignar</span>
            )}
          </div>
        </div>

        {route.stops.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Paradas</p>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-stone-200" />
              <div className="space-y-3">
                {route.stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-start gap-4">
                    <div className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 z-10',
                      stop.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-white text-stone-500 border border-stone-300'
                    )}>
                      {stop.status === 'completed' ? <CheckCircle2 size={14} /> : index + 1}
                    </div>
                    <div className="flex-1 bg-stone-50 rounded-lg p-3 border border-stone-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-stone-800">{stop.clientName}</p>
                        <span className="text-xs text-stone-400">{stop.estimatedTime}{stop.actualTime && ` → ${stop.actualTime}`}</span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">{stop.address.street}, {stop.address.city}</p>
                      <p className="text-[10px] text-stone-400 font-mono mt-1">{stop.orderCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {route.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-700 mb-1">Notas</p>
            <p className="text-xs text-stone-700">{route.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function RoutesPage() {
  const { getFilteredRoutes, filters, setFilters, addRoute, updateRoute, updateRouteStatus, deleteRoute } = useRouteStore();
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [detailRoute, setDetailRoute] = useState<Route | null>(null);
  const [assignDriverRoute, setAssignDriverRoute] = useState<Route | null>(null);
  const [assignVehicleRoute, setAssignVehicleRoute] = useState<Route | null>(null);
  const [addOrdersRoute, setAddOrdersRoute] = useState<Route | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Route | null>(null);

  const filteredRoutes = getFilteredRoutes();

  const handleAdd = (data: RouteFormData) => {
    addRoute({
      name: data.name,
      status: 'planned',
      stops: [],
      orderIds: [],
      estimatedDistance: data.estimatedDistance,
      estimatedDuration: data.estimatedDuration,
      startTime: data.startTime,
      notes: data.notes,
    });
    setShowForm(false);
  };

  const handleEdit = (data: RouteFormData) => {
    if (!editingRoute) return;
    updateRoute(editingRoute.id, {
      name: data.name,
      estimatedDistance: data.estimatedDistance,
      estimatedDuration: data.estimatedDuration,
      startTime: data.startTime,
      notes: data.notes,
    });
    setEditingRoute(null);
  };

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'planned', label: 'Planificadas' },
    { value: 'active', label: 'Activas' },
    { value: 'completed', label: 'Completadas' },
    { value: 'cancelled', label: 'Canceladas' },
  ];

  const statusActions: Partial<Record<RouteStatus, { label: string; next: RouteStatus; icon: React.ReactNode }>> = {
    planned: { label: 'Iniciar', next: 'active', icon: <Play size={12} /> },
    active: { label: 'Completar', next: 'completed', icon: <CheckCircle2 size={12} /> },
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre, repartidor..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>
        <Select
          value={filters.status ?? 'all'}
          onChange={(e) => setFilters({ status: e.target.value as RouteStatus | 'all' })}
          options={statusOptions}
          containerClassName="w-48"
        />
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
          Nueva ruta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: filteredRoutes.length, color: 'text-stone-700', bg: 'bg-white' },
          { label: 'Planificadas', value: filteredRoutes.filter(r => r.status === 'planned').length, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Activas', value: filteredRoutes.filter(r => r.status === 'active').length, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Completadas', value: filteredRoutes.filter(r => r.status === 'completed').length, color: 'text-stone-500', bg: 'bg-white' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-stone-200 rounded-xl p-4 text-center shadow-sm`}>
            <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Routes Grid */}
      {filteredRoutes.length === 0 ? (
        <EmptyState
          icon={<Map size={32} />}
          title="No se encontraron rutas"
          description="Crea una nueva ruta para comenzar la planificación"
          action={{ label: 'Crear ruta', onClick: () => setShowForm(true), icon: <Plus size={14} /> }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRoutes.map((route) => {
            const action = statusActions[route.status];
            const completedStops = route.stops.filter(s => s.status === 'completed').length;
            const progress = route.stops.length > 0 ? (completedStops / route.stops.length) * 100 : 0;

            return (
              <div key={route.id} className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-300 hover:shadow-md transition-all shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{route.name}</p>
                    <p className="text-xs font-mono text-stone-400 mt-0.5">{route.code}</p>
                  </div>
                  <RouteStatusBadge status={route.status} />
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-stone-400 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Package size={11} className="text-stone-300" />
                    {route.orderIds.length} pedidos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Map size={11} className="text-stone-300" />
                    {route.estimatedDistance} km
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={11} className="text-stone-300" />
                    {Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m
                  </span>
                </div>

                {/* Driver & Vehicle */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setAssignDriverRoute(route)}
                    disabled={route.status === 'completed' || route.status === 'cancelled'}
                    className={clsx(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                      route.driverName
                        ? 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100'
                        : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100',
                      (route.status === 'completed' || route.status === 'cancelled') && 'cursor-default opacity-70'
                    )}
                  >
                    <UserCheck size={12} />
                    {route.driverName ?? 'Asignar repartidor'}
                  </button>
                  <button
                    onClick={() => setAssignVehicleRoute(route)}
                    disabled={route.status === 'completed' || route.status === 'cancelled'}
                    className={clsx(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                      route.vehiclePlate
                        ? 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                        : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100',
                      (route.status === 'completed' || route.status === 'cancelled') && 'cursor-default opacity-70'
                    )}
                  >
                    <Car size={12} />
                    {route.vehiclePlate ?? 'Asignar vehículo'}
                  </button>
                </div>

                {/* Progress bar for active routes */}
                {route.status === 'active' && route.stops.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                      <span>Progreso</span>
                      <span>{completedStops}/{route.stops.length} paradas</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5">
                      <div
                        className="bg-primary-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Stops preview */}
                {route.stops.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {route.stops.slice(0, 2).map((stop, i) => (
                      <div key={stop.id} className="flex items-center gap-2 text-xs text-stone-400">
                        <div className={clsx(
                          'w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0',
                          stop.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                        )}>
                          {stop.status === 'completed' ? '✓' : i + 1}
                        </div>
                        <span className="truncate">{stop.clientName}</span>
                        <span className="text-stone-300 flex-shrink-0">{stop.estimatedTime}</span>
                      </div>
                    ))}
                    {route.stops.length > 2 && (
                      <p className="text-[10px] text-stone-400 pl-6">+{route.stops.length - 2} paradas más</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-3 border-t border-stone-100">
                  {action && (
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => updateRouteStatus(route.id, action.next)}
                      icon={action.icon}
                    >
                      {action.label}
                    </Button>
                  )}
                  {(route.status === 'planned' || route.status === 'active') && (
                    <Button variant="ghost" size="xs" onClick={() => setAddOrdersRoute(route)} icon={<Package size={13} />}>
                      Pedidos
                    </Button>
                  )}
                  <div className="flex-1" />
                  <Button variant="ghost" size="xs" onClick={() => setDetailRoute(route)} icon={<Eye size={13} />} />
                  {route.status !== 'active' && route.status !== 'completed' && (
                    <Button variant="ghost" size="xs" onClick={() => setEditingRoute(route)} icon={<Edit2 size={13} />} />
                  )}
                  {route.status !== 'active' && (
                    <Button variant="ghost" size="xs" onClick={() => setDeleteTarget(route)} icon={<Trash2 size={13} />} className="hover:text-red-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Crear ruta" description="Define los parámetros de la nueva ruta" size="md">
        <RouteForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} submitLabel="Crear ruta" />
      </Modal>

      {editingRoute && (
        <Modal open onClose={() => setEditingRoute(null)} title="Editar ruta" description={editingRoute.code} size="md">
          <RouteForm
            initial={{
              name: editingRoute.name,
              notes: editingRoute.notes ?? '',
              startTime: editingRoute.startTime ?? '08:00',
              estimatedDistance: editingRoute.estimatedDistance,
              estimatedDuration: editingRoute.estimatedDuration,
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditingRoute(null)}
            submitLabel="Guardar cambios"
          />
        </Modal>
      )}

      {detailRoute && <RouteDetail route={detailRoute} onClose={() => setDetailRoute(null)} />}
      {assignDriverRoute && <AssignDriverModal route={assignDriverRoute} onClose={() => setAssignDriverRoute(null)} />}
      {assignVehicleRoute && <AssignVehicleModal route={assignVehicleRoute} onClose={() => setAssignVehicleRoute(null)} />}
      {addOrdersRoute && <AddOrdersModal route={addOrdersRoute} onClose={() => setAddOrdersRoute(null)} />}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deleteRoute(deleteTarget.id); setDeleteTarget(null); } }}
        title="Eliminar ruta"
        message={`¿Seguro que deseas eliminar la ruta "${deleteTarget?.name}"?`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
