import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Clock,
  DollarSign,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  UserPlus,
  Users,
} from 'lucide-react';
import { analyticsApi } from '../lib/api/endpoints';
import { Badge, Button, Card, PageHeader, Spinner } from '../components/ui';
import { cn, formatDuration, formatUsd } from '../lib/utils';

const kpiTints: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
};

function Kpi({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  tint: keyof typeof kpiTints;
}) {
  return (
    <Card className="flex items-center gap-4 transition hover:shadow-card-hover">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', kpiTints[tint])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold tracking-tight text-slate-900">{value}</p>
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
      <PageHeader
        title="Dashboard"
        description="Your AI employees at a glance"
        action={
          <Link to="/employees/new">
            <Button>
              <UserPlus className="h-4 w-4" /> New AI Employee
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Phone} label="Total Calls" value={String(kpis.totalCalls)} tint="blue" />
        <Kpi icon={Clock} label="Total Minutes" value={String(kpis.totalMinutes)} tint="violet" />
        <Kpi icon={DollarSign} label="Total Cost" value={formatUsd(kpis.totalUsd)} tint="emerald" />
        <Kpi
          icon={Users}
          label="Active Employees"
          value={`${kpis.activeEmployees}/${kpis.employees}`}
          tint="amber"
        />
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Calls</h2>
        {recentCalls.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No calls yet. Activate an inbound employee and simulate a call, or launch an outbound
            campaign.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Direction</th>
                  <th className="pb-3">From → To</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCalls.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="py-3">
                      <span className="inline-flex items-center gap-2 capitalize text-slate-700">
                        {c.direction === 'inbound' ? (
                          <PhoneIncoming className="h-4 w-4 text-blue-500" />
                        ) : (
                          <PhoneOutgoing className="h-4 w-4 text-violet-500" />
                        )}
                        {c.direction}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-500">
                      {c.from} → {c.to}
                    </td>
                    <td className="text-slate-700">{formatDuration(c.durationSec)}</td>
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
