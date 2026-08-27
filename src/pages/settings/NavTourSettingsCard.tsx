import { Map } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavTourStore } from '../../store/useNavTourStore';

export function NavTourSettingsCard() {
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
