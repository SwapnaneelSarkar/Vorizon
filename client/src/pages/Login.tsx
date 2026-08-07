import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import { Button, Card, Field, Input } from '../components/ui';

function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setStep('reset');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(email, otp, newPassword);
      setStep('done');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="text-center">
        <p className="mb-4 text-sm text-green-600">
          Password updated. Sign in with your new password.
        </p>
        <Button onClick={onBack}>Back to sign in</Button>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <form onSubmit={reset}>
        <p className="mb-4 text-sm text-slate-500">
          If an account exists for <strong>{email}</strong>, we emailed it a 6-digit code.
        </p>
        <Field label="6-digit code">
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            required
          />
        </Field>
        <Field label="New password (min 8, letters + numbers)">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </Field>
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Resetting…' : 'Reset password'}
        </Button>
        <button type="button" onClick={onBack} className="mt-3 w-full text-sm text-slate-500">
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={request}>
      <p className="mb-4 text-sm text-slate-500">
        Enter your account email and we&apos;ll send a reset code.
      </p>
      <Field label="Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending…' : 'Send reset code'}
      </Button>
      <button type="button" onClick={onBack} className="mt-3 w-full text-sm text-slate-500">
        Back to sign in
      </button>
    </form>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('demo@vorizon.ai');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setAuth(res.user, res.tokens);
      navigate('/');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple font-bold text-white">
            V
          </div>
          <h1 className="text-xl font-bold text-slate-800">Welcome to Vorizon</h1>
          <p className="text-sm text-slate-500">
            {forgot ? 'Reset your password' : 'Sign in to your AI employee platform'}
          </p>
        </div>
        {forgot ? (
          <ForgotPassword onBack={() => setForgot(false)} />
        ) : (
          <>
            <form onSubmit={submit}>
              <Field label="Email">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setForgot(true)}
              className="mt-3 w-full text-center text-sm font-medium text-brand-blue"
            >
              Forgot password?
            </button>
            <p className="mt-2 text-center text-sm text-slate-500">
              No account?{' '}
              <Link to="/register" className="font-medium text-brand-blue">
                Create one
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
