import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsApi } from '../lib/api/endpoints';
import { Card, EmptyState, Spinner } from '../components/ui';

const OUTCOME_COLORS: Record<string, string> = {
  completed: '#22c55e',
  transferred: '#3b82f6',
  no_answer: '#f59e0b',
  failed: '#ef4444',
};

export function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: analyticsApi.dashboard });
  if (isLoading || !data) return <Spinner />;

  const hasData = data.kpis.totalCalls > 0;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Analytics &amp; Reports</h1>
      <p className="mb-6 text-sm text-slate-500">Call performance across your AI employees</p>

      {!hasData ? (
        <EmptyState title="No call data yet" hint="Simulate an inbound call or launch a campaign." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 font-semibold text-slate-800">Minutes by Day</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byDay}>
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-slate-800">Call Outcomes</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.outcomes} dataKey="count" nameKey="outcome" outerRadius={90} label>
                  {data.outcomes.map((o) => (
                    <Cell key={o.outcome} fill={OUTCOME_COLORS[o.outcome] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="mb-4 font-semibold text-slate-800">By Employee</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-400">
                  <tr>
                    <th className="py-2">Employee</th>
                    <th>Calls</th>
                    <th>Minutes</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byEmployee.map((e) => (
                    <tr key={e.aiEmployeeId} className="border-t border-slate-100">
                      <td className="py-2 font-medium text-slate-700">{e.name}</td>
                      <td>{e.calls}</td>
                      <td>{e.minutes}</td>
                      <td>${e.usd.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
