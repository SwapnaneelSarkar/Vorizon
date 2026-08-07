import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PhoneOff, Trash2, Upload } from 'lucide-react';
import type { ContactImportResult } from '@vorizon/shared';
import { complianceApi, contactApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import { Badge, Button, Card, EmptyState, Field, Input, Spinner } from '../components/ui';

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
      invalidate();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const remove = useMutation({ mutationFn: (id: string) => contactApi.remove(id), onSuccess: invalidate });

  const optOut = useMutation({
    mutationFn: (phone: string) => complianceApi.optOut(phone),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['dnc'] });
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Contacts</h1>
      <p className="mb-6 text-sm text-slate-500">Upload or add contacts for outbound campaigns</p>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-800">Upload CSV / XLSX</h2>
          <p className="mb-3 text-sm text-slate-500">
            Columns: name, phone (required), email, company, tags, notes. Phone numbers are validated.
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Upload className="h-4 w-4" /> Choose file
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])}
            />
          </label>
          {importResult && (
            <div className="mt-3 text-sm">
              <p className="text-green-600">Imported {importResult.imported} contact(s).</p>
              {importResult.invalid.length > 0 && (
                <div className="mt-1 text-red-500">
                  {importResult.invalid.length} invalid row(s):
                  <ul className="list-inside list-disc">
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
          <h2 className="mb-3 font-semibold text-slate-800">Add manually</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 415 555 0100"
              />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Company">
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
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
        <h2 className="mb-3 font-semibold text-slate-800">All Contacts ({data?.total ?? 0})</h2>
        {isLoading ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No contacts yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="py-2">Name</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-700">{c.name}</td>
                    <td className="text-slate-500">{c.phone}</td>
                    <td className="text-slate-500">{c.company || '—'}</td>
                    <td>
                      <span className="inline-flex items-center gap-1">
                        <Badge>{c.validationStatus}</Badge>
                        {c.optedOut && (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            opted out
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-2">
                        {!c.optedOut && (
                          <button
                            onClick={() => optOut.mutate(c.phone)}
                            className="text-slate-400 hover:text-amber-600"
                            title="Opt out of AI calls (adds to DNC)"
                          >
                            <PhoneOff className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => remove.mutate(c.id)}
                          className="text-slate-400 hover:text-red-500"
                          title="Delete contact"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
