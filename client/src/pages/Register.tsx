import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple font-bold text-white">
            V
          </div>
          <h1 className="text-xl font-bold text-slate-800">Create your business account</h1>
          <p className="text-sm text-slate-500">Start building AI employees in minutes</p>
        </div>
        <form onSubmit={submit}>
          <Field label="Business name">
            <Input value={form.orgName} onChange={set('orgName')} required />
          </Field>
          <Field label="Your name">
            <Input value={form.name} onChange={set('name')} required />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={set('email')} required />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={form.password}
              onChange={set('password')}
              minLength={8}
              required
            />
          </Field>
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-blue">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
