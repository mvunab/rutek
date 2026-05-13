import { useEffect, useState } from 'react';
import { Building2, Moon, Sun, Monitor, Check, Key, Eye, EyeOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import type { Tenant } from '../../types';

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

export function SettingsPage() {
  const { tenant, updateTenant, changeMyPassword, loading } = useAuthStore();
  const { theme, setTheme } = useUiStore();
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [savedCompany, setSavedCompany] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savedPw, setSavedPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setForm({
      name: tenant.name,
      legalName: tenant.legalName ?? '',
      rut: tenant.rut,
      email: tenant.email ?? '',
      phone: tenant.phone ?? '',
      address: tenant.address ?? '',
      city: tenant.city ?? '',
      region: tenant.region ?? '',
      plan: tenant.plan,
    });
  }, [tenant]);

  const set = <K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    updateTenant({
      name: form.name.trim(),
      legalName: form.legalName.trim() || undefined,
      rut: form.rut.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      region: form.region.trim() || undefined,
      plan: form.plan,
    });
    setSavedCompany(true);
    window.setTimeout(() => setSavedCompany(false), 2500);
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

  if (!tenant) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400">
        No hay empresa asociada a la sesión.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
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
              Datos de tu organización visibles en la plataforma (demo en memoria).
            </p>
          </div>
        </div>

        <form onSubmit={handleCompanySubmit} className="space-y-4">
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

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit">Guardar cambios</Button>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Cambiando...' : 'Cambiar contraseña'}
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
    </div>
  );
}
