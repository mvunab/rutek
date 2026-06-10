import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Input';
import { useClientStore } from '../../store/useClientStore';
import { chileRegionSelectOptions } from '../../lib/chileRegions';
import { resolveDefaultPickupAddress } from '../../lib/orderAddress';
import type { OrderPriority } from '../../types';

export interface OrderFormData {
  clientId: string;
  /** Cliente final / destinatario del pedido (no la cuenta/mandante). */
  destinatario: string;
  priority: OrderPriority;
  originStreet: string;
  originCity: string;
  originRegion: string;
  destStreet: string;
  destCity: string;
  destRegion: string;
  estimatedDelivery: string;
  notes: string;
  bultos: number;
}

const emptyOrderForm: OrderFormData = {
  clientId: '',
  destinatario: '',
  priority: 'medium',
  originStreet: '',
  originCity: '',
  originRegion: 'Metropolitana',
  destStreet: '',
  destCity: '',
  destRegion: 'Metropolitana',
  estimatedDelivery: '',
  notes: '',
  bultos: 1,
};

interface OrderFormProps {
  initial?: Partial<OrderFormData>;
  onSubmit: (data: OrderFormData) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  /**
   * Cuando se crea un pedido dentro de una ruta con cliente ya fijado,
   * pasa el UUID aquí para pre-seleccionarlo y bloquearlo.
   */
  lockedClientId?: string;
  /** Nombre visible si el cliente está bloqueado (p. ej. inactivo en el listado). */
  lockedClientName?: string;
  /** Origen por defecto al crear (bodega mandante / empresa). */
  defaultOrigin?: Partial<Pick<OrderFormData, 'originStreet' | 'originCity' | 'originRegion'>>;
  /** Estilos para panel lateral oscuro. */
  variant?: 'default' | 'dark';
}

const EMPTY_INITIAL: Partial<OrderFormData> = {};

function regionOptions(current?: string) {
  const base = chileRegionSelectOptions(current);
  return [{ value: '', label: 'Seleccionar región…' }, ...base];
}

