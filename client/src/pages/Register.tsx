import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import { AuthShell } from '../components/AuthShell';
import { Button, Card, Field, Input } from '../components/ui';

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ orgName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register(form);
      setAuth(res.user, res.tokens);
      navigate('/');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AuthShell>
      <Card className="p-8">
        <div className="mb-7">
          <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Start building AI employees in minutes</p>
        </div>
        <form onSubmit={submit}>
          <Field label="Business name">
            <Input value={form.orgName} onChange={set('orgName')} placeholder="Acme Inc." required />
          </Field>
          <Field label="Your name">
            <Input value={form.name} onChange={set('name')} placeholder="Jane Doe" required />
          </Field>
          <Field label="Work email">
            <Input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password (min 8, letters + numbers)">
            <Input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-blue hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
