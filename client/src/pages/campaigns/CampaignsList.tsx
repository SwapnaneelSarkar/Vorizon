import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Play, Plus } from 'lucide-react';
import { campaignApi } from '../../lib/api/endpoints';
import { apiErrorMessage } from '../../lib/api/client';
import { Badge, Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useState } from 'react';

export function CampaignsPage() {
  const qc = useQueryClient();
  const [error, setError] = useState('');
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
      setError('');
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Campaigns</h1>
          <p className="text-sm text-slate-500">Launch outbound calling campaigns</p>
        </div>
        <Link to="/campaigns/new">
          <Button>
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {isLoading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No campaigns yet" hint="Create a campaign for an outbound AI employee." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <Card key={c.id}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">{c.name}</h3>
                <Badge>{c.status}</Badge>
              </div>
              <div className="mb-4 space-y-1 text-sm text-slate-500">
                <p>Total: {c.stats.total}</p>
                <p>Attempted: {c.stats.attempted}</p>
                <p>Connected: {c.stats.connected}</p>
                <p>Daily limit: {c.dailyCallLimit}</p>
              </div>
              {(c.status === 'draft' || c.status === 'paused') && (
                <Button onClick={() => launch.mutate(c.id)} disabled={launch.isPending}>
                  <Play className="h-4 w-4" /> Launch
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
