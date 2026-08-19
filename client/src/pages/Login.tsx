import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import { AuthShell } from '../components/AuthShell';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
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
        <p className="mb-4 text-sm text-emerald-600">
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
            placeholder="123456"
            required
          />
        </Field>
        <Field label="New password (min 8, letters + numbers)">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </Field>
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Resetting…' : 'Reset password'}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 w-full text-sm text-slate-500 hover:text-slate-700"
        >
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
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
      </Field>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending…' : 'Send reset code'}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="mt-3 w-full text-sm text-slate-500 hover:text-slate-700"
      >
        Back to sign in
      </button>
    </form>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <AuthShell>
      <Card className="p-8">
        <div className="mb-7">
          <h1 className="text-xl font-bold text-slate-900">
            {forgot ? 'Reset your password' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {forgot ? 'We’ll get you back in shortly' : 'Sign in to your Vorizon workspace'}
          </p>
        </div>
        {forgot ? (
          <ForgotPassword onBack={() => setForgot(false)} />
        ) : (
          <>
            <GoogleSignInButton
              onSuccess={(res) => {
                setAuth(res.user, res.tokens);
                navigate('/');
              }}
              onError={setError}
            />
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <form onSubmit={submit}>
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
              className="mt-4 w-full text-center text-sm font-medium text-brand-blue hover:underline"
            >
              Forgot password?
            </button>
            <p className="mt-2 text-center text-sm text-slate-500">
              No account?{' '}
              <Link to="/register" className="font-medium text-brand-blue hover:underline">
                Create one
              </Link>
            </p>
          </>
        )}
      </Card>
    </AuthShell>
  );
}
