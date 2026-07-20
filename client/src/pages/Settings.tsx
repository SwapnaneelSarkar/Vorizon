import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { authApi, userApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import { Badge, Button, Card, EmptyState, Field, Input, Select, Spinner } from '../components/ui';

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

export function SettingsPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Settings</h1>
      <p className="mb-6 text-sm text-slate-500">Account security and team management</p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChangePassword />
        <TeamManagement />
      </div>
    </div>
  );
}
