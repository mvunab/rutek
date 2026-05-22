import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Input';
import { useClientStore } from '../../store/useClientStore';
import type { OrderPriority } from '../../types';

export interface OrderFormData {
  clientId: string;
  priority: OrderPriority;
  destStreet: string;
  destCity: string;
  destRegion: string;
  estimatedDelivery: string;
  notes: string;
  bultos: number;
  dispatchGuideUrl: string;
}

export const emptyOrderForm: OrderFormData = {
  clientId: '',
  priority: 'medium',
  destStreet: '',
  destCity: '',
  destRegion: 'Metropolitana',
  estimatedDelivery: '',
  notes: '',
  bultos: 0,
  dispatchGuideUrl: '',
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
}

const EMPTY_INITIAL: Partial<OrderFormData> = {};

export function OrderForm({
  initial = EMPTY_INITIAL,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  lockedClientId,
}: OrderFormProps) {
  const effectiveInitial = lockedClientId
    ? { ...initial, clientId: lockedClientId }
    : initial;
  const [form, setForm] = useState<OrderFormData>({ ...emptyOrderForm, ...effectiveInitial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { clients } = useClientStore();

  const setField =
    (field: keyof OrderFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: '' }));
    };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.clientId) errs.clientId = 'Selecciona un cliente';
    if (!form.destStreet.trim()) errs.destStreet = 'Requerido';
    if (!form.destCity.trim()) errs.destCity = 'Requerido';
    if (!form.estimatedDelivery) errs.estimatedDelivery = 'Requerido';
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
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">
          Detalle de despacho (planificado)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Bultos"
            id="order-form-bultos"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={Number.isNaN(form.bultos) ? 0 : form.bultos}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                bultos: Math.max(0, Math.floor(Number(e.target.value) || 0)),
              }))
            }
          />
          <Input
            label="Guía de despacho (URL)"
            id="order-form-dispatch-guide"
            type="url"
            inputMode="url"
            spellCheck={false}
            autoComplete="off"
            placeholder="https://…"
            value={form.dispatchGuideUrl}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dispatchGuideUrl: e.target.value }))
            }
            hint="Enlace a imagen o PDF de la guía escaneada."
          />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">
          Información general
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Cliente"
            value={form.clientId}
            onChange={setField('clientId')}
            options={clientOptions}
            error={errors.clientId}
            containerClassName="col-span-2"
            disabled={!!lockedClientId}
            hint={
              lockedClientId
                ? 'El cliente está fijado por la ruta y no puede cambiarse aquí.'
                : 'Si el cliente no está cerrado aún, elegí la cuenta provisional que uses en tu proceso; podés corregirlo después.'
            }
          />
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
        <h4 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">
          Dirección de entrega
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Dirección"
            placeholder="Calle y número"
            value={form.destStreet}
            onChange={setField('destStreet')}
            error={errors.destStreet}
            containerClassName="col-span-2"
          />
          <Input label="Ciudad" placeholder="Santiago" value={form.destCity} onChange={setField('destCity')} error={errors.destCity} />
          <Input label="Región" value={form.destRegion} onChange={setField('destRegion')} />
        </div>
      </div>

      <Textarea label="Notas" placeholder="Instrucciones especiales de entrega..." value={form.notes} onChange={setField('notes')} rows={2} />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => void handleSubmit()}>{submitLabel}</Button>
      </div>
    </div>
  );
}
