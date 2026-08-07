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
import { BarChart3 } from 'lucide-react';
import { Card, EmptyState, PageHeader, Spinner } from '../components/ui';

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
      <PageHeader title="Analytics & Reports" description="Call performance across your AI employees" />

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No call data yet"
          hint="Charts light up as soon as your AI employees start taking or making calls."
        />
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
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-3">Employee</th>
                    <th className="pb-3">Calls</th>
                    <th className="pb-3">Minutes</th>
                    <th className="pb-3">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.byEmployee.map((e) => (
                    <tr key={e.aiEmployeeId} className="transition-colors hover:bg-slate-50/70">
                      <td className="py-3 font-medium text-slate-800">{e.name}</td>
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
