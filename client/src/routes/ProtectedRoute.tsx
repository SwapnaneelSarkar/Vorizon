import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/Layout';
import { Spinner } from '../components/ui';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const token = useAuthStore((s) => s.accessToken);
  // Wait for the persisted store to load from localStorage before deciding —
  // otherwise a hard reload briefly sees a null token and bounces a
  // logged-in user to /login.
  if (!hasHydrated) return <Spinner />;
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}
