import { Download, Smartphone } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import {
  MOBILE_APP_DOWNLOAD_FILENAME,
  MOBILE_APP_DOWNLOAD_LABEL,
  MOBILE_APP_DOWNLOAD_PATH,
  MOBILE_APP_RELEASE_NOTES,
  MOBILE_APP_VERSION,
} from '../../lib/mobileApp';

export function MobileAppDownloadCard() {
  return (
    <Card padding="lg">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
          <Smartphone size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            App móvil Rutek
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Instala la app en dispositivos Android para choferes y peonetas en terreno.
            Versión disponible: <span translate="no">{MOBILE_APP_VERSION}</span>.
          </p>
        </div>
      </div>
      <a
        href={MOBILE_APP_DOWNLOAD_PATH}
        download={MOBILE_APP_DOWNLOAD_FILENAME}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-11 rounded-xl text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
      >
        <Download size={18} aria-hidden="true" />
        {MOBILE_APP_DOWNLOAD_LABEL}
      </a>
      <p className="text-xs text-stone-500 dark:text-stone-400 mt-3 max-w-prose">
        En Android puede ser necesario permitir la instalación desde fuentes desconocidas.
        Si el navegador bloquea la descarga, mantén pulsado el enlace y elige «Descargar enlace».
      </p>
      {MOBILE_APP_RELEASE_NOTES.length > 0 ? (
        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Novedades v{MOBILE_APP_VERSION}
          </p>
          <ul className="space-y-1">
            {MOBILE_APP_RELEASE_NOTES.map((item) => (
              <li key={item} className="text-xs text-stone-500 dark:text-stone-400 flex gap-1.5">
                <span className="text-primary-500" aria-hidden="true">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
