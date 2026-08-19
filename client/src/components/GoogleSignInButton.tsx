import { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { authApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.9c1.7-1.57 2.68-3.87 2.68-6.6Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.96H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.04l3.05-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.96l3.05 2.34C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

/** Shared "Sign in with Google" action for both Login and Register — creates the account on first use. */
export function GoogleSignInButton({
  onSuccess,
  onError,
}: {
  onSuccess: (res: Awaited<ReturnType<typeof authApi.google>>) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const click = async () => {
    setBusy(true);
    try {
      const idToken = await signInWithGoogle();
      const res = await authApi.google(idToken);
      onSuccess(res);
    } catch (err) {
      // User closed the account picker — not a real error, stay quiet.
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      onError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void click()}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GoogleMark />
      {busy ? 'Signing in…' : 'Continue with Google'}
    </button>
  );
}
