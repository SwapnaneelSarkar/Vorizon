import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PhoneOff, Trash2 } from 'lucide-react';
import { authApi, complianceApi, userApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import { Badge, Button, Card, EmptyState, Field, Input, Select, Spinner, Textarea } from '../components/ui';

function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const change = useMutation({
    mutationFn: () => authApi.changePassword(current, next),
    onSuccess: () => {
      setMsg('Password updated.');
      setError('');
      setCurrent('');
      setNext('');
    },
    onError: (e) => {
      setError(apiErrorMessage(e));
      setMsg('');
    },
  });

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-800">Change Password</h2>
      <Field label="Current password">
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="New password (min 8, letters + numbers)">
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
      {msg && <p className="mb-2 text-sm text-green-600">{msg}</p>}
      <Button onClick={() => change.mutate()} disabled={!current || !next || change.isPending}>
        {change.isPending ? 'Updating…' : 'Update password'}
      </Button>
    </Card>
  );
}

function TeamManagement() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const canManage = me?.role === 'owner' || me?.role === 'admin';
  const isOwner = me?.role === 'owner';

  const [form, setForm] = useState({ name: '', email: '', role: 'member' });
  const [tempPassword, setTempPassword] = useState('');
  const [error, setError] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: userApi.list,
    enabled: canManage,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['team'] });

  const create = useMutation({
    mutationFn: () => userApi.create(form),
    onSuccess: (res) => {
      setTempPassword(res.tempPassword ?? '');
      setForm({ name: '', email: '', role: 'member' });
      setError('');
      invalidate();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });
  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => userApi.updateRole(id, role),
    onSuccess: invalidate,
    onError: (e) => setError(apiErrorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => userApi.remove(id),
    onSuccess: invalidate,
    onError: (e) => setError(apiErrorMessage(e)),
  });

  if (!canManage) {
    return (
      <Card>
        <h2 className="mb-2 font-semibold text-slate-800">Team</h2>
        <EmptyState title="Owners and admins can manage the team" />
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-800">Team Members</h2>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          {isOwner && <option value="owner">Owner</option>}
        </Select>
        <Button onClick={() => create.mutate()} disabled={!form.name || !form.email || create.isPending}>
          Add member
        </Button>
      </div>
      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
      {tempPassword && (
        <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Temporary password (share securely, shown once): <strong>{tempPassword}</strong>
        </p>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="py-2 font-medium text-slate-700">
                  {u.name} {u.id === me?.id && <span className="text-xs text-slate-400">(you)</span>}
                </td>
                <td className="text-slate-500">{u.email}</td>
                <td>
                  {isOwner && u.id !== me?.id ? (
                    <Select
                      value={u.role}
                      onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value })}
                      className="w-32"
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                      <option value="owner">owner</option>
                    </Select>
                  ) : (
                    <Badge>{u.role}</Badge>
                  )}
                </td>
                <td className="text-right">
                  {isOwner && u.id !== me?.id && (
                    <button onClick={() => remove.mutate(u.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function CallingConsent() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const canManage = me?.role === 'owner' || me?.role === 'admin';
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['compliance'], queryFn: complianceApi.get });

  const accept = useMutation({
    mutationFn: complianceApi.acceptConsent,
    onSuccess: () => {
      setError('');
      qc.invalidateQueries({ queryKey: ['compliance'] });
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  if (isLoading || !data) return <Spinner />;
  const consent = data.callingConsent;

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-800">AI Calling Consent</h2>
      {consent.accepted ? (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <p className="font-medium">Consent recorded — AI calling is enabled.</p>
          <p className="mt-1 text-green-600">
            Accepted {consent.acceptedAt ? new Date(consent.acceptedAt).toLocaleString() : ''}
            {consent.ip ? ` from IP ${consent.ip}` : ''}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            AI calling is disabled until your organization explicitly consents. Campaigns cannot be
            launched before this is accepted.
          </p>
          <label className="mb-3 flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              disabled={!canManage}
            />
            <span>
              I confirm this organization has obtained the required consent to place automated
              (AI) calls to its contacts, and will comply with TCPA and applicable local telephony
              regulations, including honoring opt-out requests and Do-Not-Call lists.
            </span>
          </label>
          {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
          <Button onClick={() => accept.mutate()} disabled={!checked || !canManage || accept.isPending}>
            {accept.isPending ? 'Saving…' : 'Enable AI calling'}
          </Button>
          {!canManage && (
            <p className="mt-2 text-xs text-slate-400">Only owners and admins can accept consent.</p>
          )}
        </>
      )}
    </Card>
  );
}

function RecordingDisclosure() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const canManage = me?.role === 'owner' || me?.role === 'admin';
  const { data } = useQuery({ queryKey: ['compliance'], queryFn: complianceApi.get });

  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (data) {
      setEnabled(data.recordingDisclosure.enabled);
      setMessage(data.recordingDisclosure.message);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => complianceApi.updateSettings({ enabled, message }),
    onSuccess: () => {
      setMsg('Saved.');
      setError('');
      qc.invalidateQueries({ queryKey: ['compliance'] });
    },
    onError: (e) => {
      setError(apiErrorMessage(e));
      setMsg('');
    },
  });

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-800">Call Recording Disclosure</h2>
      <p className="mb-3 text-sm text-slate-500">
        Where legally required, the AI announces this disclosure at the start of every call.
        Enable or disable it per your jurisdiction.
      </p>
      <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          disabled={!canManage}
        />
        Announce recording disclosure at call start
      </label>
      <Field label="Disclosure message">
        <Textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!canManage}
        />
      </Field>
      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
      {msg && <p className="mb-2 text-sm text-green-600">{msg}</p>}
      <Button onClick={() => save.mutate()} disabled={!canManage || save.isPending || message.length < 10}>
        {save.isPending ? 'Saving…' : 'Save disclosure settings'}
      </Button>
    </Card>
  );
}

function DncManager() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const canRemove = me?.role === 'owner' || me?.role === 'admin';
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['dnc'], queryFn: complianceApi.listDnc });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dnc'] });
    qc.invalidateQueries({ queryKey: ['compliance'] });
    qc.invalidateQueries({ queryKey: ['contacts'] });
  };

  const add = useMutation({
    mutationFn: () => complianceApi.addDnc(phone),
    onSuccess: () => {
      setPhone('');
      setError('');
      invalidate();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => complianceApi.removeDnc(id),
    onSuccess: invalidate,
    onError: (e) => setError(apiErrorMessage(e)),
  });

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-800">Do Not Call List</h2>
      <p className="mb-3 text-sm text-slate-500">
        Numbers on this list are never dialed by AI campaigns. Opt-outs are added automatically.
      </p>
      <div className="mb-3 flex gap-2">
        <Input
          placeholder="+1 415 555 0100"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button onClick={() => add.mutate()} disabled={!phone || add.isPending}>
          Add
        </Button>
      </div>
      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
      {isLoading ? (
        <Spinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No numbers on the DNC list" />
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2">Phone</th>
              <th>Reason</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="py-2 font-medium text-slate-700">{e.phone}</td>
                <td>
                  <Badge>{e.reason === 'opt_out' ? 'opted out' : 'manual'}</Badge>
                </td>
                <td className="text-slate-500">{new Date(e.createdAt).toLocaleDateString()}</td>
                <td className="text-right">
                  {canRemove && (
                    <button
                      onClick={() => remove.mutate(e.id)}
                      className="text-slate-400 hover:text-red-500"
                      title="Remove from DNC"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Settings</h1>
      <p className="mb-6 text-sm text-slate-500">
        Account security, team management, and calling compliance
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChangePassword />
        <TeamManagement />
      </div>
      <h2 className="mb-3 mt-8 flex items-center gap-2 text-lg font-bold text-slate-800">
        <PhoneOff className="h-5 w-5 text-slate-500" /> Telephony Compliance
      </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CallingConsent />
        <RecordingDisclosure />
        <div className="lg:col-span-2">
          <DncManager />
        </div>
      </div>
    </div>
  );
}
