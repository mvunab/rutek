import { Clock, Map, TrendingUp, Users } from 'lucide-react';

export function DashboardSecondaryStats({
  activeRoutes,
  totalClients,
  deliveryRate,
  avgDeliveryTime,
}: {
  activeRoutes: number;
  totalClients: number;
  deliveryRate: number;
  avgDeliveryTime: number;
}) {
  const items = [
    { label: 'Rutas activas', value: activeRoutes, icon: <Map size={16} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Cuentas', value: totalClients, icon: <Users size={16} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Efectividad', value: `${deliveryRate}%`, icon: <TrendingUp size={16} />, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
    { label: 'Tiempo prom.', value: avgDeliveryTime > 0 ? `${avgDeliveryTime} d` : '—', icon: <Clock size={16} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className={`p-2 rounded-lg ${item.bg} dark:opacity-90 ${item.color}`}>{item.icon}</div>
          <div>
            <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{item.value}</p>
            <p className="text-xs text-stone-400 dark:text-stone-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
