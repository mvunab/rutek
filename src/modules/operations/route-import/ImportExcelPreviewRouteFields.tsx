import { Input, Select } from '../../../components/ui/Input';
import type { ImportExcelPreview } from './importExcelPreviewTypes';
import type { Client } from '../../../types';

export function ImportExcelPreviewRouteFields({
  preview,
  clients,
  accountClientId,
  onAccountClientIdChange,
  routeSequence,
  onRouteSequenceChange,
  parsedRouteSequence,
  duplicateSequenceError,
  suggestedRouteSequence,
  excelRouteNumber,
  routeName,
  onRouteNameChange,
  routeDate,
  onRouteDateChange,
  onClearConfirmError,
}: {
  preview: ImportExcelPreview;
  clients: Client[];
  accountClientId: string;
  onAccountClientIdChange: (id: string) => void;
  routeSequence: string;
  onRouteSequenceChange: (value: string) => void;
  parsedRouteSequence: number | null;
  duplicateSequenceError: boolean;
  suggestedRouteSequence: number;
  excelRouteNumber: string | null;
  routeName: string;
  onRouteNameChange: (value: string) => void;
  routeDate: string;
  onRouteDateChange: (value: string) => void;
  onClearConfirmError: () => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <Select
          label="Cuenta (Mandante)"
          value={accountClientId}
          onChange={(e) => onAccountClientIdChange(e.target.value)}
          options={[
            { value: '', label: 'Sin cuenta (asignar después)…' },
            ...clients
              .filter((c) => c.active)
              .toSorted((a, b) => a.companyName.localeCompare(b.companyName, 'es'))
              .map((c) => ({ value: c.id, label: c.companyName })),
          ]}
          autoComplete="off"
          hint="Opcional. Si no seleccionas una cuenta, la ruta quedará sin cuenta y podrás asignarla después."
        />
      </div>
      <div>
        <Input
          id="import-route-sequence"
          label="N° consecutivo de ruta"
          name="import_route_sequence"
          inputMode="numeric"
          value={routeSequence}
          onChange={(e) => {
            onRouteSequenceChange(e.target.value);
            onClearConfirmError();
          }}
          autoComplete="off"
          hint={
            excelRouteNumber
              ? `Leído del Excel: ${excelRouteNumber}. Cambialo si ese N° ya existe en el sistema.`
              : 'Ingresa el N° correlativo de la ficha.'
          }
          error={
            parsedRouteSequence == null && routeSequence.trim() !== ''
              ? 'Debe ser un entero positivo.'
              : duplicateSequenceError
                ? 'Este N° ya está en uso.'
                : undefined
          }
        />
        {duplicateSequenceError ? (
          <button
            type="button"
            className="mt-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
            onClick={() => {
              onRouteSequenceChange(String(suggestedRouteSequence));
              onClearConfirmError();
            }}
          >
            Usar siguiente disponible (N° {suggestedRouteSequence})
          </button>
        ) : null}
      </div>
      <div>
        <label
          htmlFor="import-route-name"
          className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
        >
          Nombre de la ruta
        </label>
        <input
          id="import-route-name"
          type="text"
          value={routeName}
          onChange={(e) => onRouteNameChange(e.target.value)}
          placeholder={`Ruta ${preview.route_number} · ${preview.rows[0]?.client_name ?? '…'}`}
          className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          autoComplete="off"
        />
      </div>
      <div>
        <label
          htmlFor="import-route-date"
          className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
        >
          Fecha de la ruta
        </label>
        <input
          id="import-route-date"
          type="date"
          value={routeDate}
          onChange={(e) => onRouteDateChange(e.target.value)}
          className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        />
      </div>
    </div>
  );
}
