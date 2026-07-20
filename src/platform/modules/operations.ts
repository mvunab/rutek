/**
 * Módulo de Operaciones (rutas, pedidos, importación Excel).
 * Contrato de dominio — fuente de verdad conceptual, no UI.
 */
import type { BusinessModule } from '../types';

export const operationsModule: BusinessModule = {
  key: 'operations',
  name: 'Operaciones',
  navigation: [
    { key: 'routes', label: 'Rutas', path: '/rutas', roles: ['admin', 'operator'] },
    { key: 'orders-map', label: 'Mapa de pedidos', path: '/mapa-pedidos', roles: ['admin', 'operator'] },
  ],
  permissions: [
    {
      key: 'route_import',
      label: 'Importar rutas desde Excel',
      roles: ['admin', 'operator', 'super_admin'],
    },
    {
      key: 'order_reactivate',
      label: 'Reactivar pedido rechazado',
      roles: ['admin', 'operator', 'super_admin'],
    },
  ],
  settings: [
    {
      key: 'excel_formats',
      label: 'Plantillas de importación Excel',
      scope: 'tenant',
      description: 'Mapeos de columnas y reglas de detección por tenant.',
    },
    {
      key: 'excel_import_enabled',
      label: 'Importación Excel habilitada',
      scope: 'tenant',
    },
  ],
  entities: [
    {
      key: 'route',
      singularLabel: 'Ruta',
      pluralLabel: 'Rutas',
      kind: 'transaction',
      fields: [
        { key: 'guiaInterna', label: 'N° consecutivo', type: 'number', required: true },
        { key: 'name', label: 'Nombre', type: 'string', required: true },
        { key: 'status', label: 'Estado', type: 'enum', required: true },
        { key: 'clientId', label: 'Cuenta', type: 'relation' },
      ],
      relationships: [
        { key: 'orders', targetEntity: 'order', cardinality: 'many', label: 'Pedidos' },
        { key: 'client', targetEntity: 'client', cardinality: 'one', label: 'Cuenta' },
      ],
      statuses: [
        { slug: 'not_started', label: 'No iniciada' },
        { slug: 'in_progress', label: 'En progreso' },
        { slug: 'completed', label: 'Completada', terminal: true },
        { slug: 'cancelled', label: 'Cancelada', terminal: true },
      ],
      actions: [
        { key: 'create', label: 'Crear ruta', roles: ['admin', 'operator'] },
        { key: 'import_excel', label: 'Importar Excel', roles: ['admin', 'operator'] },
        { key: 'assign_team', label: 'Asignar equipo', roles: ['admin', 'operator'] },
        { key: 'delete', label: 'Eliminar', roles: ['admin', 'operator'] },
      ],
      views: [
        { key: 'list', kind: 'list', label: 'Listado' },
        { key: 'detail', kind: 'detail', label: 'Detalle lateral' },
        { key: 'import', kind: 'modal', label: 'Importar Excel' },
      ],
      permissions: [
        {
          role: 'admin',
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        },
        {
          role: 'operator',
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        },
        {
          role: 'driver',
          canRead: true,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          actions: [],
        },
      ],
    },
    {
      key: 'order',
      singularLabel: 'Pedido',
      pluralLabel: 'Pedidos',
      kind: 'transaction',
      fields: [
        { key: 'code', label: 'Código', type: 'string', required: true },
        { key: 'status', label: 'Estado', type: 'enum', required: true },
        { key: 'destination', label: 'Destino', type: 'json', required: true },
        { key: 'driverId', label: 'Chofer', type: 'relation' },
        { key: 'vehicleId', label: 'Vehículo', type: 'relation' },
      ],
      relationships: [
        { key: 'route', targetEntity: 'route', cardinality: 'one', label: 'Ruta' },
        { key: 'client', targetEntity: 'client', cardinality: 'one', label: 'Destinatario' },
      ],
      statuses: [
        { slug: 'pending', label: 'Pendiente' },
        { slug: 'in_transit', label: 'En ruta' },
        { slug: 'delivered', label: 'Entregado', terminal: true },
        { slug: 'rejected', label: 'Rechazado', terminal: true },
      ],
      actions: [
        {
          key: 'reactivate',
          label: 'Reactivar',
          roles: ['admin', 'operator'],
          fromStatuses: ['rejected'],
        },
        {
          key: 'assign',
          label: 'Asignar equipo',
          roles: ['admin', 'operator'],
        },
        {
          key: 'place_pin',
          label: 'Ubicar en mapa',
          roles: ['admin', 'operator'],
        },
      ],
      views: [
        { key: 'in_route', kind: 'list', label: 'Pedidos en ruta' },
        { key: 'map', kind: 'map', label: 'Mapa' },
        { key: 'detail', kind: 'detail', label: 'Detalle' },
      ],
      permissions: [
        {
          role: 'admin',
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
          actions: ['reactivate', 'assign', 'place_pin'],
        },
        {
          role: 'operator',
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
          actions: ['reactivate', 'assign', 'place_pin'],
        },
      ],
    },
    {
      key: 'excel_format',
      singularLabel: 'Plantilla Excel',
      pluralLabel: 'Plantillas Excel',
      kind: 'config',
      fields: [
        { key: 'name', label: 'Nombre', type: 'string', required: true, configurable: true },
        { key: 'active', label: 'Predeterminada', type: 'boolean', configurable: true },
        { key: 'columns', label: 'Mapeo de columnas', type: 'json', configurable: true },
        { key: 'detection', label: 'Regla de detección', type: 'json', configurable: true },
      ],
      relationships: [],
      actions: [
        { key: 'upsert', label: 'Guardar', roles: ['admin', 'super_admin'] },
        { key: 'activate', label: 'Marcar predeterminada', roles: ['admin', 'super_admin'] },
        { key: 'evaluate', label: 'Evaluar contra Excel', roles: ['admin', 'operator'] },
      ],
      views: [
        { key: 'settings', kind: 'list', label: 'Ajustes' },
        { key: 'import_picker', kind: 'modal', label: 'Selector al importar' },
      ],
      permissions: [
        {
          role: 'admin',
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        },
        {
          role: 'operator',
          canRead: true,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          actions: ['evaluate'],
        },
      ],
    },
  ],
  workflows: [
    {
      key: 'order_delivery',
      entity: 'order',
      label: 'Ciclo de entrega',
      transitions: [
        { from: 'pending', to: 'in_transit', action: 'start_delivery', roles: ['driver', 'peoneta'] },
        { from: 'in_transit', to: 'delivered', action: 'deliver', roles: ['driver', 'peoneta', 'admin', 'operator'] },
        { from: 'in_transit', to: 'rejected', action: 'reject', roles: ['driver', 'peoneta', 'admin', 'operator'] },
        { from: 'rejected', to: 'pending', action: 'reactivate', roles: ['admin', 'operator'] },
      ],
    },
    {
      key: 'excel_import',
      entity: 'route',
      label: 'Importación Excel',
      transitions: [
        { from: 'none', to: 'evaluated', action: 'evaluate_formats', roles: ['admin', 'operator'] },
        { from: 'evaluated', to: 'preview', action: 'preview', roles: ['admin', 'operator'] },
        { from: 'preview', to: 'imported', action: 'confirm', roles: ['admin', 'operator'] },
      ],
    },
  ],
};
