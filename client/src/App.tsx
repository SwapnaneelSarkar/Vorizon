import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Spinner } from './components/ui';
import { useAuthStore } from './store/authStore';

const LoginPage = lazy(() => import('./pages/Login').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/Register').then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.DashboardPage })));
const EmployeesPage = lazy(() =>
  import('./pages/employees/EmployeesList').then((m) => ({ default: m.EmployeesPage })),
);
const EmployeeWizardPage = lazy(() =>
  import('./pages/employees/EmployeeWizard').then((m) => ({ default: m.EmployeeWizardPage })),
);
const ContactsPage = lazy(() => import('./pages/Contacts').then((m) => ({ default: m.ContactsPage })));
const IntegrationsPage = lazy(() =>
  import('./pages/Integrations').then((m) => ({ default: m.IntegrationsPage })),
);
const LeadsPage = lazy(() => import('./pages/Leads').then((m) => ({ default: m.LeadsPage })));
const CampaignsPage = lazy(() =>
  import('./pages/campaigns/CampaignsList').then((m) => ({ default: m.CampaignsPage })),
);
const CampaignNewPage = lazy(() =>
  import('./pages/campaigns/CampaignNew').then((m) => ({ default: m.CampaignNewPage })),
);
const CampaignDetailPage = lazy(() =>
  import('./pages/campaigns/CampaignDetail').then((m) => ({ default: m.CampaignDetailPage })),
);
const AnalyticsPage = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.AnalyticsPage })));
const BillingPage = lazy(() => import('./pages/Billing').then((m) => ({ default: m.BillingPage })));
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })));
const PrivacyPage = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/Terms').then((m) => ({ default: m.TermsPage })));
const LandingPage = lazy(() => import('./pages/marketing/Landing').then((m) => ({ default: m.LandingPage })));
const PricingPage = lazy(() => import('./pages/marketing/Pricing').then((m) => ({ default: m.PricingPage })));
const AboutPage = lazy(() => import('./pages/marketing/About').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/marketing/Contact').then((m) => ({ default: m.ContactPage })));

const protect = (el: JSX.Element) => <ProtectedRoute>{el}</ProtectedRoute>;

/** Root: the marketing landing page for visitors, the app dashboard for signed-in users. */
function RootRoute() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const token = useAuthStore((s) => s.accessToken);
  if (!hasHydrated) return <Spinner />;
  return token ? <ProtectedRoute><DashboardPage /></ProtectedRoute> : <LandingPage />;
}

export function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          <Route path="/" element={<RootRoute />} />
          <Route path="/employees" element={protect(<EmployeesPage />)} />
          <Route path="/employees/new" element={protect(<EmployeeWizardPage />)} />
          <Route path="/employees/:id" element={protect(<EmployeeWizardPage />)} />
          <Route path="/contacts" element={protect(<ContactsPage />)} />
          <Route path="/integrations" element={protect(<IntegrationsPage />)} />
          <Route path="/leads" element={protect(<LeadsPage />)} />
          <Route path="/campaigns" element={protect(<CampaignsPage />)} />
          <Route path="/campaigns/new" element={protect(<CampaignNewPage />)} />
          <Route path="/campaigns/:id" element={protect(<CampaignDetailPage />)} />
          <Route path="/analytics" element={protect(<AnalyticsPage />)} />
          <Route path="/billing" element={protect(<BillingPage />)} />
          <Route path="/settings" element={protect(<SettingsPage />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
