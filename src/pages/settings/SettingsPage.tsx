import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import type { Tenant } from '../../types';
import type { DbTenant } from '../../types/api';
import { api } from '../../lib/api';
import { authService } from '../../services/auth.service';
import { CompanySettingsCard } from './CompanySettingsCard';
import { ExcelFormatsSection } from './excelFormats/ExcelFormatsSection';
import { MobileAppDownloadCard } from './MobileAppDownloadCard';
import { NavTourSettingsCard } from './NavTourSettingsCard';
import { OrderStatusesCard } from './OrderStatusesCard';
import { PasswordSettingsCard } from './PasswordSettingsCard';
import { ThemeSettingsCard } from './ThemeSettingsCard';
import { emptyForm, isTenantAdmin, tenantToForm, type CompanyForm } from './settingsShared';

export function SettingsPage() {
  const { tenant, user, updateTenant, changeMyPassword, loading: authLoading } = useAuthStore();
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [hydrating, setHydrating] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savedCompany, setSavedCompany] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savedPw, setSavedPw] = useState(false);
  const [pwError, setPwError] = useState('');
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
    let cancelled = false;
    const cachedTenant = useAuthStore.getState().tenant;
    if (cachedTenant) {
      setForm(tenantToForm(cachedTenant));
      setExtraOrderStatuses(
        (cachedTenant.customOrderStatuses ?? []).map((r) => ({ slug: r.slug, label: r.label })),
      );
      setHydrating(false);
    }
    void (async () => {
      setHydrating(true);
      setLoadError('');
      try {
        const fresh = await authService.getTenant();
        if (cancelled) return;
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
        if (cancelled) return;
        if (!useAuthStore.getState().tenant) {
          setLoadError('No se pudo cargar la configuración. Intenta de nuevo.');
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, updateTenant]);

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
      const cleaned: { slug: string; label: string }[] = [];
      for (const r of extraOrderStatuses) {
        const slug = r.slug.trim().toLowerCase();
        const label = r.label.trim();
        if (slug.length > 0 && label.length > 0) cleaned.push({ slug, label });
      }
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
        <MobileAppDownloadCard />
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

      <ThemeSettingsCard />
      <NavTourSettingsCard />
      <MobileAppDownloadCard />

      {canEditTenant && (
        <OrderStatusesCard
          statuses={extraOrderStatuses}
          onChange={setExtraOrderStatuses}
          error={orderStatusErr}
          saving={savingOrderStatuses}
          saved={savedOrderStatuses}
          onSave={() => void handleSaveOrderStatuses()}
        />
      )}

      <CompanySettingsCard
        form={form}
        canEdit={canEditTenant}
        saving={savingCompany}
        saved={savedCompany}
        error={companyError}
        onChange={set}
        onSubmit={(e) => void handleCompanySubmit(e)}
      />

      <PasswordSettingsCard
        form={pwForm}
        onChange={setPwForm}
        error={pwError}
        saved={savedPw}
        authLoading={authLoading}
        onSubmit={handlePasswordSubmit}
      />

      {canEditTenant && <ExcelFormatsSection />}
    </div>
  );
}
