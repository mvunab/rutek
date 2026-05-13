import { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';

const FEATURES = [
  { id: 'orders', icon: '📦', text: 'Gestión completa de pedidos y clientes' },
  { id: 'routes', icon: '🗺️', text: 'Planificación y monitoreo de rutas' },
  { id: 'roles', icon: '👥', text: 'Roles diferenciados por actor' },
  { id: 'tenant', icon: '🏢', text: 'Arquitectura multi-tenant SaaS' },
] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, restoreSession, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await restoreSession();
      if (cancelled) return;
      const state = useAuthStore.getState();
      if (state.isAuthenticated) {
        navigate(state.isSuperAdmin ? '/super-admin' : '/dashboard', { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, restoreSession]);

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = await login(email, password);
    if (!ok) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      return;
    }
    const { isSuperAdmin } = useAuthStore.getState();
    navigate(isSuperAdmin ? '/super-admin' : '/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 p-10">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="size-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">Rutek</p>
              <p className="text-xs text-stone-400 dark:text-stone-500">Logistics SaaS</p>
            </div>
          </div>

          <h1 className="text-3xl font-semibold text-stone-900 dark:text-stone-100 leading-tight mb-4 text-balance">
            Gestión de transporte de carga
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
            Plataforma multi-tenant para planificar rutas, gestionar pedidos y monitorear
            operaciones logísticas en tiempo real.
          </p>

          <div className="mt-8 space-y-3">
            {FEATURES.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
                <span className="text-base" aria-hidden="true">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>

        </div>

        <div className="text-xs text-stone-400 dark:text-stone-500">
          Rutek © 2024 · Plataforma de logística
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="size-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <Truck size={18} className="text-white" />
            </div>
            <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">Rutek</p>
          </div>

          <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">Accede a tu plataforma de logística</p>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label htmlFor={emailId} className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Email</label>
              <input
                id={emailId}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent shadow-sm"
                placeholder="usuario@empresa.cl"
                required
              />
            </div>
            <div>
              <label htmlFor={passwordId} className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2.5 pr-10 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                >
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg"
              >
                <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} icon={<LogIn size={16} />} size="lg">
              Ingresar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
