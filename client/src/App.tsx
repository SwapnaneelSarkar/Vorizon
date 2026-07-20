import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { DashboardPage } from './pages/Dashboard';
import { EmployeesPage } from './pages/employees/EmployeesList';
import { EmployeeWizardPage } from './pages/employees/EmployeeWizard';
import { ContactsPage } from './pages/Contacts';
import { CampaignsPage } from './pages/campaigns/CampaignsList';
import { CampaignNewPage } from './pages/campaigns/CampaignNew';
import { AnalyticsPage } from './pages/Analytics';
import { BillingPage } from './pages/Billing';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
      <Route path="/employees/new" element={<ProtectedRoute><EmployeeWizardPage /></ProtectedRoute>} />
      <Route path="/employees/:id" element={<ProtectedRoute><EmployeeWizardPage /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
      <Route path="/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
      <Route path="/campaigns/new" element={<ProtectedRoute><CampaignNewPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
