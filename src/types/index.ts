// ─── Tenant / Multi-tenant ───────────────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  rut: string;
  plan: 'starter' | 'professional' | 'enterprise';
  logo?: string;
  createdAt: string;
  active: boolean;
}

// ─── Auth / Users ─────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'operator' | 'driver' | 'client';

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
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'returned';

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
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  region: string;
  coordinates?: { lat: number; lng: number };
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export type RouteStatus = 'planned' | 'active' | 'completed' | 'cancelled';

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
  vehicleId?: string;
  vehiclePlate?: string;
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

// ─── Filters ─────────────────────────────────────────────────────────────────
export interface OrderFilters {
  status?: OrderStatus | 'all';
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
