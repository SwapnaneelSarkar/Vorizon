import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { WorkingHours } from '@vorizon/shared';
import { campaignApi, employeeApi } from '../../lib/api/endpoints';
import { apiErrorMessage } from '../../lib/api/client';
import { Button, Card, EmptyState, Field, Input, Select, Spinner } from '../../components/ui';
import { WorkingHoursEditor, defaultWorkingHours } from '../../components/WorkingHoursEditor';

export function CampaignNewPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['employees', 'outbound'],
    queryFn: () => employeeApi.list({ type: 'outbound' }),
  });

  const [name, setName] = useState('');
  const [aiEmployeeId, setAiEmployeeId] = useState('');
  const [dailyCallLimit, setDailyCallLimit] = useState(100);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [retryInterval, setRetryInterval] = useState(60);
  const [callingSchedule, setCallingSchedule] = useState<WorkingHours>(defaultWorkingHours);
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () =>
      campaignApi.create({
        name,
        aiEmployeeId,
        retryAttempts,
        retryInterval,
        dailyCallLimit,
        callingSchedule,
      }),
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
          <div className="grid grid-cols-3 gap-3">
            <Field label="Daily call limit">
              <Input
                type="number"
                value={dailyCallLimit}
                onChange={(e) => setDailyCallLimit(Number(e.target.value))}
              />
            </Field>
            <Field label="Retry attempts">
              <Input
                type="number"
                value={retryAttempts}
                onChange={(e) => setRetryAttempts(Number(e.target.value))}
              />
            </Field>
            <Field label="Retry interval (min)">
              <Input
                type="number"
                value={retryInterval}
                onChange={(e) => setRetryInterval(Number(e.target.value))}
              />
            </Field>
          </div>
          <WorkingHoursEditor
            label="Calling Schedule / Working Hours"
            value={callingSchedule}
            onChange={setCallingSchedule}
          />
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
