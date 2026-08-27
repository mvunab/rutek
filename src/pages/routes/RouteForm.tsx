import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { useClientStore } from '../../store/useClientStore';
import { parseRouteSequenceInput } from '../../lib/routeSequence';
import type { RouteFormData } from './routesShared';

export function RouteForm({
  initial,
  suggestedSequence,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  error,
}: {
  initial?: Partial<RouteFormData>;
  suggestedSequence?: number;
  onSubmit: (data: RouteFormData) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  error?: string | null;
}) {
  const { clients, fetchClients } = useClientStore();
  const [form, setForm] = useState<RouteFormData>({
    guiaInterna: suggestedSequence != null ? String(suggestedSequence) : '',
    name: '',
    notes: '',
    clientId: '',
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [sequenceTouched, setSequenceTouched] = useState(Boolean(initial?.guiaInterna));

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  /** Sugerencia derivada: evita sync por effect cuando llega `suggestedSequence` tarde. */
  const guiaInternaValue =
    !sequenceTouched && suggestedSequence != null && !form.guiaInterna.trim()
      ? String(suggestedSequence)
      : form.guiaInterna;

  const f = (field: keyof RouteFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (field === 'guiaInterna') setSequenceTouched(true);
      setForm((p) => ({ ...p, [field]: e.target.value }));
    };

  const clientOptions = [
    { value: '', label: 'Sin cuenta (se asigna al primer pedido)…' },
    ...clients
      .filter((c) => c.active)
      .toSorted((a, b) => a.companyName.localeCompare(b.companyName, 'es'))
      .map((c) => ({ value: c.id, label: c.companyName })),
  ];

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    const sequence = parseRouteSequenceInput(guiaInternaValue);
    if (sequence == null) return;
    setSaving(true);
    try {
      await onSubmit({
        guiaInterna: String(sequence),
        name: form.name.trim(),
        notes: form.notes.trim(),
        clientId: form.clientId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <Select
        label="Cuenta (Mandante)"
        value={form.clientId}
        onChange={f('clientId')}
        options={clientOptions}
        autoComplete="off"
        hint="Todos los pedidos de la ruta deben pertenecer a la misma cuenta (mandante). Si no la seleccionás ahora, se inferirá del primer pedido que agregues."
      />
      <Input
        label="N° de ruta (consecutivo)"
        placeholder={suggestedSequence != null ? String(suggestedSequence) : 'Ej: 1246…'}
        value={guiaInternaValue}
        onChange={f('guiaInterna')}
        name="route_sequence"
        type="number"
        inputMode="numeric"
        min={1}
        autoComplete="off"
        spellCheck={false}
        hint={
          suggestedSequence != null
            ? `Sugerido: ${suggestedSequence} (último consecutivo + 1). Es el número de tu planilla / Excel.`
            : 'Número consecutivo de tu hoja de ruta (no es el folio interno del sistema).'
        }
      />
      <Input
        label="Nombre de la ruta"
        placeholder="Ej: Santiago Norte"
        value={form.name}
        onChange={f('name')}
        name="route_name"
      />
      <Textarea
        label="Notas"
        placeholder="Instrucciones opcionales…"
        value={form.notes}
        onChange={f('notes')}
        rows={3}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          loading={saving}
          disabled={!form.name.trim() || parseRouteSequenceInput(form.guiaInterna) == null}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
