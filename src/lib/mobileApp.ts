/** Ruta pública del APK Android (archivo en `public/downloads/`). */
export const MOBILE_APP_DOWNLOAD_PATH = '/downloads/rutek-app.apk';

export const MOBILE_APP_DOWNLOAD_FILENAME = 'rutek-app.apk';

export const MOBILE_APP_VERSION = '1.3.0';

export const MOBILE_APP_DOWNLOAD_LABEL = `Descargar app Android v${MOBILE_APP_VERSION} (APK)`;

/** Notas breves de la versión actual de la app móvil, mostradas junto a la descarga. */
export const MOBILE_APP_RELEASE_NOTES: string[] = [
  'Nuevo buscador de pedidos dentro de cada ruta: filtra por referencia (OC/factura/ref), destino, chofer o peoneta.',
  'Corrección de contraste y colores en el tema claro.',
  'Tema claro/oscuro aplicado de forma consistente en toda la app.',
];
