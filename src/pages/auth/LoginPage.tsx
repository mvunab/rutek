import { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';

const PITCH_HIGHLIGHTS = [
  'Pedidos y rutas en una sola vista',
  'Seguimiento de entregas en tiempo real',
  'Coordinación simple de choferes y flota',
] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, restoreSession, loading, sessionChecked } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!sessionChecked || !isAuthenticated) return;
    navigate(useAuthStore.getState().isSuperAdmin ? '/super-admin' : '/dashboard', {
      replace: true,
    });
  }, [sessionChecked, isAuthenticated, navigate]);

  if (!sessionChecked || loading) {
    return (
      <div
        className="min-h-screen min-h-dvh flex items-center justify-center bg-white"
        role="status"
        aria-live="polite"
      >
        <span className="text-sm text-stone-500">Verificando sesión…</span>
      </div>
    );
  }

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
    <div className="min-h-screen min-h-dvh bg-white flex">
      {/* Panel visual — solo escritorio */}
      <aside
        className="hidden lg:flex relative flex-1 max-w-[min(52%,560px)] min-w-[380px] flex-col overflow-hidden"
        aria-label="Presentación de Rutek"
      >
        <img
          src="/login-hero.png"
          alt=""
          className="absolute inset-0 size-full object-cover object-[center_55%]"
          fetchPriority="high"
          decoding="async"
        />
        {/* Tono oscuro arriba: legibilidad del pitch */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-transparent from-22% via-primary-900/95 via-48% to-primary-950 to-100%"
          aria-hidden
        />
        {/* Tono claro abajo: velo azul extendido hacia el centro */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-primary-500/46 from-0% via-primary-600/22 via-20% to-transparent to-72%"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col flex-1 min-h-full">
          <header className="p-10 pb-0">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-primary-950/40 backdrop-blur-sm border border-white/15 px-3 py-1.5 shadow-lg">
              <div
                className="size-7 rounded-md flex items-center justify-center flex-shrink-0 bg-primary-700"
                aria-hidden
              >
                <Map size={14} className="text-white" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold tracking-tight text-white">Rutek</span>
            </div>
          </header>

          <div className="px-10 pt-8 pb-6 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-200/90 mb-3">
              Logística en movimiento
            </p>
            <h1 className="text-[2rem] xl:text-[2.35rem] font-bold leading-[1.12] tracking-tight text-balance text-white">
              Tu operación, con rumbo claro
            </h1>
            <p className="mt-3 text-base xl:text-lg leading-relaxed text-white/80 max-w-md text-pretty">
              Coordina pedidos, rutas y entregas sin perder visibilidad del día a día.
              Menos fricción en oficina, más control en terreno.
            </p>

            <ul className="mt-7 space-y-2.5 border-t border-white/15 pt-6" role="list">
              {PITCH_HIGHLIGHTS.map((text) => (
                <li key={text} className="flex items-center gap-2.5 text-sm text-white/90">
                  <span
                    className="size-1.5 rounded-full bg-primary-300 shrink-0"
                    aria-hidden
                  />
                  {text}
                </li>
              ))}
            </ul>

          </div>

          <div className="flex-1 min-h-[32%]" aria-hidden />

          <p className="px-10 pb-8 text-[11px] text-primary-950/55">
            Rutek © {new Date().getFullYear()}
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white border-l border-stone-100">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="size-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-700 shadow-sm">
              <Map size={18} className="text-white" strokeWidth={2} aria-hidden />
            </div>
            <p className="text-lg font-semibold text-stone-900">Rutek</p>
          </div>

          <h2 className="text-2xl font-semibold text-stone-900 mb-1">
            Iniciar sesión
          </h2>
          <p className="text-sm text-stone-500 mb-8">
            Ingresa con tu cuenta para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label htmlFor={emailId} className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                id={emailId}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent shadow-sm"
                placeholder="tu@correo.cl"
                required
              />
            </div>
            <div>
              <label htmlFor={passwordId} className="block text-sm font-medium text-stone-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2.5 pr-10 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                >
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-xs text-red-700">{error}</p>
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
