import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { ValuationSummaryCard } from './ValuationSummaryCard';

type Summary = {
  orderCount: number;
  clientCharge: number;
  driverPay: number;
  peonetaPay: number;
  margin: number;
};

export function ValuationSummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <ValuationSummaryCard
        label="Cobro a cliente"
        amount={summary.clientCharge}
        icon={<Wallet size={18} />}
        tone="client"
        hint={`${summary.orderCount} pedido${summary.orderCount !== 1 ? 's' : ''} en vista`}
      />
      <ValuationSummaryCard
        label="Pago choferes"
        amount={summary.driverPay}
        icon={<TrendingDown size={18} />}
        tone="worker"
      />
      <ValuationSummaryCard
        label="Pago peonetas"
        amount={summary.peonetaPay}
        icon={<TrendingDown size={18} />}
        tone="worker"
      />
      <ValuationSummaryCard
        label="Margen"
        amount={summary.margin}
        icon={<TrendingUp size={18} />}
        tone={summary.margin >= 0 ? 'margin' : 'negative'}
        hint={summary.margin >= 0 ? 'Positivo' : 'Negativo'}
      />
    </div>
  );
}
