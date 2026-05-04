import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Eye, EyeOff, LogIn, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';

const demoAccounts = [
  { email: 'admin@translogistica.cl', label: 'Administrador', description: 'Acceso completo al sistema', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
  { email: 'operadora@translogistica.cl', label: 'Operador Logístico', description: 'Pedidos y rutas', color: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100' },
  { email: 'rsoto@translogistica.cl', label: 'Repartidor', description: 'Rutas y pedidos asignados', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
  { email: 'pvargas@empresa.cl', label: 'Cliente', description: 'Consulta de pedidos', color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('admin@translogistica.cl');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate('/dashboard');
    else setError('Email no encontrado. Usa una cuenta demo.');
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    await login(demoEmail, 'demo1234');
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 p-10">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100">Rutek</p>
              <p className="text-xs text-stone-400 dark:text-stone-500">Logistics SaaS</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 leading-tight mb-4">
            Gestión de transporte de carga
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
            Plataforma multi-tenant para planificar rutas, gestionar pedidos y monitorear
            operaciones logísticas en tiempo real.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: '📦', text: 'Gestión completa de pedidos y clientes' },
              { icon: '🗺️', text: 'Planificación y monitoreo de rutas' },
              { icon: '👥', text: 'Roles diferenciados por actor' },
              { icon: '🏢', text: 'Arquitectura multi-tenant SaaS' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
                <span className="text-base">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>

          {/* Decorative */}
          <div className="mt-10 p-4 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">Sistema operativo</span>
            </div>
            <div className="space-y-2">
              {['23 pedidos en tránsito', '2 rutas activas hoy', '94.2% efectividad'].map((stat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-300" />
                  {stat}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-stone-400 dark:text-stone-500">
          Rutek © 2024 · Plataforma de demostración
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <Truck size={18} className="text-white" />
            </div>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-100">Rutek</p>
          </div>

          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">Accede a tu plataforma de logística</p>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                placeholder="usuario@empresa.cl"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2.5 pr-10 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} icon={<LogIn size={16} />} size="lg">
              Ingresar
            </Button>
          </form>

          {/* Demo accounts */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
              <p className="text-xs text-stone-400 dark:text-stone-500 font-medium">Cuentas demo</p>
              <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account.email)}
                  disabled={loading}
                  className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm ${account.color}`}
                >
                  <p className="text-xs font-semibold mb-0.5">{account.label}</p>
                  <p className="text-[10px] opacity-70">{account.description}</p>
                  <ChevronRight size={12} className="mt-1.5 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
