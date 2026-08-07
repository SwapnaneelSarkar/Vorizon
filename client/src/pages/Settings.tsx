import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PhoneOff, ShieldCheck, Trash2 } from 'lucide-react';
import { authApi, complianceApi, userApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  Textarea,
  toast,
} from '../components/ui';

function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');

  const change = useMutation({
    mutationFn: () => authApi.changePassword(current, next),
    onSuccess: () => {
      toast.success('Password updated');
      setCurrent('');
      setNext('');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Card>
      <h2 className="mb-4 font-semibold text-slate-900">Change Password</h2>
      <Field label="Current password">
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="New password (min 8, letters + numbers)">
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
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
      toast.success('Team member added');
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => userApi.updateRole(id, role),
    onSuccess: () => {
      toast.success('Role updated');
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => userApi.remove(id),
    onSuccess: () => {
      toast.success('Member removed');
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (!canManage) {
    return (
      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Team</h2>
        <EmptyState title="Owners and admins can manage the team" />
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 font-semibold text-slate-900">Team Members</h2>
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
      {tempPassword && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Temporary password (share securely, shown once): <strong>{tempPassword}</strong>
        </p>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="pb-3">Name</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Role</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users?.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-slate-50/70">
                <td className="py-3 font-medium text-slate-800">
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
                    <ConfirmButton
                      onConfirm={() => remove.mutate(u.id)}
                      title="Remove this member?"
                      message={`${u.name} will lose access to the workspace immediately.`}
                      confirmLabel="Remove"
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </ConfirmButton>
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

  const { data, isLoading } = useQuery({ queryKey: ['compliance'], queryFn: complianceApi.get });

  const accept = useMutation({
    mutationFn: complianceApi.acceptConsent,
    onSuccess: () => {
      toast.success('Consent recorded — AI calling is enabled');
      qc.invalidateQueries({ queryKey: ['compliance'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (isLoading || !data) return <Spinner />;
  const consent = data.callingConsent;

  return (
    <Card>
      <h2 className="mb-4 font-semibold text-slate-900">AI Calling Consent</h2>
      {consent.accepted ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="font-semibold text-emerald-800">Consent recorded — AI calling is enabled.</p>
            <p className="mt-0.5 text-emerald-600">
              Accepted {consent.acceptedAt ? new Date(consent.acceptedAt).toLocaleString() : ''}
              {consent.ip ? ` from IP ${consent.ip}` : ''}
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">
            AI calling is disabled until your organization explicitly consents. Campaigns cannot be
            launched before this is accepted.
          </p>
          <label className="mb-4 flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 p-3 text-sm text-slate-600 transition hover:bg-slate-50">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              disabled={!canManage}
            />
            <span>
              I confirm this organization has obtained the required consent to place automated (AI)
              calls to its contacts, and will comply with TCPA and applicable local telephony
              regulations, including honoring opt-out requests and Do-Not-Call lists.
            </span>
          </label>
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

  useEffect(() => {
    if (data) {
      setEnabled(data.recordingDisclosure.enabled);
      setMessage(data.recordingDisclosure.message);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => complianceApi.updateSettings({ enabled, message }),
    onSuccess: () => {
      toast.success('Disclosure settings saved');
      qc.invalidateQueries({ queryKey: ['compliance'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Card>
      <h2 className="mb-4 font-semibold text-slate-900">Call Recording Disclosure</h2>
      <p className="mb-4 text-sm text-slate-500">
        Where legally required, the AI announces this disclosure at the start of every call. Enable
        or disable it per your jurisdiction.
      </p>
      <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
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
      toast.success('Number added to the Do-Not-Call list');
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => complianceApi.removeDnc(id),
    onSuccess: () => {
      toast.success('Number removed from the Do-Not-Call list');
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-900">Do Not Call List</h2>
      <p className="mb-4 text-sm text-slate-500">
        Numbers on this list are never dialed by AI campaigns. Opt-outs are added automatically.
      </p>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="+1 415 555 0100"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={() => add.mutate()} disabled={!phone || add.isPending}>
          Add
        </Button>
      </div>
      {isLoading ? (
        <Spinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<PhoneOff className="h-6 w-6" />}
          title="No numbers on the DNC list"
          hint="Add numbers manually, or they’ll appear here automatically when contacts opt out."
        />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="pb-3">Phone</th>
              <th className="pb-3">Reason</th>
              <th className="pb-3">Added</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((e) => (
              <tr key={e.id} className="transition-colors hover:bg-slate-50/70">
                <td className="py-3 font-mono text-xs font-medium text-slate-800">{e.phone}</td>
                <td>
                  <Badge>{e.reason === 'opt_out' ? 'opted out' : 'manual'}</Badge>
                </td>
                <td className="text-slate-500">{new Date(e.createdAt).toLocaleDateString()}</td>
                <td className="text-right">
                  {canRemove && (
                    <ConfirmButton
                      onConfirm={() => remove.mutate(e.id)}
                      title="Remove from Do-Not-Call list?"
                      message={`${e.phone} will become callable by AI campaigns again.`}
                      confirmLabel="Remove"
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </ConfirmButton>
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
      <PageHeader
        title="Settings"
        description="Account security, team management, and calling compliance"
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChangePassword />
        <TeamManagement />
      </div>
      <h2 className="mb-4 mt-10 flex items-center gap-2 text-lg font-bold text-slate-900">
        <PhoneOff className="h-5 w-5 text-slate-400" /> Telephony Compliance
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
