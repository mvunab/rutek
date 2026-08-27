import { use } from 'react';
import { DASHBOARD_SERIES_COLORS } from '../../lib/statusColors';

type ChartPoint = { label: string; value: number; value2?: number };

const rechartsPromise = import('recharts');

export function DashboardOrdersChartInner({
  data,
  ordersChartWeekEmpty,
  ordersCount,
}: {
  data: ChartPoint[];
  ordersChartWeekEmpty: boolean;
  ordersCount: number;
}) {
  const {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
  } = use(rechartsPromise);

  return (
    <>
      {ordersChartWeekEmpty ? (
        <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">
          Sin pedidos creados ni entregados en los últimos 7 días; hay {ordersCount} pedido
          {ordersCount === 1 ? '' : 's'} en el sistema.
        </p>
      ) : null}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={DASHBOARD_SERIES_COLORS.created} stopOpacity={0.15} />
              <stop offset="95%" stopColor={DASHBOARD_SERIES_COLORS.created} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={DASHBOARD_SERIES_COLORS.delivered} stopOpacity={0.15} />
              <stop offset="95%" stopColor={DASHBOARD_SERIES_COLORS.delivered} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f0ec" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#a8a29e', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis tick={{ fill: '#a8a29e', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            labelStyle={{ color: '#57534e' }}
            itemStyle={{ color: '#292524' }}
          />
          <Area type="monotone" dataKey="value" name="Creados" stroke={DASHBOARD_SERIES_COLORS.created} strokeWidth={2} fill="url(#colorCreated)" dot={false} />
          <Area type="monotone" dataKey="value2" name="Entregados" stroke={DASHBOARD_SERIES_COLORS.delivered} strokeWidth={2} fill="url(#colorDelivered)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}
