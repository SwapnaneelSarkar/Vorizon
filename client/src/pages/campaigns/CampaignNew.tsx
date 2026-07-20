import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { campaignApi, employeeApi } from '../../lib/api/endpoints';
import { apiErrorMessage } from '../../lib/api/client';
import { Button, Card, EmptyState, Field, Input, Select, Spinner } from '../../components/ui';

export function CampaignNewPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['employees', 'outbound'],
    queryFn: () => employeeApi.list({ type: 'outbound' }),
  });

  const [name, setName] = useState('');
  const [aiEmployeeId, setAiEmployeeId] = useState('');
  const [dailyCallLimit, setDailyCallLimit] = useState(100);
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () =>
      campaignApi.create({ name, aiEmployeeId, retryAttempts: 0, retryInterval: 60, dailyCallLimit }),
    onSuccess: () => navigate('/campaigns'),
    onError: (e) => setError(apiErrorMessage(e)),
  });

  if (isLoading) return <Spinner />;

  const outbound = data?.items ?? [];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-slate-800">New Campaign</h1>
      <p className="mb-6 text-sm text-slate-500">Configure an outbound calling campaign</p>

      {outbound.length === 0 ? (
        <EmptyState
          title="No outbound AI employees"
          hint="Create an outbound AI employee first, then come back."
        />
      ) : (
        <Card>
          <Field label="Campaign name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Outbound AI Employee">
            <Select value={aiEmployeeId} onChange={(e) => setAiEmployeeId(e.target.value)}>
              <option value="">Select…</option>
              {outbound.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.status})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Daily call limit">
            <Input
              type="number"
              value={dailyCallLimit}
              onChange={(e) => setDailyCallLimit(Number(e.target.value))}
            />
          </Field>
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          <Button
            onClick={() => create.mutate()}
            disabled={!name || !aiEmployeeId || create.isPending}
            className="w-full"
          >
            {create.isPending ? 'Creating…' : 'Create campaign'}
          </Button>
        </Card>
      )}
    </div>
  );
}
