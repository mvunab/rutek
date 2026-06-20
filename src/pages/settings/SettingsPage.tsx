import { useEffect, useRef, useState } from 'react';
import {
  Building2, Moon, Sun, Monitor, Check, Key, Eye, EyeOff, Tags, Plus, Trash2,
  FileSpreadsheet, Zap, Upload, X, AlertCircle, Activity, Map,
} from 'lucide-react';
import { PricingProfileSection } from '../../components/pricing/PricingProfileSection';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { useNavTourStore } from '../../store/useNavTourStore';
import type { Tenant, ExcelFormatConfig, ExcelColumnMapping } from '../../types';
import type { DbTenant } from '../../types/api';
import {
  maxMappedColumnIndex,
  normalizeExcelFormat,
  normalizeExcelFormatsList,
} from '../../lib/excelFormat';
import { api, ApiError } from '../../lib/api';
import { authService } from '../../services/auth.service';

type CompanyForm = {
  name: string;
  legalName: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  plan: Tenant['plan'];
};

const emptyForm: CompanyForm = {
  name: '',
  legalName: '',
  rut: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  region: '',
  plan: 'starter',
};

function tenantToForm(tenant: Tenant): CompanyForm {
  return {
    name: tenant.name,
    legalName: tenant.legalName ?? '',
    rut: tenant.rut,
    email: tenant.email ?? '',
    phone: tenant.phone ?? '',
    address: tenant.address ?? '',
    city: tenant.city ?? '',
    region: tenant.region ?? '',
    plan: tenant.plan,
  };
}

function isTenantAdmin(role: string | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}

function NavTourSettingsCard() {
  const requestStart = useNavTourStore((s) => s.requestStart);

  return (
    <Card padding="lg">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
          <Map size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Tour del menú
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Repasa las secciones principales del menú lateral con una guía paso a paso.
          </p>
        </div>
      </div>
      <Button type="button" variant="secondary" onClick={requestStart}>
        Ver tour del menú
      </Button>
    </Card>
  );
}

