import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, UserPlus } from 'lucide-react';
import { leadApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import { Button, Card, EmptyState, Field, Input, PageHeader, Spinner, toast } from '../components/ui';
import { cn } from '../lib/utils';

const statusStyle: Record<string, string> = {
  new: 'bg-slate-100 text-slate-600',
  qualifying: 'bg-blue-50 text-blue-700',
  qualified: 'bg-emerald-50 text-emerald-700',
  unqualified: 'bg-amber-50 text-amber-700',
  contacted: 'bg-violet-50 text-violet-700',
  converted: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-50 text-red-700',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        statusStyle[status] ?? 'bg-slate-100 text-slate-600',
      )}
    >
      {status}
    </span>
  );
}

export function LeadsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '' });
  const { data, isLoading } = useQuery({ queryKey: ['leads'], queryFn: () => leadApi.list() });
  const { data: stats } = useQuery({ queryKey: ['lead-stats'], queryFn: leadApi.stats });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['leads'] });
    qc.invalidateQueries({ queryKey: ['lead-stats'] });
  };

  const create = useMutation({
    mutationFn: () => leadApi.create(form),
    onSuccess: () => {
      setForm({ name: '', phone: '', email: '', company: '' });
      toast.success('Lead added — AI qualification started');
      // Give the async pipeline a moment, then refresh.
      setTimeout(invalidate, 600);
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const kpis = [
    { label: 'Total Leads', value: stats?.total ?? 0 },
    { label: 'Qualified', value: stats?.qualified ?? 0 },
    { label: 'Contacted', value: stats?.contacted ?? 0 },
    { label: 'Converted', value: stats?.converted ?? 0 },
  ];

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Leads captured from your connected platforms, auto-qualified by AI"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <p className="text-sm text-slate-500">{k.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
            <UserPlus className="h-4 w-4 text-slate-400" /> Add a lead
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Manually add a lead to run it through the AI qualification pipeline.
          </p>
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
          </Field>
          <div className="grid grid-cols-2 gap-x-3">
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 415 555 0100" />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@co.com" />
            </Field>
          </div>
          <Field label="Company">
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc." />
          </Field>
          <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>
            {create.isPending ? 'Adding…' : 'Add lead'}
          </Button>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">All Leads ({data?.total ?? 0})</h2>
          {isLoading ? (
            <Spinner />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="No leads yet"
              hint="Connect an ad platform or add a lead manually — the AI qualifies each one automatically."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Source</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((l) => (
                    <tr key={l.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="py-3">
                        <p className="font-medium text-slate-800">{l.name}</p>
                        <p className="text-xs text-slate-400">{l.phone || l.email || l.company || '—'}</p>
                      </td>
                      <td className="capitalize text-slate-500">{l.source.replace(/_/g, ' ')}</td>
                      <td>
                        {l.score != null ? (
                          <span className="font-medium text-slate-700">{l.score}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td>
                        <StatusPill status={l.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
