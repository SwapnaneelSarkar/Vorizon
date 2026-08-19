import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Trash2, Upload } from 'lucide-react';
import type { CampaignDTO, ContactImportResult, WorkingHours } from '@vorizon/shared';
import { campaignApi, contactApi, employeeApi } from '../../lib/api/endpoints';
import { apiErrorMessage } from '../../lib/api/client';
import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  Select,
  Spinner,
  toast,
} from '../../components/ui';
import { WorkingHoursEditor, defaultWorkingHours } from '../../components/WorkingHoursEditor';

/** Step 2: upload/add the numbers this campaign will dial, once it exists. */
function CampaignContacts({ campaign }: { campaign: CampaignDTO }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [importResult, setImportResult] = useState<ContactImportResult | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', campaign.id],
    queryFn: () => contactApi.list({ campaignId: campaign.id }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['contacts', campaign.id] });

  const upload = useMutation({
    mutationFn: (file: File) => contactApi.upload(file, campaign.id),
    onSuccess: (res) => {
      setImportResult(res);
      setError('');
      toast.success(`Imported ${res.imported} contact${res.imported === 1 ? '' : 's'}`);
      invalidate();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const create = useMutation({
    mutationFn: () => contactApi.create({ name: form.name, phone: form.phone, tags: [], campaignId: campaign.id }),
    onSuccess: () => {
      setForm({ name: '', phone: '' });
      setError('');
      invalidate();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => contactApi.remove(id),
    onSuccess: invalidate,
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Add numbers to call</h1>
      <p className="mb-6 text-sm text-slate-500">
        “{campaign.name}” is created. Upload a list or add numbers manually — this is who it dials.
      </p>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Upload CSV / XLSX</h2>
          <p className="mb-4 text-sm text-slate-500">
            Columns: name, phone (required), email, company, tags, notes.
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Upload className="h-4 w-4" /> Choose file
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])}
            />
          </label>
          {importResult && (
            <div className="mt-4 text-sm">
              <p className="text-emerald-600">Imported {importResult.imported} contact(s).</p>
              {importResult.invalid.length > 0 && (
                <div className="mt-2 rounded-lg bg-red-50 p-3 text-red-600">
                  {importResult.invalid.length} invalid row(s):
                  <ul className="mt-1 list-inside list-disc">
                    {importResult.invalid.slice(0, 5).map((r) => (
                      <li key={r.row}>
                        Row {r.row}: {r.reason} {r.value ? `(${r.value})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Add manually</h2>
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 415 555 0100"
            />
          </Field>
          {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
          <Button onClick={() => create.mutate()} disabled={!form.name || !form.phone || create.isPending}>
            Add number
          </Button>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 font-semibold text-slate-900">Numbers on this campaign ({data?.total ?? 0})</h2>
        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No numbers yet" hint="Upload a CSV or add numbers above to build this campaign's dial list." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="py-3 font-medium text-slate-800">{c.name}</td>
                    <td className="font-mono text-xs text-slate-500">{c.phone}</td>
                    <td>
                      <Badge>{c.validationStatus}</Badge>
                    </td>
                    <td className="text-right">
                      <ConfirmButton
                        onConfirm={() => remove.mutate(c.id)}
                        title="Remove this number?"
                        message={`${c.name} (${c.phone}) will be removed from this campaign.`}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </ConfirmButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Button onClick={() => navigate('/campaigns')} className="w-full">
        Done — go to Campaigns <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function CampaignNewPage() {
  const [searchParams] = useSearchParams();
  const preselectedEmployeeId = searchParams.get('employeeId') ?? '';
  const { data, isLoading } = useQuery({
    queryKey: ['employees', 'outbound'],
    queryFn: () => employeeApi.list({ type: 'outbound' }),
  });

  const [created, setCreated] = useState<CampaignDTO | null>(null);
  const [name, setName] = useState('');
  const [aiEmployeeId, setAiEmployeeId] = useState(preselectedEmployeeId);
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
    onSuccess: setCreated,
    onError: (e) => setError(apiErrorMessage(e)),
  });

  if (isLoading) return <Spinner />;
  if (created) return <CampaignContacts campaign={created} />;

  const outbound = data?.items ?? [];
  const preselected = outbound.find((e) => e.id === preselectedEmployeeId);
  if (preselected && !name) setName(`${preselected.name} Campaign`);

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
            {create.isPending ? 'Creating…' : 'Create & add numbers'} <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      )}
    </div>
  );
}