export function SettingsPage() {
  const { tenant, user, updateTenant, changeMyPassword, loading: authLoading } = useAuthStore();
  const { theme, setTheme } = useUiStore();
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [hydrating, setHydrating] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savedCompany, setSavedCompany] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savedPw, setSavedPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [extraOrderStatuses, setExtraOrderStatuses] = useState<{ slug: string; label: string }[]>([]);
  const [orderStatusErr, setOrderStatusErr] = useState('');
  const [savedOrderStatuses, setSavedOrderStatuses] = useState(false);
  const [savingOrderStatuses, setSavingOrderStatuses] = useState(false);

  useEffect(() => {
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const refreshTenant = async () => {
    setHydrating(true);
    setLoadError('');
    try {
      const fresh = await authService.getTenant();
      if (fresh) {
        updateTenant(fresh);
        setForm(tenantToForm(fresh));
        setExtraOrderStatuses(
          (fresh.customOrderStatuses ?? []).map((r) => ({ slug: r.slug, label: r.label })),
        );
      } else if (!useAuthStore.getState().tenant) {
        setLoadError('No se pudo cargar la empresa. Verifica tu conexión e intenta de nuevo.');
      }
    } catch {
      if (!useAuthStore.getState().tenant) {
        setLoadError('No se pudo cargar la configuración. Intenta de nuevo.');
      }
    } finally {
      setHydrating(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (tenant) {
      setForm(tenantToForm(tenant));
      setExtraOrderStatuses(
        (tenant.customOrderStatuses ?? []).map((r) => ({ slug: r.slug, label: r.label })),
      );
      setHydrating(false);
    }
    void refreshTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar al montar con sesión lista
  }, [authLoading]);

  useEffect(() => {
    if (hydrating || !tenant) return;
    setForm(tenantToForm(tenant));
  }, [tenant, hydrating]);

  useEffect(() => {
    if (hydrating || !tenant) return;
    setExtraOrderStatuses(
      (tenant.customOrderStatuses ?? []).map((r) => ({ slug: r.slug, label: r.label })),
    );
  }, [tenant?.customOrderStatuses, tenant, hydrating]);

  const handleSaveOrderStatuses = async () => {
    if (!tenant || !isTenantAdmin(user?.role)) return;
    setOrderStatusErr('');
    setSavingOrderStatuses(true);
    try {
      const cleaned = extraOrderStatuses
        .map((r) => ({
          slug: r.slug.trim().toLowerCase(),
          label: r.label.trim(),
        }))
        .filter((r) => r.slug.length > 0 && r.label.length > 0);
      const res = await api.patch<{ custom_order_statuses: { slug: string; label: string }[] }>(
        '/tenant/order-statuses',
        { custom_order_statuses: cleaned },
      );
      updateTenant({ customOrderStatuses: res.custom_order_statuses });
      setSavedOrderStatuses(true);
      window.setTimeout(() => setSavedOrderStatuses(false), 2200);
    } catch {
      setOrderStatusErr(
        'No se pudo guardar. Los slugs deben ser únicos, en minúscula y solo letras/números/guion bajo (ej. en_bodega).',
      );
    } finally {
      setSavingOrderStatuses(false);
    }
  };

  const set = <K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setCompanyError('');
    setSavingCompany(true);
    const payload = {
      name: form.name.trim(),
      legalName: form.legalName.trim() || undefined,
      rut: form.rut.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      region: form.region.trim() || undefined,
      plan: form.plan,
    };
    try {
      const data = await api.patch<DbTenant>('/tenant/profile', payload);
      const fresh = await authService.getTenant();
      if (fresh) {
        updateTenant(fresh);
      } else {
        updateTenant({
          name: data.name,
          legalName: data.legal_name ?? undefined,
          rut: data.rut,
          email: data.email ?? undefined,
          phone: data.phone ?? undefined,
          address: data.address ?? undefined,
          city: data.city ?? undefined,
          region: data.region ?? undefined,
          plan: data.plan as Tenant['plan'],
        });
      }
      setSavedCompany(true);
      window.setTimeout(() => setSavedCompany(false), 2500);
    } catch {
      setCompanyError('No se pudieron guardar los datos. Intenta de nuevo.');
    } finally {
      setSavingCompany(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Las contraseñas no coinciden');
      return;
    }
    if (pwForm.next.length < 6) {
      setPwError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    const ok = await changeMyPassword(pwForm.current, pwForm.next);
    if (ok) {
      setSavedPw(true);
      setPwForm({ current: '', next: '', confirm: '' });
      window.setTimeout(() => setSavedPw(false), 2500);
    } else {
      setPwError('No se pudo cambiar la contraseña. Verifica tu contraseña actual.');
    }
  };

  if (authLoading || hydrating) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2" role="status">
        <Activity size={20} className="animate-spin text-primary-600" aria-hidden />
        <span className="text-sm text-stone-500 dark:text-stone-400">Cargando configuración…</span>
      </div>
    );
  }

  const canEditTenant = isTenantAdmin(user?.role);

  if (!tenant) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <NavTourSettingsCard />
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            {loadError || 'No hay empresa asociada a tu cuenta.'}
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={() => void refreshTenant()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      {loadError ? (
        <div
          className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          role="alert"
        >
          <p className="text-sm text-amber-900 dark:text-amber-200">{loadError}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => void refreshTenant()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {/* Apariencia */}
      <Card padding="lg">
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
            <Monitor size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Apariencia
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Elige entre tema claro u oscuro en toda la aplicación.
            </p>
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row gap-3"
          role="group"
          aria-label="Tema de la interfaz"
        >
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 ${
              theme === 'light'
                ? 'border-primary-500 bg-primary-50 text-primary-800 dark:bg-primary-950/60 dark:text-primary-200'
                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            <Sun size={18} aria-hidden />
            Claro
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 ${
              theme === 'dark'
                ? 'border-primary-500 bg-primary-50 text-primary-800 dark:bg-primary-950/60 dark:text-primary-200'
                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            <Moon size={18} aria-hidden />
            Oscuro
          </button>
        </div>
      </Card>

      <NavTourSettingsCard />

      {canEditTenant && (
        <Card padding="lg">
          <div className="flex items-start gap-3 mb-5">
            <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <Tags size={20} aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Estados de pedido personalizados
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                El tenant siempre tiene Pendiente, En ruta, Entregado y Rechazada. Acá definís etiquetas extra (slug en minúscula, sin espacios).
              </p>
            </div>
          </div>
          {orderStatusErr ? (
            <p className="text-sm text-red-600 dark:text-red-400 mb-3" role="alert">
              {orderStatusErr}
            </p>
          ) : null}
          <div className="space-y-3 mb-4">
            {extraOrderStatuses.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">Sin estados adicionales.</p>
            ) : null}
            {extraOrderStatuses.map((row, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-end">
                <Input
                  label="Slug (interno)"
                  spellCheck={false}
                  autoComplete="off"
                  value={row.slug}
                  onChange={(e) => {
                    const next = [...extraOrderStatuses];
                    next[i] = { ...next[i], slug: e.target.value };
                    setExtraOrderStatuses(next);
                  }}
                  containerClassName="flex-1 min-w-[140px]"
                />
                <Input
                  label="Etiqueta visible"
                  value={row.label}
                  onChange={(e) => {
                    const next = [...extraOrderStatuses];
                    next[i] = { ...next[i], label: e.target.value };
                    setExtraOrderStatuses(next);
                  }}
                  containerClassName="flex-1 min-w-[160px]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExtraOrderStatuses(extraOrderStatuses.filter((_, j) => j !== i))
                  }
                  aria-label={`Quitar fila ${i + 1}`}
                >
                  <Trash2 size={16} aria-hidden />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus size={14} aria-hidden />}
              onClick={() => setExtraOrderStatuses([...extraOrderStatuses, { slug: '', label: '' }])}
              disabled={extraOrderStatuses.length >= 30}
            >
              Añadir estado
            </Button>
            <Button
              type="button"
              loading={savingOrderStatuses}
              onClick={() => void handleSaveOrderStatuses()}
            >
              Guardar catálogo
            </Button>
            {savedOrderStatuses ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check size={14} aria-hidden /> Guardado
              </span>
            ) : null}
          </div>
        </Card>
      )}

      {/* Empresa */}
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

        <form onSubmit={(e) => void handleCompanySubmit(e)} className="space-y-4">
          <fieldset disabled={!canEditTenant} className="space-y-4 border-0 p-0 m-0 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre comercial"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
            <Input
              label="Razón social"
              value={form.legalName}
              onChange={(e) => set('legalName', e.target.value)}
              placeholder="Razón social legal…"
            />
            <Input
              label="RUT empresa"
              value={form.rut}
              onChange={(e) => set('rut', e.target.value)}
              required
              spellCheck={false}
            />
            <Select
              label="Plan contratado"
              value={form.plan}
              onChange={(e) => set('plan', e.target.value as CompanyForm['plan'])}
              disabled={!canEditTenant}
              options={[
                { value: 'starter', label: 'Starter' },
                { value: 'professional', label: 'Professional' },
                { value: 'enterprise', label: 'Enterprise' },
              ]}
            />
            <Input
              label="Email de contacto"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="contacto@empresa.cl"
              autoComplete="email"
              spellCheck={false}
            />
            <Input
              label="Teléfono"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+56 9 1234 5678"
              autoComplete="tel"
            />
          </div>
          <Input
            label="Dirección"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Calle, número, comuna…"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ciudad"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
            />
            <Input
              label="Región"
              value={form.region}
              onChange={(e) => set('region', e.target.value)}
            />
          </div>
          </fieldset>

          {companyError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5" role="alert">
              <AlertCircle size={14} aria-hidden />
              {companyError}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {canEditTenant ? (
              <Button type="submit" loading={savingCompany}>Guardar cambios</Button>
            ) : null}
            {savedCompany && (
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

      {/* Contraseña */}
      <Card padding="lg">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Key size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Cambiar contraseña
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Actualiza tu contraseña de acceso a la plataforma.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Contraseña actual"
                type={showCurrent ? 'text' : 'password'}
                value={pwForm.current}
                onChange={(e) => setPwForm(prev => ({ ...prev, current: e.target.value }))}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-8 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Nueva contraseña"
                type={showNext ? 'text' : 'password'}
                value={pwForm.next}
                onChange={(e) => setPwForm(prev => ({ ...prev, next: e.target.value }))}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNext(!showNext)}
                className="absolute right-3 top-8 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                {showNext ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Confirmar nueva contraseña"
                type={showConfirm ? 'text' : 'password'}
                value={pwForm.confirm}
                onChange={(e) => setPwForm(prev => ({ ...prev, confirm: e.target.value }))}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-8 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {pwError && (
            <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" disabled={authLoading}>
              {authLoading ? 'Cambiando…' : 'Cambiar contraseña'}
            </Button>
            {savedPw && (
              <span
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"
                role="status"
                aria-live="polite"
              >
                <Check size={16} aria-hidden />
                Contraseña actualizada
              </span>
            )}
          </div>
        </form>
      </Card>

      {canEditTenant && (
        <>
          <PricingProfileSection />
          <ExcelFormatsSection />
        </>
      )}
    </div>
  );
}

// ─── Sección Formatos Excel ───────────────────────────────────────────────────

const SYSTEM_FIELDS: { key: keyof ExcelColumnMapping; label: string; hint: string }[] = [
  { key: 'clientName', label: 'Destinatario / Tienda', hint: 'Ej. RIPLEY, FALABELLA…' },
  { key: 'entrega', label: 'Entrega / Local', hint: 'Descripción del punto de entrega' },
  { key: 'numeroOC', label: 'N° Documento / OC', hint: 'Código de documento u orden' },
  { key: 'factura', label: 'Factura / Cód. Tienda', hint: 'Número de factura o código interno' },
  { key: 'refFactura', label: 'Ref. Factura', hint: 'Referencia adicional de factura' },
  { key: 'tipo', label: 'Tipo de entrega', hint: 'G, N, etc.' },
  { key: 'cajas', label: 'Cajas / Bultos', hint: 'Número entero' },
  { key: 'unidades', label: 'Unidades', hint: 'Número entero' },
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const colLetter = (idx: number) => LETTERS[idx] ?? String(idx);

type RawHeadersResult = { rows: (string | null)[][]; sheetName: string };

function emptyFormat(): Omit<ExcelFormatConfig, 'id'> {
  return {
    name: '',
    active: false,
    headerRow: 1,
    dataStartRow: 2,
    detection: null,
    columns: {},
    metadata: null,
  };
}

function ExcelFormatsSection() {
  const [formats, setFormats] = useState<ExcelFormatConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [saving, setSaving] = useState(false);

  // Estado del editor
  const [editorForm, setEditorForm] = useState<Omit<ExcelFormatConfig, 'id'> & { id?: string }>(emptyFormat());
  const [rawHeaders, setRawHeaders] = useState<RawHeadersResult | null>(null);
  const [headersLoading, setHeadersLoading] = useState(false);
  const [headersError, setHeadersError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadFormats();
  }, []);

  const loadFormats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<unknown>('/tenant/excel-formats');
      setFormats(normalizeExcelFormatsList(data));
    } catch {
      setError('No se pudieron cargar los formatos.');
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditorForm(emptyFormat());
    setRawHeaders(null);
    setEditingId('new');
  };

  const openEdit = (fmt: ExcelFormatConfig) => {
    setEditorForm(normalizeExcelFormat(fmt as unknown as Record<string, unknown>));
    setRawHeaders(null);
    setEditingId(fmt.id);
  };

  const closeEditor = () => {
    setEditingId(null);
    setRawHeaders(null);
    setHeadersError('');
  };

  const handleFileUpload = async (file: File) => {
    setHeadersLoading(true);
    setHeadersError('');
    setRawHeaders(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const data = await api.postForm<RawHeadersResult>('/route-import/raw-headers', form);
      setRawHeaders(data);
      // Auto-detectar fila de encabezado: primera fila con >= 3 celdas no-nulas
      const headerRowIdx = data.rows.findIndex(
        (r) => r.filter(Boolean).length >= 3,
      );
      if (headerRowIdx >= 0) {
        setEditorForm((f) => ({
          ...f,
          headerRow: headerRowIdx,
          dataStartRow: headerRowIdx + 1,
        }));
      }
    } catch {
      setHeadersError('No se pudieron leer las cabeceras del archivo.');
    } finally {
      setHeadersLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editorForm.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        ...(editingId !== 'new' ? { id: editingId as string } : {}),
        name: editorForm.name.trim(),
        active: editorForm.active,
        headerRow: editorForm.headerRow,
        dataStartRow: editorForm.dataStartRow,
        detection: editorForm.detection ?? null,
        columns: editorForm.columns ?? {},
        metadata: editorForm.metadata ?? null,
      };
      const updated = await api.put<unknown>('/tenant/excel-formats', body);
      setFormats(normalizeExcelFormatsList(updated));
      closeEditor();
    } catch (err) {
      let msg = 'No se pudo guardar el formato.';
      if (err instanceof ApiError) {
        try {
          const p = JSON.parse(err.body) as { message?: string | string[] };
          if (typeof p.message === 'string') msg = p.message;
          else if (Array.isArray(p.message)) msg = p.message.join(' · ');
        } catch {
          if (err.body) msg = err.body;
        }
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updated = await api.del<unknown>(`/tenant/excel-formats/${id}`);
      setFormats(normalizeExcelFormatsList(updated));
    } catch {
      setError('No se pudo eliminar el formato.');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const updated = await api.post<unknown>(`/tenant/excel-formats/${id}/activate`, {});
      setFormats(normalizeExcelFormatsList(updated));
    } catch {
      setError('No se pudo activar el formato.');
    }
  };

  const headerColsFromFile = rawHeaders ? rawHeaders.rows[editorForm.headerRow] ?? [] : [];
  const headerColsFallbackLen = Math.max(
    headerColsFromFile.length - 1,
    maxMappedColumnIndex(editorForm.columns),
  );
  const headerCols =
    headerColsFromFile.length > 0
      ? headerColsFromFile
      : headerColsFallbackLen >= 0
        ? Array.from({ length: headerColsFallbackLen + 1 }, (_, ci) => `Columna ${colLetter(ci)}`)
        : [];

  const setCol = (field: keyof ExcelColumnMapping, colIdx: number | null) => {
    setEditorForm((f) => ({ ...f, columns: { ...f.columns, [field]: colIdx } }));
  };

  const setMeta = (field: 'routeNumber' | 'date' | 'driver', pos: { row: number; col: number } | null) => {
    setEditorForm((f) => ({
      ...f,
      metadata: { ...(f.metadata ?? {}), [field]: pos },
    }));
  };

  return (
    <Card padding="lg">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
          <FileSpreadsheet size={20} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Formatos de importación Excel
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Define plantillas personalizadas para importar rutas desde Excel. El formato activo se aplica automáticamente al importar.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          icon={<Plus size={14} aria-hidden />}
          onClick={openNew}
          disabled={editingId !== null}
        >
          Nuevo formato
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-3 flex items-center gap-1.5" role="alert">
          <AlertCircle size={14} aria-hidden />
          {error}
        </p>
      )}

      {/* Lista de formatos */}
      {loading ? (
        <p className="text-sm text-stone-400 dark:text-stone-500">Cargando…</p>
      ) : formats.length === 0 && editingId === null ? (
        <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700 py-8 text-center">
          <FileSpreadsheet size={24} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" aria-hidden />
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Sin formatos definidos. Crea uno para personalizar la importación.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {formats.map((fmt) => (
            <div
              key={fmt.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                fmt.active
                  ? 'border-orange-300 bg-orange-50/70 dark:border-orange-700/60 dark:bg-orange-950/25'
                  : 'border-stone-200 dark:border-stone-700 bg-white/60 dark:bg-stone-900/30'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">
                    {fmt.name}
                  </span>
                  {fmt.active && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wide">
                      <Zap size={9} aria-hidden />
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                  Encabezado: fila {fmt.headerRow + 1} · Datos desde fila {fmt.dataStartRow + 1}
                  {' · '}
                  {Object.values(fmt.columns).filter((v) => typeof v === 'number' && v >= 0).length}{' '}
                  columnas mapeadas
                  {fmt.detection ? ` · Detección: "${fmt.detection.value}" en ${colLetter(fmt.detection.col)}${fmt.detection.row + 1}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!fmt.active && (
                  <button
                    type="button"
                    onClick={() => void handleActivate(fmt.id)}
                    className="text-xs px-2 py-1 rounded-md border border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-colors"
                  >
                    Activar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(fmt)}
                  disabled={editingId !== null}
                  className="text-xs px-2 py-1 rounded-md border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(fmt.id)}
                  disabled={fmt.active}
                  className="p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
                  aria-label="Eliminar formato"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      {editingId !== null && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/40 overflow-hidden mt-4">
          {/* Header editor */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              {editingId === 'new' ? 'Nuevo formato' : 'Editar formato'}
            </p>
            <button
              type="button"
              onClick={closeEditor}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Cerrar editor"
            >
              <X size={16} aria-hidden />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* Nombre y activar */}
            <div className="flex flex-wrap gap-3 items-end">
              <Input
                label="Nombre del formato"
                value={editorForm.name}
                onChange={(e) => setEditorForm((f) => ({ ...f, name: e.target.value }))}
                autoComplete="off"
                containerClassName="flex-1 min-w-[200px]"
              />
              <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300 pb-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-stone-300 dark:border-stone-600 text-orange-500 focus:ring-orange-500"
                  checked={editorForm.active}
                  onChange={(e) => setEditorForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Marcar como activo al guardar
              </label>
            </div>

            {/* Upload muestra */}
            <div>
              <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
                1. Cargar Excel de muestra
              </p>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileUpload(file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={headersLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-sm text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
                >
                  <Upload size={14} aria-hidden />
                  {headersLoading ? 'Cargando…' : rawHeaders ? 'Cambiar archivo' : 'Subir Excel'}
                </button>
                {rawHeaders && (
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {rawHeaders.sheetName} · {rawHeaders.rows.length} filas detectadas
                  </span>
                )}
                {headersError && (
                  <span className="text-xs text-red-600 dark:text-red-400">{headersError}</span>
                )}
              </div>
            </div>

            {/* Preview de filas */}
            {rawHeaders && (
              <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-700">
                <table className="text-[11px] min-w-full">
                  <thead>
                    <tr className="bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700">
                      <th className="px-2 py-2 font-bold text-stone-500 dark:text-stone-400 text-left w-8">Fila</th>
                      {rawHeaders.rows[0]?.map((_, ci) => {
                        // Buscar si esta columna está mapeada a algún campo
                        const mappedField = (Object.entries(editorForm.columns) as [keyof ExcelColumnMapping, number | null | undefined][])
                          .find(([, v]) => v === ci)?.[0];
                        const fieldInfo = mappedField
                          ? SYSTEM_FIELDS.find((f) => f.key === mappedField)
                          : null;
                        return (
                          <th key={ci} className="px-2 py-1.5 text-left whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-stone-600 dark:text-stone-300">{colLetter(ci)}</span>
                              {fieldInfo ? (
                                <span className="inline-block px-1 py-px rounded text-[9px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 leading-tight truncate max-w-[80px]">
                                  {fieldInfo.label}
                                </span>
                              ) : null}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {rawHeaders.rows.slice(0, 10).map((row, ri) => {
                      const isHeader = ri === editorForm.headerRow;
                      const isData = ri === editorForm.dataStartRow;
                      return (
                        <tr
                          key={ri}
                          className={
                            isHeader
                              ? 'bg-orange-100 dark:bg-orange-900/40 font-semibold border-l-2 border-orange-400 dark:border-orange-500'
                              : isData
                              ? 'bg-sky-100/70 dark:bg-sky-900/30 border-l-2 border-sky-400 dark:border-sky-500'
                              : ''
                          }
                        >
                          <td className="px-2 py-1 tabular-nums font-medium text-stone-500 dark:text-stone-400">{ri + 1}</td>
                          {row.map((cell, ci) => {
                            const mappedField = (Object.entries(editorForm.columns) as [keyof ExcelColumnMapping, number | null | undefined][])
                              .find(([, v]) => v === ci)?.[0];
                            return (
                              <td
                                key={ci}
                                className={`px-2 py-1 truncate max-w-[140px] ${
                                  mappedField
                                    ? 'text-violet-700 dark:text-violet-300 font-medium'
                                    : 'text-stone-700 dark:text-stone-300'
                                }`}
                              >
                                {cell ?? <span className="text-stone-300 dark:text-stone-600">—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="flex items-center gap-4 px-3 py-1.5 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                  <span className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400 dark:bg-orange-500" />
                    Encabezado
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-sky-400 dark:bg-sky-500" />
                    Primera fila datos
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-violet-400 dark:bg-violet-500" />
                    Columna mapeada
                  </span>
                </div>
              </div>
            )}

            {/* Filas de inicio */}
            <div>
              <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-3">
                2. Posición de datos
              </p>
              <div className="flex flex-wrap gap-4 items-stretch">
                {/* Encabezado */}
                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 rounded-xl px-3 py-2 min-w-[180px]">
                  <span className="shrink-0 w-2 self-stretch rounded-full bg-orange-400 dark:bg-orange-500" />
                  <Input
                    label="Fila encabezado"
                    type="number"
                    value={String(editorForm.headerRow + 1)}
                    onChange={(e) => {
                      const v = Math.max(1, parseInt(e.target.value) || 1);
                      setEditorForm((f) => ({ ...f, headerRow: v - 1, dataStartRow: Math.max(v, f.dataStartRow) }));
                    }}
                    autoComplete="off"
                    containerClassName="flex-1"
                  />
                </div>
                {/* Primera fila de datos */}
                <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-xl px-3 py-2 min-w-[180px]">
                  <span className="shrink-0 w-2 self-stretch rounded-full bg-sky-400 dark:bg-sky-500" />
                  <Input
                    label="Primera fila de datos"
                    type="number"
                    value={String(editorForm.dataStartRow + 1)}
                    onChange={(e) => {
                      const v = Math.max(1, parseInt(e.target.value) || 1);
                      setEditorForm((f) => ({ ...f, dataStartRow: v - 1 }));
                    }}
                    autoComplete="off"
                    containerClassName="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Mapeo de columnas */}
            <div>
              <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
                3. Mapeo de columnas
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SYSTEM_FIELDS.map(({ key, label, hint }) => {
                  const currentCol = editorForm.columns[key] ?? null;
                  const colOptions = headerCols.map((cell, ci) => ({
                    value: String(ci),
                    label: `${colLetter(ci)} — ${cell ?? '(vacía)'}`,
                  }));
                  return (
                    <div key={key} className="space-y-1">
                      <Select
                        label={label}
                        value={currentCol != null ? String(currentCol) : ''}
                        onChange={(e) => setCol(key, e.target.value !== '' ? parseInt(e.target.value) : null)}
                        options={[
                          { value: '', label: '— No mapear —' },
                          ...colOptions,
                        ]}
                        autoComplete="off"
                      />
                      {currentCol == null && (
                        <p className="text-[10px] text-stone-400 pl-1">{hint}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {headerCols.length === 0 && (
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                  Sube un Excel de muestra para ver las columnas disponibles.
                </p>
              )}
            </div>

            {/* Metadatos */}
            <div>
              <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
                4. Celdas de metadatos <span className="normal-case font-normal text-stone-400">(opcional)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { field: 'routeNumber' as const, label: 'N° de ruta' },
                    { field: 'date' as const, label: 'Fecha' },
                    { field: 'driver' as const, label: 'Chofer' },
                  ] as const
                ).map(({ field, label }) => {
                  const pos = editorForm.metadata?.[field] ?? null;
                  return (
                    <div key={field} className="space-y-1.5 p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-white/60 dark:bg-stone-900/40">
                      <p className="text-xs font-medium text-stone-700 dark:text-stone-300">{label}</p>
                      <div className="flex gap-2">
                        <Input
                          label="Fila"
                          type="number"
                          value={pos ? String(pos.row + 1) : ''}
                          onChange={(e) => {
                            const row = parseInt(e.target.value);
                            if (!isNaN(row) && row >= 1) {
                              setMeta(field, { row: row - 1, col: pos?.col ?? 0 });
                            } else if (e.target.value === '') {
                              setMeta(field, null);
                            }
                          }}
                          autoComplete="off"
                          containerClassName="flex-1"
                        />
                        <Input
                          label="Col"
                          placeholder="A"
                          value={pos ? colLetter(pos.col) : ''}
                          onChange={(e) => {
                            const letter = e.target.value.trim().toUpperCase();
                            const ci = LETTERS.indexOf(letter);
                            if (ci >= 0) {
                              setMeta(field, { row: pos?.row ?? 0, col: ci });
                            } else if (letter === '') {
                              setMeta(field, null);
                            }
                          }}
                          autoComplete="off"
                          containerClassName="w-16"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Regla de detección */}
            <div>
              <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
                5. Regla de detección automática <span className="normal-case font-normal text-stone-400">(opcional)</span>
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">
                Si se define, Rutek identificará este formato cuando la celda indicada contenga el valor exacto. Si no, se usará el formato activo siempre.
              </p>
              <div className="flex flex-wrap gap-3 items-end">
                <Input
                  label="Fila"
                  type="number"
                  value={editorForm.detection ? String(editorForm.detection.row + 1) : ''}
                  onChange={(e) => {
                    const row = parseInt(e.target.value);
                    if (!isNaN(row) && row >= 1) {
                      setEditorForm((f) => ({
                        ...f,
                        detection: { row: row - 1, col: f.detection?.col ?? 0, value: f.detection?.value ?? '' },
                      }));
                    } else if (e.target.value === '') {
                      setEditorForm((f) => ({ ...f, detection: null }));
                    }
                  }}
                  autoComplete="off"
                  containerClassName="w-20"
                />
                <Input
                  label="Col"
                  placeholder="A"
                  value={editorForm.detection ? colLetter(editorForm.detection.col) : ''}
                  onChange={(e) => {
                    const letter = e.target.value.trim().toUpperCase();
                    const ci = LETTERS.indexOf(letter);
                    if (ci >= 0) {
                      setEditorForm((f) => ({
                        ...f,
                        detection: { row: f.detection?.row ?? 0, col: ci, value: f.detection?.value ?? '' },
                      }));
                    } else if (letter === '') {
                      setEditorForm((f) => ({ ...f, detection: null }));
                    }
                  }}
                  autoComplete="off"
                  containerClassName="w-16"
                />
                <Input
                  label="Valor esperado"
                  placeholder="Ej. TIENDA"
                  value={editorForm.detection?.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditorForm((f) => ({
                      ...f,
                      detection: f.detection
                        ? { ...f.detection, value }
                        : { row: 0, col: 0, value },
                    }));
                  }}
                  autoComplete="off"
                  containerClassName="flex-1 min-w-[160px]"
                />
              </div>
            </div>

            {/* Footer acciones */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onClick={closeEditor}
                className="text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                Cancelar
              </button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                loading={saving}
                disabled={!editorForm.name.trim()}
              >
                Guardar formato
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