export function OrderForm({
  initial = EMPTY_INITIAL,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  lockedClientId,
  lockedClientName,
  defaultOrigin,
  variant = 'default',
}: OrderFormProps) {
  const isDark = variant === 'dark';
  const sectionTitle = isDark
    ? 'text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3'
    : 'text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3';
  const fieldClass = isDark
    ? '[&_label]:text-stone-400 [&_input]:bg-stone-900/90 [&_input]:border-stone-700 [&_input]:text-stone-100 [&_select]:bg-stone-900/90 [&_select]:border-stone-700 [&_select]:text-stone-100 [&_textarea]:bg-stone-900/90 [&_textarea]:border-stone-700 [&_textarea]:text-stone-100 [&_.text-xs]:text-stone-500'
    : '';
  const effectiveInitial = lockedClientId
    ? { ...initial, clientId: lockedClientId }
    : initial;

  const hasOriginInInitial =
    Boolean(effectiveInitial.originCity?.trim()) ||
    Boolean(effectiveInitial.originStreet?.trim());

  const [form, setForm] = useState<OrderFormData>(() => ({
    ...emptyOrderForm,
    ...(!hasOriginInInitial && defaultOrigin
      ? {
          originStreet: defaultOrigin.originStreet ?? '',
          originCity: defaultOrigin.originCity ?? '',
          originRegion: defaultOrigin.originRegion ?? 'Metropolitana',
        }
      : {}),
    ...effectiveInitial,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { clients } = useClientStore();

  const originRegionOpts = useMemo(
    () => regionOptions(form.originRegion),
    [form.originRegion],
  );
  const destRegionOpts = useMemo(
    () => regionOptions(form.destRegion),
    [form.destRegion],
  );

  // Si el usuario elige mandante, sugerir origen desde la dirección de la cuenta.
  useEffect(() => {
    if (lockedClientId || !form.clientId) return;
    const client = clients.find((c) => c.id === form.clientId);
    if (!client?.city?.trim()) return;
    setForm((prev) => {
      if (prev.originCity.trim() || prev.originStreet.trim()) return prev;
      const suggested = resolveDefaultPickupAddress(client);
      return {
        ...prev,
        originStreet: suggested.street,
        originCity: suggested.city,
        originRegion: suggested.region,
      };
    });
  }, [form.clientId, lockedClientId, clients]);

  const setField =
    (field: keyof OrderFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: '' }));
    };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.clientId) errs.clientId = 'Selecciona una cuenta';
    if (!form.destinatario.trim()) errs.destinatario = 'Requerido';
    if (!form.originCity.trim()) errs.originCity = 'Indica la ciudad de retiro';
    if (!form.originRegion.trim()) errs.originRegion = 'Selecciona la región de retiro';
    if (!form.destStreet.trim()) errs.destStreet = 'Requerido';
    if (!form.destCity.trim()) errs.destCity = 'Requerido';
    if (!form.destRegion.trim()) errs.destRegion = 'Selecciona la región de entrega';
    if (!form.estimatedDelivery) errs.estimatedDelivery = 'Requerido';
    if (!form.bultos || form.bultos < 1) errs.bultos = 'Indica al menos 1 bulto';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    await onSubmit(form);
  };

  const clientOptions = clients.reduce<{ value: string; label: string }[]>(
    (acc, c) => {
      if (c.active) acc.push({ value: c.id, label: c.companyName });
      return acc;
    },
    [{ value: '', label: 'Seleccionar cliente…' }],
  );

  const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
  ];

  return (
    <div className={clsx('space-y-5', fieldClass)}>
      <div>
        <h4 className={sectionTitle}>Detalle de despacho (planificado)</h4>
        <Input
          label="Bultos"
          id="order-form-bultos"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={Number.isNaN(form.bultos) ? 1 : form.bultos}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              bultos: Math.max(1, Math.floor(Number(e.target.value) || 1)),
            }))
          }
          error={errors.bultos}
        />
      </div>

      <div>
        <h4 className={sectionTitle}>Información general</h4>
        <div className="grid grid-cols-2 gap-3">
          {lockedClientId ? (
            <Input
              label="Cuenta (Mandante)"
              id="order-form-client-locked"
              value={lockedClientName ?? clients.find((c) => c.id === lockedClientId)?.companyName ?? lockedClientId}
              readOnly
              disabled
              containerClassName="col-span-2"
              hint="La cuenta está fijada por la ruta y no puede cambiarse aquí."
            />
          ) : (
            <Select
              label="Cuenta (Mandante)"
              value={form.clientId}
              onChange={setField('clientId')}
              options={clientOptions}
              error={errors.clientId}
              containerClassName="col-span-2"
              hint="Si la cuenta no está definida aún, elige la cuenta provisional que uses en tu proceso; puedes corregirlo después."
            />
          )}
          <Select label="Prioridad" value={form.priority} onChange={setField('priority')} options={priorityOptions} />
          <Input
            label="Entrega estimada"
            type="date"
            value={form.estimatedDelivery}
            onChange={setField('estimatedDelivery')}
            error={errors.estimatedDelivery}
          />
        </div>
      </div>

      <div>
        <h4 className={sectionTitle}>Retiro de carga (origen)</h4>
        <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-3 -mt-1">
          Lugar donde el transportista retira la mercadería antes de llevarla al destino final.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Dirección de retiro"
            id="order-form-origin-street"
            name="origin_street"
            autoComplete="off"
            placeholder="Bodega, calle y número…"
            value={form.originStreet}
            onChange={setField('originStreet')}
            error={errors.originStreet}
            containerClassName="col-span-2"
          />
          <Input
            label="Ciudad"
            id="order-form-origin-city"
            placeholder="Ej: Quilicura…"
            value={form.originCity}
            onChange={setField('originCity')}
            error={errors.originCity}
          />
          <Select
            label="Región"
            id="order-form-origin-region"
            value={form.originRegion}
            onChange={setField('originRegion')}
            options={originRegionOpts}
            error={errors.originRegion}
          />
        </div>
      </div>

      <div>
        <h4 className={sectionTitle}>Entrega (destino)</h4>
        <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-3 -mt-1">
          Cliente final y dirección donde se entrega el pedido.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Destinatario"
            id="order-form-destinatario"
            name="destinatario"
            autoComplete="off"
            placeholder="Nombre de quien recibe…"
            value={form.destinatario}
            onChange={setField('destinatario')}
            error={errors.destinatario}
            containerClassName="col-span-2"
          />
          <Input
            label="Dirección de entrega"
            id="order-form-dest-street"
            placeholder="Calle y número…"
            value={form.destStreet}
            onChange={setField('destStreet')}
            error={errors.destStreet}
            containerClassName="col-span-2"
          />
          <Input
            label="Ciudad"
            id="order-form-dest-city"
            placeholder="Ej: Maipú…"
            value={form.destCity}
            onChange={setField('destCity')}
            error={errors.destCity}
          />
          <Select
            label="Región"
            id="order-form-dest-region"
            value={form.destRegion}
            onChange={setField('destRegion')}
            options={destRegionOpts}
            error={errors.destRegion}
          />
        </div>
      </div>

      <Textarea label="Notas" placeholder="Instrucciones especiales de entrega…" value={form.notes} onChange={setField('notes')} rows={2} />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => void handleSubmit()}>{submitLabel}</Button>
      </div>
    </div>
  );
}
