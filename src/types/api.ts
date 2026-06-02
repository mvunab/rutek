/**
 * Tipos en snake_case que devuelve el backend (`rutek-api`).
 *
 * El backend serializa todos los modelos de Prisma a snake_case para
 * preservar el contrato que tenía la API anterior (PostgREST de Supabase).
 * Estos tipos describen ESE shape — antes de mapearlos al modelo en
 * camelCase del frontend.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface DbTenant {
  id: string;
  name: string;
  legal_name: string | null;
  rut: string;
  plan: string;
  active: boolean;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  logo: string | null;
  custom_order_statuses?: Json;
  created_at: string;
  updated_at: string;
}

export interface DbUser {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatar: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  /** Si el endpoint generó una password al crear el user, viene acá. */
  generated_password?: string;
}

export interface DbClient {
  id: string;
  tenant_id: string;
  company_name: string;
  contact_name: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrder {
  id: string;
  tenant_id: string;
  client_id: string;
  client_name: string;
  code: string;
  status: string;
  priority: string;
  origin_street: string;
  origin_city: string;
  origin_region: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_street: string;
  destination_city: string;
  destination_region: string;
  destination_lat: number | null;
  destination_lng: number | null;
  total_volume: number;
  total_weight: number;
  items: Json;
  estimated_delivery: string;
  actual_delivery: string | null;
  route_id: string | null;
  bultos: number;
  dispatch_guide_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRoute {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  status: string;
  driver_id: string | null;
  driver_name: string | null;
  vehicle_id: string | null;
  vehicle_plate: string | null;
  estimated_distance: number;
  estimated_duration: number;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  stops: Json;
  created_at: string;
  updated_at: string;
}

export interface DbRoutePhoto {
  id: string;
  tenant_id: string;
  route_id: string;
  route_code: string;
  driver_name: string;
  vehicle_plate: string;
  fecha: string;
  hora: string;
  photo_url: string;
  thumbnail_url: string;
  type: string;
  description: string | null;
  client_name: string | null;
  order_code: string | null;
  created_at: string;
}

export interface DbDeliveryRecord {
  id: string;
  tenant_id: string;
  route_id: string | null;
  order_id: string | null;
  ref: string;
  pedido: string;
  factura: string | null;
  rut: string;
  cliente: string;
  entrega: string;
  fecha_hora: string | null;
  recepcion: string | null;
  estado: string;
  bultos: number;
  chofer: string | null;
  peoneta: string | null;
  vehiculo: string | null;
  tipo: string;
  zona: string | null;
  obs: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPeoneta {
  id: string;
  tenant_id: string;
  user_id: string | null;
  username: string;
  rut: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  email: string | null;
  phone: string | null;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface DbVehicle {
  id: string;
  tenant_id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  capacity: number;
  available: boolean;
  vin?: string | null;
  maintenance_due_date?: string | null;
  circulation_permit_due_date?: string | null;
  technical_review_due_date?: string | null;
  created_at: string;
  updated_at: string;
  documents?: DbVehicleDocument[];
}

export interface DbVehicleDocument {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  kind: string;
  storage_key: string;
  file_url: string;
  mime_type: string;
  file_name?: string | null;
  file_size?: number | null;
  uploaded_by?: string | null;
  created_at: string;
  updated_at: string;
}
