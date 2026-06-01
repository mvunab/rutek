// ─── Excel Format Config ──────────────────────────────────────────────────────
export interface ExcelColumnMapping {
  clientName?: number | null;
  entrega?: number | null;
  numeroOC?: number | null;
  factura?: number | null;
  refFactura?: number | null;
  tipo?: number | null;
  cajas?: number | null;
  unidades?: number | null;
}

export interface ExcelCellPosition {
  row: number;
  col: number;
}

export interface ExcelFormatConfig {
  id: string;
  name: string;
  active: boolean;
  headerRow: number;
  dataStartRow: number;
  detection?: { row: number; col: number; value: string } | null;
  columns: ExcelColumnMapping;
  metadata?: {
    routeNumber?: ExcelCellPosition | null;
    date?: ExcelCellPosition | null;
    driver?: ExcelCellPosition | null;
  } | null;
}

// ─── Tenant / Multi-tenant ───────────────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  rut: string;
  plan: 'starter' | 'professional' | 'enterprise';
  logo?: string;
  createdAt: string;
  active: boolean;
  /** Datos de contacto / fiscales editables en Configuración */
  legalName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  /** Estados de pedido extra definidos por el admin del tenant (`slug` → `label`). */
  customOrderStatuses?: { slug: string; label: string }[];
}

// ─── Auth / Users ─────────────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'admin' | 'operator' | 'driver' | 'peoneta' | 'client';

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export interface Client {
  id: string;
  tenantId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  rut: string;
  address: string;
  city: string;
  region: string;
  active: boolean;
  createdAt: string;
  notes?: string;
}

export interface ServiceHistory {
  id: string;
  clientId: string;
  orderId: string;
  orderCode: string;
  date: string;
  status: OrderStatus;
  totalAmount: number;
  description: string;
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export type BuiltinOrderStatus =
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'rejected';

/** Slug en API: base + valores definidos por el tenant. */
export type OrderStatus = BuiltinOrderStatus | (string & {});

export type OrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  weight: number;
  volume: number;
  fragile: boolean;
}

export interface Order {
  id: string;
  tenantId: string;
  code: string;
  clientId: string;
  clientName: string;
  status: OrderStatus;
  priority: OrderPriority;
  origin: Address;
  destination: Address;
  items: OrderItem[];
  totalWeight: number;
  totalVolume: number;
  estimatedDelivery: string;
  actualDelivery?: string;
  routeId?: string;
  /** Bultos de este pedido; en la ruta se suman con los demás pedidos asignados. */
  bultos: number;
  /** URL de la guía de despacho (imagen o documento). */
  dispatchGuideUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  /** RM-1: chofer asignado a este pedido específico. */
  driverId?: string | null;
  driverName?: string | null;
  /** RM-1: peoneta asignada a este pedido específico. */
  peonetaId?: string | null;
  peonetaName?: string | null;
  /** Vehículo asignado a este pedido (varios por ruta). */
  vehicleId?: string | null;
  vehiclePlate?: string | null;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  changedAt: string;
  changedBy?: string | null;
  note?: string | null;
}

export interface Address {
  street: string;
  city: string;
  region: string;
  coordinates?: { lat: number; lng: number };
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export type RouteStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface RouteStop {
  id: string;
  orderId: string;
  orderCode: string;
  clientName: string;
  address: Address;
  sequence: number;
  estimatedTime: string;
  actualTime?: string;
  status: 'pending' | 'completed' | 'skipped';
}

export interface Route {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  status: RouteStatus;
  driverId?: string;
  driverName?: string;
  /** @deprecated Usar vehicleId/vehiclePlate en cada pedido. */
  vehicleId?: string;
  /** @deprecated Usar vehicleId/vehiclePlate en cada pedido. */
  vehiclePlate?: string;
  /** RM-3: cliente único de la ruta. Se infiere del primer pedido asignado. */
  clientId?: string | null;
  stops: RouteStop[];
  orderIds: string[];
  startTime?: string;
  endTime?: string;
  estimatedDistance: number;
  estimatedDuration: number;
  createdAt: string;
  notes?: string;
}

// ─── Vehicles ────────────────────────────────────────────────────────────────
export type VehicleType = 'van' | 'truck' | 'motorcycle' | 'cargo_truck';

export interface Vehicle {
  id: string;
  tenantId: string;
  plate: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  available: boolean;
  /** VIN opcional (11–17 caracteres) para integración futura con scraping. */
  vin?: string | null;
  maintenanceDueDate?: string | null;
  circulationPermitDueDate?: string | null;
  technicalReviewDueDate?: string | null;
  createdAt?: string;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export interface DashboardStats {
  totalOrders: number;
  ordersInTransit: number;
  ordersDelivered: number;
  ordersPending: number;
  activeRoutes: number;
  totalClients: number;
  deliveryRate: number;
  avgDeliveryTime: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
}

// ─── Delivery Records (Admin. de Rutas tabla operacional) ────────────────────
export type DeliveryStatus = 'entregado' | 'pendiente' | 'en_ruta' | 'reprogramado' | 'rechazado' | 'parcial';

export interface DeliveryRecord {
  id: string;
  tenantId: string;
  selected?: boolean;
  estado: DeliveryStatus;
  cliente: string;
  entrega: string;
  pedido: string;
  factura: string;
  tipo: string;
  ref: string;
  bultos: number;
  rut: string;
  recepcion: string;
  fechaHora?: string;
  chofer: string;
  vehiculo: string;
  peoneta: string;
  obs: string;
  zona: string;
  routeId?: string;
  orderId?: string;
}

// ─── Peoneta (asistente de entrega) ──────────────────────────────────────────
export interface Peoneta {
  id: string;
  tenantId: string;
  rut: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  estado: 'Activo' | 'Inactivo';
  /** Nombre de usuario del sistema asociado, ej. "Se.Lara" */
  username: string;
  /** ID del User en el sistema (puede estar vacío si no tiene cuenta) */
  userId?: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

// ─── Route Photos (Admin. Fotos — inspecciones desde app móvil) ──────────────
export type PhotoType = 'entrega' | 'recepcion' | 'dano' | 'firma' | 'otro';

export interface RoutePhoto {
  id: string;
  tenantId: string;
  routeCode: string;         // Nº Ruta display (ej. "1992")
  routeId: string;
  driverName: string;
  vehiclePlate: string;
  fecha: string;             // dd/mm/yy
  hora: string;
  photoUrl: string;          // URL de la imagen
  thumbnailUrl: string;
  type: PhotoType;
  description: string;
  clientName: string;
  orderCode: string;
}

// ─── Filters ─────────────────────────────────────────────────────────────────
export interface OrderFilters {
  status?: string | 'all';
  priority?: OrderPriority | 'all';
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface RouteFilters {
  status?: RouteStatus | 'all';
  driverId?: string;
  search?: string;
}
