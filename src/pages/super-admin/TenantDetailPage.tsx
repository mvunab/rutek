import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';
import { Button } from '../../components/ui/Button';
import { CreateAdminModal } from './CreateAdminModal';
import { EditUserModal } from './EditUserModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { TenantDetailHeader } from './TenantDetailHeader';
import { TenantDetailStats } from './TenantDetailStats';
import { TenantFeatureFlagsSection } from './TenantFeatureFlagsSection';
import { TenantUsersTable } from './TenantUsersTable';
import {
  generatePassword,
  getApiMessage,
  type EditForm,
  type TenantUser,
} from './tenantDetailUtils';

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedTenant, loading, fetchTenantDetail, createTenantAdmin, updateUser, deleteUser, resetUserPassword, updateTenantFeatures } = useSuperAdminStore();
  const [featuresSaving, setFeaturesSaving] = useState(false);
  const [featuresError, setFeaturesError] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', phone: '', role: 'admin' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [resetModalUserId, setResetModalUserId] = useState<string | null>(null);
  const [resetModalUserName, setResetModalUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<TenantUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', email: '', role: '', phone: '' });
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchTenantDetail(id);
  }, [id, fetchTenantDetail]);

  const openCreateAdmin = () => {
    setAdminForm({ name: '', email: '', password: '', phone: '', role: 'admin' });
    setCreateError(null);
    setShowAdminModal(true);
  };

  const closeCreateAdmin = () => {
    setShowAdminModal(false);
    setCreateError(null);
  };

  const handleCreateAdmin = async () => {
    if (!id) return;
    const name = adminForm.name.trim();
    const email = adminForm.email.trim().toLowerCase();
    const password = adminForm.password;
    const phone = adminForm.phone.trim();
    const role = adminForm.role as 'admin' | 'operator';

    if (!name || !email || !password) {
      setCreateError('Nombre, email y contraseña son obligatorios.');
      return;
    }
    if (password.length < 6) {
      setCreateError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setCreateError(null);
      await createTenantAdmin(id, {
        name,
        email,
        password,
        role,
        ...(phone ? { phone } : {}),
      });
      setShowAdminModal(false);
      setAdminForm({ name: '', email: '', password: '', phone: '', role: 'admin' });
    } catch (err) {
      setCreateError(getApiMessage(err, 'No se pudo crear el usuario.'));
    }
  };

  const openResetPassword = (userId: string, userName: string) => {
    setResetModalUserId(userId);
    setResetModalUserName(userName);
    setNewPassword(generatePassword());
    setResetError(null);
  };

  const handleResetPassword = async () => {
    if (!resetModalUserId || !newPassword) return;
    if (newPassword.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      setResetError(null);
      await resetUserPassword(resetModalUserId, newPassword);
      setResetModalUserId(null);
      setResetModalUserName('');
      setNewPassword('');
    } catch (err) {
      setResetError(getApiMessage(err, 'No se pudo resetear la contraseña.'));
    }
  };

  const openEdit = (user: TenantUser) => {
    setEditTarget(user);
    setEditForm({
      name: user.name ?? '',
      email: user.email ?? '',
      role: user.role ?? 'admin',
      phone: user.phone ?? '',
    });
    setEditError(null);
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditError('Nombre y email son obligatorios');
      return;
    }
    const patch: { name?: string; email?: string; role?: string; phone?: string } = {};
    if (editForm.name.trim() !== editTarget.name) patch.name = editForm.name.trim();
    if (editForm.email.trim() !== editTarget.email) patch.email = editForm.email.trim().toLowerCase();
    if (editForm.role !== editTarget.role) patch.role = editForm.role;
    const phoneTrim = editForm.phone.trim();
    if (phoneTrim !== (editTarget.phone ?? '')) patch.phone = phoneTrim;

    if (Object.keys(patch).length === 0) {
      closeEdit();
      return;
    }
    try {
      await updateUser(editTarget.id, patch);
      if (id) await fetchTenantDetail(id);
      closeEdit();
    } catch (err) {
      setEditError(getApiMessage(err, 'No se pudo actualizar el usuario.'));
    }
  };

  if (!selectedTenant && !loading) {
    return <div className="p-6">Tenant no encontrado</div>;
  }

  const stats = (selectedTenant as any)?.stats;
  const featureFlags: Record<string, unknown> = (selectedTenant as any)?.feature_flags ?? {};
  const excelEnabled = featureFlags['excel_import_enabled'] !== false;
  const valuationEnabled = featureFlags['valuation_module_enabled'] === true;
  const ordersMapEnabled = featureFlags['orders_map_module_enabled'] === true;
  const excelConfig = (featureFlags['excel_import_config'] as Record<string, number> | undefined) ?? {};

  const handleToggleFeature = async (flag: string, value: boolean) => {
    if (!id) return;
    setFeaturesSaving(true);
    setFeaturesError(null);
    try {
      await updateTenantFeatures(id, { [flag]: value });
    } catch (err) {
      setFeaturesError(getApiMessage(err, 'No se pudo actualizar la configuración.'));
    } finally {
      setFeaturesSaving(false);
    }
  };

  const handleExcelConfigChange = async (patch: Record<string, number>) => {
    if (!id) return;
    setFeaturesSaving(true);
    setFeaturesError(null);
    try {
      await updateTenantFeatures(id, { excel_import_config: { ...excelConfig, ...patch } });
    } catch (err) {
      setFeaturesError(getApiMessage(err, 'No se pudo actualizar la configuración.'));
    } finally {
      setFeaturesSaving(false);
    }
  };

  const tenantUsers: TenantUser[] = (selectedTenant?.users ?? []).map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    active: user.active,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin')} icon={<ArrowLeft size={16} />}>
          Volver
        </Button>
      </div>

      {selectedTenant && (
        <>
          <TenantDetailHeader tenant={selectedTenant} />
          {stats && <TenantDetailStats stats={stats} />}
          <TenantFeatureFlagsSection
            excelEnabled={excelEnabled}
            valuationEnabled={valuationEnabled}
            ordersMapEnabled={ordersMapEnabled}
            excelConfig={excelConfig}
            featuresSaving={featuresSaving}
            featuresError={featuresError}
            onToggleFeature={(flag, value) => void handleToggleFeature(flag, value)}
            onExcelConfigChange={(patch) => void handleExcelConfigChange(patch)}
          />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Usuarios del Tenant</h2>
            <Button variant="primary" onClick={openCreateAdmin} icon={<Plus size={16} />}>
              Agregar Usuario
            </Button>
          </div>
          <TenantUsersTable
            users={tenantUsers}
            onEdit={openEdit}
            onResetPassword={openResetPassword}
            onDelete={(userId, userName) => {
              if (window.confirm(`¿Eliminar a ${userName}? Esta acción no se puede deshacer.`)) {
                deleteUser(userId);
              }
            }}
            onToggleActive={(userId, active) => updateUser(userId, { active })}
          />
        </>
      )}

      {showAdminModal && (
        <CreateAdminModal
          form={adminForm}
          loading={loading}
          createError={createError}
          onClose={closeCreateAdmin}
          onChange={setAdminForm}
          onSubmit={handleCreateAdmin}
        />
      )}

      {resetModalUserId && (
        <ResetPasswordModal
          userName={resetModalUserName}
          newPassword={newPassword}
          loading={loading}
          resetError={resetError}
          onClose={() => setResetModalUserId(null)}
          onPasswordChange={setNewPassword}
          onGenerate={() => setNewPassword(generatePassword())}
          onSubmit={handleResetPassword}
        />
      )}

      {editTarget && (
        <EditUserModal
          form={editForm}
          loading={loading}
          editError={editError}
          onClose={closeEdit}
          onChange={setEditForm}
          onSubmit={handleSaveEdit}
        />
      )}
    </div>
  );
}
