import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PhoneOutgoing, Play, Plus } from 'lucide-react';
import { campaignApi } from '../../lib/api/endpoints';
import { apiErrorMessage } from '../../lib/api/client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
  toast,
} from '../../components/ui';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
      <p className="text-lg font-bold leading-tight text-slate-900">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

export function CampaignsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignApi.list,
    // Poll while any campaign is actively running so progress updates live.
    refetchInterval: (query) =>
      query.state.data?.some((c) => c.status === 'running') ? 1500 : false,
  });

  const launch = useMutation({
    mutationFn: (id: string) => campaignApi.launch(id),
    onSuccess: () => {
      toast.success('Campaign launched — calls are on their way');
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Launch outbound calling campaigns"
        action={
          <Link to="/campaigns/new">
            <Button>
              <Plus className="h-4 w-4" /> New Campaign
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<PhoneOutgoing className="h-6 w-6" />}
          title="No campaigns yet"
          hint="Create a campaign for an outbound AI employee to start dialing your contact list."
          action={
            <Link to="/campaigns/new">
              <Button>
                <Plus className="h-4 w-4" /> Create a campaign
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => {
            const progress =
              c.stats.total > 0 ? Math.min(100, Math.round((c.stats.attempted / c.stats.total) * 100)) : 0;
            return (
              <Card key={c.id} className="flex flex-col">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug text-slate-900">{c.name}</h3>
                  <Badge>{c.status}</Badge>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2">
                  <Stat label="Total" value={c.stats.total} />
                  <Stat label="Attempted" value={c.stats.attempted} />
                  <Stat label="Connected" value={c.stats.connected} />
                </div>

                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-purple transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <p className="text-xs text-slate-400">Daily limit: {c.dailyCallLimit}</p>
                  {(c.status === 'draft' || c.status === 'paused') && (
                    <Button onClick={() => launch.mutate(c.id)} disabled={launch.isPending}>
                      <Play className="h-4 w-4" /> Launch
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
