import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../lib/api/endpoints';
import { Card, Spinner } from '../components/ui';
import { formatUsd } from '../lib/utils';

export function BillingPage() {
  const { data: usage, isLoading } = useQuery({ queryKey: ['usage'], queryFn: billingApi.usage });
  const { data: estimate } = useQuery({ queryKey: ['estimate'], queryFn: billingApi.estimate });

  if (isLoading || !usage) return <Spinner />;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Billing</h1>
      <p className="mb-6 text-sm text-slate-500">
        Usage-based billing at {formatUsd(usage.rateUsd)} per conversation minute
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total Minutes</p>
          <p className="text-3xl font-bold text-slate-800">{usage.totalMinutes}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Cost</p>
          <p className="text-3xl font-bold text-slate-800">{formatUsd(usage.totalUsd)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Projected Monthly</p>
          <p className="text-3xl font-bold text-slate-800">
            {formatUsd(estimate?.projectedMonthlyUsd ?? 0)}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-slate-800">Usage by Day</h2>
        {usage.byDay.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No usage recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="py-2">Date</th>
                  <th>Calls</th>
                  <th>Minutes</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {usage.byDay.map((d) => (
                  <tr key={d.date} className="border-t border-slate-100">
                    <td className="py-2">{d.date}</td>
                    <td>{d.calls}</td>
                    <td>{d.minutes}</td>
                    <td>{formatUsd(d.usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
