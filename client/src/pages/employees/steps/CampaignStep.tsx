import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { AIEmployeeDTO } from '@vorizon/shared';
import { campaignApi } from '../../../lib/api/endpoints';
import { Badge, Card, Spinner } from '../../../components/ui';

export function CampaignStep({ employee }: { employee: AIEmployeeDTO }) {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignApi.list,
  });
  const mine = campaigns?.filter((c) => c.aiEmployeeId === employee.id) ?? [];

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-slate-800">Campaigns</h2>
      <p className="mb-4 text-sm text-slate-500">
        Campaigns — including the contact list they dial — are set up on the Campaigns page, not here.
      </p>

      {isLoading ? (
        <Spinner />
      ) : mine.length === 0 ? (
        <p className="py-3 text-center text-sm text-slate-400">No campaigns for this employee yet.</p>
      ) : (
        <ul className="mb-4 divide-y divide-slate-100">
          {mine.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-700">{c.name}</p>
                <p className="text-xs text-slate-400">
                  {c.stats.attempted}/{c.stats.total} attempted
                </p>
              </div>
              <Badge>{c.status}</Badge>
            </li>
          ))}
        </ul>
      )}

      <Link
        to={`/campaigns/new?employeeId=${employee.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline"
      >
        Create a campaign for {employee.name} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Card>
  );
}
