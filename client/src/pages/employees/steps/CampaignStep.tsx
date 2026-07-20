import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { AIEmployeeDTO } from '@vorizon/shared';
import { campaignApi } from '../../../lib/api/endpoints';
import { apiErrorMessage } from '../../../lib/api/client';
import { Badge, Button, Card, Field, Input, Spinner } from '../../../components/ui';

export function CampaignStep({ employee, onSaved }: { employee: AIEmployeeDTO; onSaved: () => void }) {
  const [name, setName] = useState(`${employee.name} Campaign`);
  const [dailyCallLimit, setDailyCallLimit] = useState(100);
  const [error, setError] = useState('');

  const { data: campaigns, refetch, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignApi.list,
  });
  const mine = campaigns?.filter((c) => c.aiEmployeeId === employee.id) ?? [];

  const create = useMutation({
    mutationFn: () =>
      campaignApi.create({
        name,
        aiEmployeeId: employee.id,
        retryAttempts: 0,
        retryInterval: 60,
        dailyCallLimit,
      }),
    onSuccess: () => {
      setError('');
      refetch();
      onSaved();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-1 text-lg font-semibold text-slate-800">Create Campaign</h2>
        <p className="mb-4 text-sm text-slate-500">
          Requires a completed interview (mark as tested first).
        </p>
        <Field label="Campaign name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Daily call limit">
          <Input
            type="number"
            value={dailyCallLimit}
            onChange={(e) => setDailyCallLimit(Number(e.target.value))}
          />
        </Field>
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>
          {create.isPending ? 'Creating…' : 'Create campaign'}
        </Button>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-800">Campaigns for this employee</h3>
        {isLoading ? (
          <Spinner />
        ) : mine.length === 0 ? (
          <p className="py-3 text-center text-sm text-slate-400">No campaigns yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
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
        <Link to="/campaigns" className="mt-3 inline-block text-sm font-medium text-brand-blue">
          Go to campaigns to launch →
        </Link>
      </Card>
    </div>
  );
}
