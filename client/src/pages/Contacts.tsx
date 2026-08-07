import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Contact as ContactIcon, PhoneOff, Trash2, Upload } from 'lucide-react';
import type { ContactImportResult } from '@vorizon/shared';
import { complianceApi, contactApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Spinner,
  toast,
} from '../components/ui';

export function ContactsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', tags: '', notes: '' });
  const [importResult, setImportResult] = useState<ContactImportResult | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['contacts'], queryFn: () => contactApi.list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['contacts'] });

  const upload = useMutation({
    mutationFn: (file: File) => contactApi.upload(file),
    onSuccess: (res) => {
      setImportResult(res);
      setError('');
      toast.success(`Imported ${res.imported} contact${res.imported === 1 ? '' : 's'}`);
      invalidate();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const create = useMutation({
    mutationFn: () =>
      contactApi.create({
        name: form.name,
        phone: form.phone,
        email: form.email,
        company: form.company,
        notes: form.notes,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      setForm({ name: '', phone: '', email: '', company: '', tags: '', notes: '' });
      setError('');
      toast.success('Contact added');
      invalidate();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => contactApi.remove(id),
    onSuccess: () => {
      toast.success('Contact deleted');
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const optOut = useMutation({
    mutationFn: (phone: string) => complianceApi.optOut(phone),
    onSuccess: () => {
      toast.success('Number opted out and added to the Do-Not-Call list');
      invalidate();
      qc.invalidateQueries({ queryKey: ['dnc'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div>
      <PageHeader title="Contacts" description="Upload or add contacts for outbound campaigns" />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Upload CSV / XLSX</h2>
          <p className="mb-4 text-sm text-slate-500">
            Columns: name, phone (required), email, company, tags, notes. Phone numbers are
            validated automatically.
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
          <div className="grid grid-cols-2 gap-x-3">
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
            <Field label="Email">
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@company.com"
              />
            </Field>
            <Field label="Company">
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Acme Inc."
              />
            </Field>
            <Field label="Tags (comma-separated)">
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="lead, vip"
              />
            </Field>
            <Field label="Notes">
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
          {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
          <Button onClick={() => create.mutate()} disabled={!form.name || !form.phone || create.isPending}>
            Add contact
          </Button>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-slate-900">All Contacts ({data?.total ?? 0})</h2>
        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={<ContactIcon className="h-6 w-6" />}
            title="No contacts yet"
            hint="Upload a CSV or add contacts manually — they become the audience for your outbound campaigns."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="py-3 font-medium text-slate-800">{c.name}</td>
                    <td className="font-mono text-xs text-slate-500">{c.phone}</td>
                    <td className="text-slate-500">{c.company || '—'}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        <Badge>{c.validationStatus}</Badge>
                        {c.optedOut && <Badge>opted out</Badge>}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-1">
                        {!c.optedOut && (
                          <ConfirmButton
                            onConfirm={() => optOut.mutate(c.phone)}
                            title="Opt out of AI calls?"
                            message={`${c.phone} will be added to the Do-Not-Call list and never dialed again.`}
                            confirmLabel="Opt out"
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                          >
                            <PhoneOff className="h-4 w-4" />
                          </ConfirmButton>
                        )}
                        <ConfirmButton
                          onConfirm={() => remove.mutate(c.id)}
                          title="Delete this contact?"
                          message={`${c.name} (${c.phone}) will be removed permanently.`}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ConfirmButton>
                      </span>
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
