import { Calculator, FileSpreadsheet, MapPin, Settings2 } from 'lucide-react';

type FeatureFlagsSectionProps = {
  excelEnabled: boolean;
  valuationEnabled: boolean;
  ordersMapEnabled: boolean;
  excelConfig: Record<string, number>;
  featuresSaving: boolean;
  featuresError: string | null;
  onToggleFeature: (flag: string, value: boolean) => void;
  onExcelConfigChange: (patch: Record<string, number>) => void;
};

export function TenantFeatureFlagsSection({
  excelEnabled,
  valuationEnabled,
  ordersMapEnabled,
  excelConfig,
  featuresSaving,
  featuresError,
  onToggleFeature,
  onExcelConfigChange,
}: FeatureFlagsSectionProps) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <Settings2 size={16} className="text-violet-500 shrink-0" aria-hidden />
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            Módulos y configuración del tenant
          </h2>
          {featuresSaving && (
            <span className="ml-auto text-[11px] text-stone-400 animate-pulse">
              Guardando…
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 pl-[26px]">
          Activa o desactiva módulos opcionales (valorización, mapa de pedidos, Excel). Los
          usuarios del tenant deben volver a iniciar sesión para ver el cambio en el menú.
        </p>
      </div>

      {featuresError && (
        <div role="alert" className="mx-5 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
          <p className="text-xs text-red-700 dark:text-red-300">{featuresError}</p>
        </div>
      )}

      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        <div className="flex items-start gap-4 px-5 py-4">
          <div className="flex items-center justify-center size-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 shrink-0 mt-0.5">
            <FileSpreadsheet size={17} className="text-emerald-600 dark:text-emerald-400" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-100">Importación desde Excel</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Permite crear rutas y pedidos desde una Hoja de Ruta en formato .xlsx.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={excelEnabled}
                aria-label="Habilitar importación desde Excel"
                disabled={featuresSaving}
                onClick={() => onToggleFeature('excel_import_enabled', !excelEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  excelEnabled
                    ? 'bg-emerald-500 dark:bg-emerald-600'
                    : 'bg-stone-200 dark:bg-stone-700'
                } disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-md transition-transform ${
                    excelEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {excelEnabled && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {([
                  { key: 'route_number_row', label: 'Fila N° ruta', default: 1, min: 1, max: 20 },
                  { key: 'route_number_col', label: 'Columna N° ruta', default: 11, min: 1, max: 50 },
                  { key: 'data_start_row', label: 'Fila inicio datos', default: 14, min: 1, max: 100 },
                ] as const).map(({ key, label, default: def, min, max }) => (
                  <div key={key}>
                    <label
                      htmlFor={`excel-cfg-${key}`}
                      className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1"
                    >
                      {label}
                    </label>
                    <input
                      id={`excel-cfg-${key}`}
                      type="number"
                      min={min}
                      max={max}
                      inputMode="numeric"
                      disabled={featuresSaving}
                      defaultValue={excelConfig[key] ?? def}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) return;
                        const v = Number.parseInt(raw, 10);
                        if (Number.isFinite(v) && v >= min && v <= max) {
                          onExcelConfigChange({ [key]: v });
                        }
                      }}
                      className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-2.5 py-1.5 text-sm text-stone-900 dark:text-stone-100 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
                    />
                  </div>
                ))}
                <p className="col-span-3 text-[11px] text-stone-400 dark:text-stone-500">
                  Valores actuales: fila {excelConfig['route_number_row'] ?? 1}, columna {excelConfig['route_number_col'] ?? 11} para el N° de ruta · datos desde fila {excelConfig['data_start_row'] ?? 14}.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4 px-5 py-4">
          <div className="flex items-center justify-center size-9 rounded-lg bg-violet-50 dark:bg-violet-950/30 shrink-0 mt-0.5">
            <Calculator size={17} className="text-violet-600 dark:text-violet-400" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-100">
                  Módulo de valorización
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Activa cobros por cliente, flujos de tarifa y el libro de valorización en el tenant.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={valuationEnabled}
                aria-label="Habilitar módulo de valorización"
                disabled={featuresSaving}
                onClick={() => onToggleFeature('valuation_module_enabled', !valuationEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  valuationEnabled
                    ? 'bg-violet-500 dark:bg-violet-600'
                    : 'bg-stone-200 dark:bg-stone-700'
                } disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-md transition-transform ${
                    valuationEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4 px-5 py-4 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-center size-9 rounded-lg bg-sky-50 dark:bg-sky-950/30 shrink-0 mt-0.5">
            <MapPin size={17} className="text-sky-600 dark:text-sky-400" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-100">
                  Mapa de pedidos
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Muestra pedidos en un mapa con filtros por estado y un resumen rápido.
                  Requiere coordenadas de destino en los pedidos.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={ordersMapEnabled}
                aria-label="Habilitar mapa de pedidos"
                disabled={featuresSaving}
                onClick={() => onToggleFeature('orders_map_module_enabled', !ordersMapEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  ordersMapEnabled
                    ? 'bg-sky-500 dark:bg-sky-600'
                    : 'bg-stone-200 dark:bg-stone-700'
                } disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-md transition-transform ${
                    ordersMapEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
