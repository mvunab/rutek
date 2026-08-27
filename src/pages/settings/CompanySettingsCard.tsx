import { AlertCircle, Building2, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatTenantPlanLabel } from '../../lib/tenantPlan';
import type { CompanyForm } from './settingsShared';

type CompanySettingsCardProps = {
  form: CompanyForm;
  canEdit: boolean;
  saving: boolean;
  saved: boolean;
  error: string;
  onChange: <K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function CompanySettingsCard({
  form,
  canEdit,
  saving,
  saved,
  error,
  onChange,
  onSubmit,
}: CompanySettingsCardProps) {
  return (
    <Card padding="lg">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
          <Building2 size={20} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Configuración de empresa
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Datos de tu organización visibles en la plataforma.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <fieldset disabled={!canEdit} className="space-y-4 border-0 p-0 m-0 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre comercial"
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              required
            />
            <Input
              label="Razón social"
              value={form.legalName}
              onChange={(e) => onChange('legalName', e.target.value)}
              placeholder="Razón social legal…"
            />
            <Input
              label="RUT empresa"
              value={form.rut}
              onChange={(e) => onChange('rut', e.target.value)}
              required
              spellCheck={false}
            />
            <Input
              label="Plan contratado"
              value={formatTenantPlanLabel(form.plan)}
              disabled
              readOnly
              hint="El plan lo gestiona el administrador de la plataforma."
            />
            <Input
              label="Email de contacto"
              type="email"
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="contacto@empresa.cl"
              autoComplete="email"
              spellCheck={false}
            />
            <Input
              label="Teléfono"
              type="tel"
              value={form.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="+56 9 1234 5678"
              autoComplete="tel"
            />
          </div>
          <Input
            label="Dirección"
            value={form.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="Calle, número, comuna…"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ciudad"
              value={form.city}
              onChange={(e) => onChange('city', e.target.value)}
            />
            <Input
              label="Región"
              value={form.region}
              onChange={(e) => onChange('region', e.target.value)}
            />
          </div>
        </fieldset>

        {error && (
          <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5" role="alert">
            <AlertCircle size={14} aria-hidden />
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {canEdit ? (
            <Button type="submit" loading={saving}>Guardar cambios</Button>
          ) : null}
          {saved && (
            <span
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"
              role="status"
              aria-live="polite"
            >
              <Check size={16} aria-hidden />
              Cambios guardados
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
