import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Phone, Clock, DollarSign, Users, UserPlus } from 'lucide-react';
import { analyticsApi } from '../lib/api/endpoints';
import { Badge, Button, Card, Spinner } from '../components/ui';
import { formatDuration, formatUsd } from '../lib/utils';

function Kpi({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: analyticsApi.dashboard });

  if (isLoading || !data) return <Spinner />;
  const { kpis, recentCalls } = data;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Your AI employees at a glance</p>
        </div>
        <Link to="/employees/new">
          <Button>
            <UserPlus className="h-4 w-4" /> New AI Employee
          </Button>
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Phone} label="Total Calls" value={String(kpis.totalCalls)} />
        <Kpi icon={Clock} label="Total Minutes" value={String(kpis.totalMinutes)} />
        <Kpi icon={DollarSign} label="Total Cost" value={formatUsd(kpis.totalUsd)} />
        <Kpi icon={Users} label="Active Employees" value={`${kpis.activeEmployees}/${kpis.employees}`} />
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Recent Calls</h2>
        {recentCalls.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No calls yet. Activate an inbound employee and simulate a call, or launch an outbound campaign.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="py-2">Direction</th>
                  <th>From → To</th>
                  <th>Duration</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="py-2 capitalize">{c.direction}</td>
                    <td className="text-slate-500">
                      {c.from} → {c.to}
                    </td>
                    <td>{formatDuration(c.durationSec)}</td>
                    <td>
                      <Badge>{c.outcome}</Badge>
                    </td>
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
