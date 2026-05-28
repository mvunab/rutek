import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Input';
import { useClientStore } from '../../store/useClientStore';
import type { OrderPriority } from '../../types';

export interface OrderFormData {
  clientId: string;
  /** Cliente final / destinatario del pedido (no la cuenta/mandante). */
  destinatario: string;
  priority: OrderPriority;
  destStreet: string;
  destCity: string;
  destRegion: string;
  estimatedDelivery: string;
  notes: string;
  bultos: number;
  dispatchGuideUrl: string;
}

const emptyOrderForm: OrderFormData = {
  clientId: '',
  destinatario: '',
  priority: 'medium',
  destStreet: '',
  destCity: '',
  destRegion: 'Metropolitana',
  estimatedDelivery: '',
  notes: '',
  bultos: 1,
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
  /** Nombre visible si el cliente está bloqueado (p. ej. inactivo en el listado). */
  lockedClientName?: string;
  /** Estilos para panel lateral oscuro. */
  variant?: 'default' | 'dark';
}

const EMPTY_INITIAL: Partial<OrderFormData> = {};

export function OrderForm({
  initial = EMPTY_INITIAL,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  lockedClientId,
  lockedClientName,
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
  const [form, setForm] = useState<OrderFormData>({ ...emptyOrderForm, ...effectiveInitial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { clients } = useClientStore();
  const regionOptions = useMemo(() => {
    const base: { value: string; label: string }[] = [
      { value: 'Arica y Parinacota', label: 'Arica y Parinacota' },
      { value: 'Tarapacá', label: 'Tarapacá' },
      { value: 'Antofagasta', label: 'Antofagasta' },
      { value: 'Atacama', label: 'Atacama' },
      { value: 'Coquimbo', label: 'Coquimbo' },
      { value: 'Valparaíso', label: 'Valparaíso' },
      { value: 'Metropolitana', label: 'Región Metropolitana' },
      { value: "O'Higgins", label: "O'Higgins" },
      { value: 'Maule', label: 'Maule' },
      { value: 'Ñuble', label: 'Ñuble' },
      { value: 'Biobío', label: 'Biobío' },
      { value: 'Araucanía', label: 'La Araucanía' },
      { value: 'Los Ríos', label: 'Los Ríos' },
      { value: 'Los Lagos', label: 'Los Lagos' },
      { value: 'Aysén', label: 'Aysén' },
      { value: 'Magallanes', label: 'Magallanes' },
    ];

    const current = form.destRegion?.trim() || '';
    const empty = { value: '', label: 'Seleccionar región…' };
    if (!current) return [empty, ...base];
    if (base.some((o) => o.value === current)) return [empty, ...base];
    // Datos legacy: permitir el valor actual.
    return [empty, { value: current, label: current }, ...base];
  }, [form.destRegion]);

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
    if (!form.destStreet.trim()) errs.destStreet = 'Requerido';
    if (!form.destCity.trim()) errs.destCity = 'Requerido';
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
        <div className="grid grid-cols-2 gap-3">
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
        <h4 className={sectionTitle}>Dirección de entrega</h4>
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
            label="Dirección"
            placeholder="Calle y número"
            value={form.destStreet}
            onChange={setField('destStreet')}
            error={errors.destStreet}
            containerClassName="col-span-2"
          />
          <Input label="Ciudad" placeholder="Santiago" value={form.destCity} onChange={setField('destCity')} error={errors.destCity} />
          <Select
            label="Región"
            id="order-form-region"
            value={form.destRegion}
            onChange={setField('destRegion')}
            options={regionOptions}
          />
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
