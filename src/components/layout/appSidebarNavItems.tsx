import {
  LayoutDashboard, Truck, Package, Map, UserCircle2,
  Users, Building2, FileClock, Car, Images, Calculator,
  Gauge,
} from 'lucide-react';
import type { UserRole } from '../../types';

export interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: UserRole[];
  end?: boolean;
}

export const tenantNavItems: NavItem[] = [
  { to: '/dashboard',  icon: <LayoutDashboard size={18} />, label: 'Back Office',      roles: ['admin', 'operator'] },
  { to: '/rutas',      icon: <Truck size={18} />,           label: 'Rutas',            roles: ['admin', 'operator', 'driver'] },
  { to: '/pedidos',    icon: <Package size={18} />,         label: 'Pedidos',          roles: ['client'] },
  { to: '/clientes',   icon: <Users size={18} />,           label: 'Clientes',         roles: ['admin', 'operator'] },
  { to: '/vehiculos',  icon: <Car size={18} />,             label: 'Vehículos',        roles: ['admin', 'operator'] },
  { to: '/usuarios',   icon: <UserCircle2 size={18} />,     label: 'Usuarios Sistema', roles: ['admin'] },
  { to: '/fotos',      icon: <Images size={18} />,          label: 'Fotos de Ruta',    roles: ['admin', 'operator'] },
  { to: '/mapa-pedidos', icon: <Map size={18} />,         label: 'Mapa pedidos',     roles: ['admin', 'operator', 'driver'] },
  { to: '/valorizacion', icon: <Calculator size={18} />,    label: 'Valorización',     roles: ['admin', 'operator'] },
  { to: '/mis-rutas',  icon: <Truck size={18} />,           label: 'Mis Rutas',         roles: ['peoneta'] },
];

export const superAdminNavItems: NavItem[] = [
  { to: '/super-admin',            icon: <LayoutDashboard size={18} />, label: 'Resumen Global', roles: ['super_admin'], end: true },
  { to: '/super-admin/observabilidad', icon: <Gauge size={18} />,     label: 'Observabilidad', roles: ['super_admin'] },
  { to: '/super-admin/tenants',    icon: <Building2 size={18} />,       label: 'Tenants',        roles: ['super_admin'] },
  { to: '/super-admin/users',      icon: <Users size={18} />,           label: 'Usuarios',       roles: ['super_admin'] },
  { to: '/super-admin/auditoria',  icon: <FileClock size={18} />,       label: 'Auditoría',      roles: ['super_admin'] },
];

export const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  operator: 'Operador Logístico',
  driver: 'Repartidor',
  peoneta: 'Peoneta',
  client: 'Cliente',
};
