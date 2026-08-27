import type { Tenant, UserRole } from '../types';
import { isValuationModuleEnabled } from './valuationModule';
import { isOrdersMapModuleEnabled } from './ordersMapModule';

export interface NavTourStep {
  id: string;
  /** Valor de data-nav-tour; omitir en paso introductorio */
  target?: string;
  title: string;
  body: string;
}

const STORAGE_PREFIX = 'rutek-nav-tour-done:';

export function isNavTourCompleted(userId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${userId}`) === '1';
  } catch {
    return false;
  }
}

export function markNavTourCompleted(userId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, '1');
  } catch {
    /* ignore */
  }
}

const tenantStepsBase: NavTourStep[] = [
  {
    id: 'intro',
    title: 'Bienvenido a Rutek',
    body: 'Te guiamos por el menú principal en unos pasos. Usa Siguiente para avanzar o Saltar tour si ya conoces la plataforma.',
  },
  {
    id: 'dashboard',
    target: '/dashboard',
    title: 'Back Office',
    body: 'Tu panel de control: pedidos del día, rutas activas, entregas y métricas operacionales en tiempo real.',
  },
  {
    id: 'rutas',
    target: '/rutas',
    title: 'Rutas',
    body: 'Planifica itinerarios, importa Excel, asigna choferes y gestiona los pedidos de cada ruta desde un solo lugar.',
  },
  {
    id: 'pedidos',
    target: '/pedidos',
    title: 'Pedidos',
    body: 'Consulta el estado de tus envíos. El alta y la planificación en ruta las gestiona tu operador logístico.',
  },
  {
    id: 'clientes',
    target: '/clientes',
    title: 'Clientes',
    body: 'Administra mandantes, contactos comerciales e historial de actividad por cliente.',
  },
  {
    id: 'vehiculos',
    target: '/vehiculos',
    title: 'Vehículos',
    body: 'Flota, documentación, mantenciones y alertas de vencimiento para cumplimiento operativo.',
  },
  {
    id: 'usuarios',
    target: '/usuarios',
    title: 'Usuarios Sistema',
    body: 'Crea cuentas, define roles y controla quién accede a cada módulo de tu empresa.',
  },
  {
    id: 'fotos',
    target: '/fotos',
    title: 'Fotos de Ruta',
    body: 'Evidencias fotográficas de inspección y entrega capturadas desde la app móvil en terreno.',
  },
  {
    id: 'mapa-pedidos',
    target: '/mapa-pedidos',
    title: 'Mapa de pedidos',
    body: 'Visualiza entregas en un mapa, filtra por estado y ubica pedidos sin coordenadas.',
  },
  {
    id: 'valorizacion',
    target: '/valorizacion',
    title: 'Valorización',
    body: 'Calcula cobros a clientes y pagos a choferes y peonetas según pedidos entregados.',
  },
  {
    id: 'mis-rutas',
    target: '/mis-rutas',
    title: 'Mis Rutas',
    body: 'Pedidos asignados a ti en las rutas del día. Ideal para seguimiento en terreno.',
  },
  {
    id: 'notifications',
    target: 'notifications',
    title: 'Notificaciones',
    body: 'Alertas operativas y avisos importantes de tu cuenta, sin salir del flujo de trabajo.',
  },
  {
    id: 'configuracion',
    target: '/configuracion',
    title: 'Configuración',
    body: 'Datos de la empresa, tema de la interfaz y cambio de contraseña de tu perfil.',
  },
];

const superAdminSteps: NavTourStep[] = [
  {
    id: 'intro',
    title: 'Panel global Rutek',
    body: 'Recorrido rápido por el menú de super administrador. Puedes saltarlo en cualquier momento.',
  },
  {
    id: 'resumen',
    target: '/super-admin',
    title: 'Resumen Global',
    body: 'Vista consolidada de tenants, usuarios y actividad en toda la plataforma.',
  },
  {
    id: 'observabilidad',
    target: '/super-admin/observabilidad',
    title: 'Observabilidad',
    body: 'Salud del sistema, métricas y señales para monitorear el servicio en producción.',
  },
  {
    id: 'tenants',
    target: '/super-admin/tenants',
    title: 'Tenants',
    body: 'Empresas registradas: planes, estado y configuración por organización.',
  },
  {
    id: 'users',
    target: '/super-admin/users',
    title: 'Usuarios',
    body: 'Gestión de cuentas a nivel plataforma, incluidos super administradores.',
  },
  {
    id: 'auditoria',
    target: '/super-admin/auditoria',
    title: 'Auditoría',
    body: 'Historistro de acciones sensibles realizadas sobre tenants y usuarios.',
  },
];

function moduleTargets(tenant?: Tenant | null): Set<string> {
  const set = new Set<string>();
  if (isValuationModuleEnabled(tenant)) set.add('/valorizacion');
  if (isOrdersMapModuleEnabled(tenant)) set.add('/mapa-pedidos');
  return set;
}

/** Rutas visibles por rol según AppSidebar (+ módulos opcionales del tenant). */
function navTargetsByRole(
  role: UserRole,
  tenant?: Tenant | null,
): Set<string> {
  const modules = moduleTargets(tenant);
  const base: Record<UserRole, string[]> = {
    super_admin: superAdminSteps.flatMap((s) => (s.target ? [s.target] : [])) as string[],
    admin: [
      '/dashboard',
      '/rutas',
      '/clientes',
      '/vehiculos',
      '/usuarios',
      '/fotos',
      'notifications',
      '/configuracion',
    ],
    operator: [
      '/dashboard',
      '/rutas',
      '/clientes',
      '/vehiculos',
      '/fotos',
      'notifications',
      '/configuracion',
    ],
    driver: ['/rutas', 'notifications', '/configuracion'],
    peoneta: ['/mis-rutas', 'notifications', '/configuracion'],
    client: ['/pedidos', 'notifications', '/configuracion'],
  };
  const allowed = new Set(base[role] ?? []);
  for (const t of modules) {
    if (role === 'admin' || role === 'operator') allowed.add(t);
    if (role === 'driver' && t === '/mapa-pedidos') allowed.add(t);
  }
  return allowed;
}

export function getNavTourSteps(
  role: UserRole,
  isSuperAdmin: boolean,
  tenant?: Tenant | null,
): NavTourStep[] {
  if (isSuperAdmin || role === 'super_admin') {
    return superAdminSteps;
  }

  const allowed = navTargetsByRole(role, tenant);
  return tenantStepsBase.filter((step) => !step.target || allowed.has(step.target));
}

export const NAV_TOUR_TARGET_ATTR = 'data-nav-tour';

export function findNavTourTarget(target: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[${NAV_TOUR_TARGET_ATTR}="${target}"]`);
}
