import { use } from 'react';
import { orderStatusColors } from '../../lib/statusColors';

type StatusPoint = { label: string; value: number; key?: string; fill?: string };

const rechartsPromise = import('recharts');

export function DashboardStatusPieChartInner({ data }: { data: StatusPoint[] }) {
  const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = use(rechartsPromise);

  return (
    <>
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            dataKey="value"
            paddingAngle={3}
          >
            {data.map((entry) => {
              const fill =
                entry.fill ??
                (entry.key ? orderStatusColors(entry.key).fill : orderStatusColors('').fill);
              return <Cell key={entry.key ?? entry.label} fill={fill} />;
            })}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: '8px', fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 mt-2">
        {data.map((item) => {
          const fill =
            item.fill ??
            (item.key ? orderStatusColors(item.key).fill : orderStatusColors('').fill);
          return (
            <div key={item.key ?? item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: fill }}
                />
                <span className="text-xs text-stone-500 dark:text-stone-400">{item.label}</span>
              </div>
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 tabular-nums">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
