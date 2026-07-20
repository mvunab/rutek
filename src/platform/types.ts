/**
 * Contratos de plataforma (Business Platform Engineering).
 * No generan UI automáticamente: alinean negocio, API y frontend.
 */

export type FieldDefinition = {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'relation' | 'json';
  required?: boolean;
  configurable?: boolean;
};

export type RelationshipDefinition = {
  key: string;
  targetEntity: string;
  cardinality: 'one' | 'many';
  label: string;
};

export type StatusDefinition = {
  slug: string;
  label: string;
  terminal?: boolean;
};

export type ActionDefinition = {
  key: string;
  label: string;
  /** Roles autorizados (además de validación backend). */
  roles: string[];
  /** Estados desde los que aplica (vacío = cualquiera). */
  fromStatuses?: string[];
};

export type ViewDefinition = {
  key: string;
  kind: 'list' | 'detail' | 'form' | 'map' | 'dashboard' | 'modal';
  label: string;
};

export type EntityPermissionDefinition = {
  role: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  actions?: string[];
};

export type EntityDefinition = {
  key: string;
  singularLabel: string;
  pluralLabel: string;
  kind: 'catalog' | 'transaction' | 'document' | 'config' | 'event' | 'org';
  fields: FieldDefinition[];
  relationships: RelationshipDefinition[];
  statuses?: StatusDefinition[];
  actions: ActionDefinition[];
  views: ViewDefinition[];
  permissions: EntityPermissionDefinition[];
};

export type NavigationItem = {
  key: string;
  label: string;
  path: string;
  roles?: string[];
};

export type PermissionDefinition = {
  key: string;
  label: string;
  roles: string[];
};

export type WorkflowDefinition = {
  key: string;
  entity: string;
  label: string;
  transitions: {
    from: string;
    to: string;
    action: string;
    roles: string[];
  }[];
};

export type SettingDefinition = {
  key: string;
  label: string;
  scope: 'tenant' | 'platform';
  description?: string;
};

export type BusinessModule = {
  key: string;
  name: string;
  entities: EntityDefinition[];
  navigation: NavigationItem[];
  permissions: PermissionDefinition[];
  workflows: WorkflowDefinition[];
  settings?: SettingDefinition[];
};
