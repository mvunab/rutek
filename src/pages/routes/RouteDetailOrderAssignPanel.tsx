import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import type { Order } from '../../types';

type Props = {
  order: Order;
  orderDraftDriver: string;
  setOrderDraftDriver: (value: string) => void;
  orderDraftPeoneta: string;
  setOrderDraftPeoneta: (value: string) => void;
  orderDraftVehicle: string;
  setOrderDraftVehicle: (value: string) => void;
  orderApplyToAll: boolean;
  setOrderApplyToAll: (value: boolean) => void;
  orderAssignBusy: string | null;
  driverSelectOpts: { value: string; label: string }[];
  peonetaSelectOpts: { value: string; label: string }[];
  vehicleSelectOpts: { value: string; label: string }[];
  vehicleWarn: { plate: string; otherCodes: string[] } | null;
  onSave: () => void;
  onCancel: () => void;
};

export function RouteDetailOrderAssignPanel({
  order,
  orderDraftDriver,
  setOrderDraftDriver,
  orderDraftPeoneta,
  setOrderDraftPeoneta,
  orderDraftVehicle,
  setOrderDraftVehicle,
  orderApplyToAll,
  setOrderApplyToAll,
  orderAssignBusy,
  driverSelectOpts,
  peonetaSelectOpts,
  vehicleSelectOpts,
  vehicleWarn,
  onSave,
  onCancel,
}: Props) {
  return (
    <div className="border-t border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950/60 px-3 py-3 space-y-3">
      <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
        Asignación del pedido
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          id={`order-driver-${order.id}`}
          label="Chofer"
          value={orderDraftDriver}
          onChange={(e) => setOrderDraftDriver(e.target.value)}
          options={driverSelectOpts}
          disabled={orderAssignBusy !== null}
          autoComplete="off"
        />
        <Select
          id={`order-peoneta-${order.id}`}
          label="Peoneta"
          value={orderDraftPeoneta}
          onChange={(e) => setOrderDraftPeoneta(e.target.value)}
          options={peonetaSelectOpts}
          disabled={orderAssignBusy !== null}
          autoComplete="off"
        />
        <Select
          id={`order-vehicle-${order.id}`}
          label="Vehículo"
          value={orderDraftVehicle}
          onChange={(e) => setOrderDraftVehicle(e.target.value)}
          options={vehicleSelectOpts}
          disabled={orderAssignBusy !== null}
          autoComplete="off"
        />
      </div>
      {vehicleWarn ? (
        <p
          role="status"
          className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3"
        >
          {orderApplyToAll
            ? `Al guardar, el mismo vehículo (${vehicleWarn.plate}) quedará en todos los pedidos. Te pediremos confirmación.`
            : `Este vehículo (${vehicleWarn.plate}) ya está en ${vehicleWarn.otherCodes.join(', ')}. Te pediremos confirmación al guardar.`}
        </p>
      ) : null}
      <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-stone-600 dark:text-stone-300">
        <input
          type="checkbox"
          checked={orderApplyToAll}
          onChange={(e) => setOrderApplyToAll(e.target.checked)}
          disabled={orderAssignBusy !== null}
          className="h-4 w-4 rounded border-stone-300 dark:border-stone-600 accent-primary-600"
        />
        Aplicar a todos los pedidos de esta ruta
      </label>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          loading={orderAssignBusy === order.id}
          disabled={orderAssignBusy !== null}
          onClick={onSave}
        >
          Guardar asignación
        </Button>
        <Button type="button" variant="ghost" disabled={orderAssignBusy !== null} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
