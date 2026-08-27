import { Moon, Sun, Monitor } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useUiStore } from '../../store/useUiStore';

export function ThemeSettingsCard() {
  const { theme, setTheme } = useUiStore();

  return (
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
  );
}
