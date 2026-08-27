import { clsx } from 'clsx';
import type { VehicleType } from '../../types';
import { VEHICLE_COMPLIANCE_WARN_DAYS } from '../../lib/vehicleCompliance';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { TYPE_OPTIONS, type VehicleFormState } from './vehicleForm';

export function VehicleFormModal({
  open,
  editing,
  form,
  formError,
  saving,
  formBaseId,
  onClose,
  onSave,
  onFormChange,
}: {
  open: boolean;
  editing: boolean;
  form: VehicleFormState;
  formError: string | null;
  saving: boolean;
  formBaseId: string;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (updater: (prev: VehicleFormState) => VehicleFormState) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title={editing ? 'Editar vehículo' : 'Nuevo vehículo'}
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => !saving && onClose()}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSave} loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {formError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {formError}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id={`${formBaseId}-plate`}
            label="Patente"
            name="plate"
            value={form.plate}
            onChange={(e) => onFormChange((f) => ({ ...f, plate: e.target.value.toUpperCase() }))}
            placeholder="ABCD12"
            autoComplete="off"
            spellCheck={false}
            translate="no"
          />
          <Input
            id={`${formBaseId}-year`}
            label="Año"
            name="year"
            inputMode="numeric"
            value={form.year}
            onChange={(e) =>
              onFormChange((f) => ({ ...f, year: e.target.value.replace(/\D/g, '').slice(0, 4) }))
            }
            placeholder="2024"
          />
          <Input
            id={`${formBaseId}-brand`}
            label="Marca"
            name="brand"
            value={form.brand}
            onChange={(e) => onFormChange((f) => ({ ...f, brand: e.target.value }))}
            placeholder="PEUGEOT"
            autoComplete="off"
          />
          <Input
            id={`${formBaseId}-model`}
            label="Modelo"
            name="model"
            value={form.model}
            onChange={(e) => onFormChange((f) => ({ ...f, model: e.target.value }))}
            placeholder="BOXER"
            autoComplete="off"
          />
          <Select
            id={`${formBaseId}-type`}
            label="Tipo"
            value={form.type}
            onChange={(e) => onFormChange((f) => ({ ...f, type: e.target.value as VehicleType }))}
            options={TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <Input
            id={`${formBaseId}-capacity`}
            label="Capacidad (t)"
            name="capacity"
            inputMode="decimal"
            value={form.capacity}
            onChange={(e) => onFormChange((f) => ({ ...f, capacity: e.target.value }))}
            placeholder="0"
            hint="Puedes usar 0 si no aplica."
          />
          <Input
            id={`${formBaseId}-vin`}
            label="VIN (opcional)"
            name="vin"
            value={form.vin}
            onChange={(e) =>
              onFormChange((f) => ({
                ...f,
                vin: e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, '').slice(0, 17),
              }))
            }
            placeholder="17 caracteres máx."
            autoComplete="off"
            spellCheck={false}
            translate="no"
            hint="Para futura carga automática de datos del vehículo vía scraping."
            containerClassName="sm:col-span-2"
          />
          <Input
            id={`${formBaseId}-maintenance`}
            label="Próxima mantención"
            name="maintenanceDueDate"
            type="date"
            value={form.maintenanceDueDate}
            onChange={(e) => onFormChange((f) => ({ ...f, maintenanceDueDate: e.target.value }))}
          />
          <Input
            id={`${formBaseId}-circulation`}
            label="Venc. permiso de circulación"
            name="circulationPermitDueDate"
            type="date"
            value={form.circulationPermitDueDate}
            onChange={(e) => onFormChange((f) => ({ ...f, circulationPermitDueDate: e.target.value }))}
          />
          <Input
            id={`${formBaseId}-technical`}
            label="Venc. revisión técnica"
            name="technicalReviewDueDate"
            type="date"
            value={form.technicalReviewDueDate}
            onChange={(e) => onFormChange((f) => ({ ...f, technicalReviewDueDate: e.target.value }))}
            containerClassName="sm:col-span-2"
          />
          <p className="sm:col-span-2 text-xs text-stone-500 dark:text-stone-400 -mt-1">
            Alerta amarilla {VEHICLE_COMPLIANCE_WARN_DAYS} días antes; roja si ya venció.
          </p>
          <div className="sm:col-span-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-t border-stone-100 dark:border-stone-800 pt-4 mt-1">
            <div className="min-w-0">
              <p id={`${formBaseId}-estado-label`} className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Estado
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400" aria-live="polite">
                {form.available ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.available}
              aria-labelledby={`${formBaseId}-estado-label`}
              aria-label={form.available ? 'Desactivar vehículo' : 'Activar vehículo'}
              onClick={() => onFormChange((f) => ({ ...f, available: !f.available }))}
              className={clsx(
                'relative shrink-0 h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900',
                form.available ? 'bg-primary-500' : 'bg-stone-300 dark:bg-stone-600',
              )}
            >
              <span
                className={clsx(
                  'pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-white shadow transition-[transform]',
                  form.available ? 'left-[22px]' : 'left-1',
                )}
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
