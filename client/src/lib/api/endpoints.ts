import type {
  AIEmployeeDTO,
  AuthResponse,
  CampaignDTO,
  ComplianceSettingsDTO,
  ConnectorInfo,
  ContactDTO,
  ContactImportResult,
  CreateCampaignInput,
  CreateContactInput,
  CreateEmployeeInput,
  DncEntryDTO,
  InterviewReply,
  KnowledgeItemDTO,
  LeadDTO,
  LoginInput,
  PaymentDTO,
  PaymentOrderDTO,
  RegisterInput,
  ResponsibilityDTO,
  SetResponsibilitiesInput,
  UpdateEmployeeInput,
  UsageSummary,
  UserDTO,
} from '@vorizon/shared';
import { api } from './client';

const unwrap = <T>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);

// ---- auth ----
export const authApi = {
  register: (input: RegisterInput) => unwrap<AuthResponse>(api.post('/auth/register', input)),
  login: (input: LoginInput) => unwrap<AuthResponse>(api.post('/auth/login', input)),
  me: () => unwrap<{ user: AuthResponse['user']; organization: unknown }>(api.get('/auth/me')),
  logout: () => api.post('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, otp, newPassword }),
};

// ---- team / users ----
export const userApi = {
  list: () => unwrap<UserDTO[]>(api.get('/organizations/users')),
  create: (input: { name: string; email: string; role: string; password?: string }) =>
    unwrap<{ user: UserDTO; tempPassword?: string }>(api.post('/organizations/users', input)),
  updateRole: (userId: string, role: string) =>
    unwrap<UserDTO>(api.patch(`/organizations/users/${userId}/role`, { role })),
  remove: (userId: string) => api.delete(`/organizations/users/${userId}`),
};

// ---- employees ----
export const employeeApi = {
  create: (input: CreateEmployeeInput) =>
    unwrap<AIEmployeeDTO>(api.post('/ai-employees', input)),
  list: (params?: { type?: string; status?: string }) =>
    unwrap<{ items: AIEmployeeDTO[]; total: number }>(api.get('/ai-employees', { params })),
  get: (id: string) => unwrap<AIEmployeeDTO>(api.get(`/ai-employees/${id}`)),
  update: (id: string, input: UpdateEmployeeInput) =>
    unwrap<AIEmployeeDTO>(api.patch(`/ai-employees/${id}`, input)),
  remove: (id: string) => api.delete(`/ai-employees/${id}`),
  setPhone: (id: string, businessPhoneNumber: string, escalationNumber: string) =>
    unwrap<AIEmployeeDTO>(
      api.patch(`/ai-employees/${id}/phone`, { businessPhoneNumber, escalationNumber }),
    ),
  setBilling: (id: string, cardType: string, brand: string, last4: string) =>
    unwrap<AIEmployeeDTO>(api.patch(`/ai-employees/${id}/billing`, { cardType, brand, last4 })),
  markTested: (id: string) => unwrap<AIEmployeeDTO>(api.post(`/ai-employees/${id}/mark-tested`)),
  activate: (id: string) => unwrap<AIEmployeeDTO>(api.post(`/ai-employees/${id}/activate`)),
  simulateInbound: (id: string, durationSec = 125) =>
    unwrap<{ callId: string }>(api.post(`/dev/simulate-inbound/${id}`, { durationSec })),
};

// ---- knowledge ----
export const knowledgeApi = {
  list: (employeeId: string) =>
    unwrap<KnowledgeItemDTO[]>(api.get(`/ai-employees/${employeeId}/knowledge`)),
  addText: (employeeId: string, input: { kind: string; title: string; content: string }) =>
    unwrap<KnowledgeItemDTO>(api.post(`/ai-employees/${employeeId}/knowledge`, input)),
  addFile: (employeeId: string, file: File, title?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (title) form.append('title', title);
    return unwrap<KnowledgeItemDTO>(
      api.post(`/ai-employees/${employeeId}/knowledge`, form),
    );
  },
  remove: (employeeId: string, knowledgeId: string) =>
    api.delete(`/ai-employees/${employeeId}/knowledge/${knowledgeId}`),
};

// ---- responsibilities ----
export const responsibilityApi = {
  presets: (employeeId: string) =>
    unwrap<string[]>(api.get(`/ai-employees/${employeeId}/responsibilities/presets`)),
  list: (employeeId: string) =>
    unwrap<ResponsibilityDTO[]>(api.get(`/ai-employees/${employeeId}/responsibilities`)),
  set: (employeeId: string, input: SetResponsibilitiesInput) =>
    unwrap<ResponsibilityDTO[]>(api.put(`/ai-employees/${employeeId}/responsibilities`, input)),
};

// ---- interview ----
export const interviewApi = {
  send: (employeeId: string, message: string, sessionId?: string) =>
    unwrap<InterviewReply>(
      api.post(`/ai-employees/${employeeId}/interview/message`, { message, sessionId }),
    ),
};

// ---- contacts ----
export const contactApi = {
  list: (params?: { validationStatus?: string }) =>
    unwrap<{ items: ContactDTO[]; total: number }>(api.get('/contacts', { params })),
  create: (input: CreateContactInput) => unwrap<ContactDTO>(api.post('/contacts', input)),
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap<ContactImportResult>(api.post('/contacts/upload', form));
  },
  remove: (id: string) => api.delete(`/contacts/${id}`),
};

// ---- campaigns ----
export const campaignApi = {
  list: () => unwrap<CampaignDTO[]>(api.get('/campaigns')),
  get: (id: string) => unwrap<CampaignDTO>(api.get(`/campaigns/${id}`)),
  create: (input: CreateCampaignInput) => unwrap<CampaignDTO>(api.post('/campaigns', input)),
  launch: (id: string) => unwrap<CampaignDTO>(api.post(`/campaigns/${id}/launch`)),
  pause: (id: string) => unwrap<CampaignDTO>(api.post(`/campaigns/${id}/pause`)),
  resume: (id: string) => unwrap<CampaignDTO>(api.post(`/campaigns/${id}/resume`)),
};

// ---- billing & analytics ----
export interface DashboardData {
  kpis: {
    totalCalls: number;
    totalMinutes: number;
    totalUsd: number;
    employees: number;
    activeEmployees: number;
    contacts: number;
    campaigns: number;
    transferredToHuman: number;
  };
  outcomes: { outcome: string; count: number }[];
  byDay: { date: string; minutes: number; usd: number; calls: number }[];
  byEmployee: { aiEmployeeId: string; name: string; minutes: number; usd: number; calls: number }[];
  recentCalls: {
    id: string;
    direction: string;
    from: string;
    to: string;
    durationSec: number;
    outcome: string;
    escalated: boolean;
    startedAt: string;
  }[];
}

export const analyticsApi = {
  dashboard: () => unwrap<DashboardData>(api.get('/analytics/dashboard')),
};

export const billingApi = {
  usage: () => unwrap<UsageSummary>(api.get('/billing/usage')),
  estimate: () => unwrap<{ projectedMonthlyUsd: number }>(api.get('/billing/estimate')),
};

// ---- compliance ----
export const complianceApi = {
  get: () => unwrap<ComplianceSettingsDTO>(api.get('/compliance')),
  acceptConsent: () => unwrap<ComplianceSettingsDTO>(api.post('/compliance/consent', { accepted: true })),
  updateSettings: (recordingDisclosure: { enabled: boolean; message: string }) =>
    unwrap<ComplianceSettingsDTO>(api.patch('/compliance/settings', { recordingDisclosure })),
  listDnc: () => unwrap<{ items: DncEntryDTO[]; total: number }>(api.get('/compliance/dnc')),
  addDnc: (phone: string, note?: string) =>
    unwrap<DncEntryDTO>(api.post('/compliance/dnc', { phone, note })),
  removeDnc: (id: string) => api.delete(`/compliance/dnc/${id}`),
  optOut: (phone: string) => unwrap<DncEntryDTO>(api.post('/compliance/opt-out', { phone })),
};

// ---- integrations / connectors ----
export const integrationApi = {
  list: () =>
    unwrap<{ connectors: ConnectorInfo[]; leadIntakeUrl: string }>(api.get('/integrations')),
  connect: (provider: string) =>
    unwrap<{ authUrl: string }>(api.post(`/integrations/${provider}/connect`)),
  disconnect: (provider: string) => api.delete(`/integrations/${provider}`),
};

// ---- leads ----
export const leadApi = {
  list: (params?: { status?: string }) =>
    unwrap<{ items: LeadDTO[]; total: number }>(api.get('/leads', { params })),
  stats: () => unwrap<Record<string, number>>(api.get('/leads/stats')),
  create: (input: { name: string; phone?: string; email?: string; company?: string }) =>
    unwrap<LeadDTO>(api.post('/leads', input)),
};

// ---- payments (Razorpay) ----
export const paymentApi = {
  createOrder: (amountInr: number) =>
    unwrap<PaymentOrderDTO>(api.post('/payments/order', { amountInr, purpose: 'billing_activation' })),
  verify: (input: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    unwrap<PaymentDTO>(api.post('/payments/verify', input)),
  reportFailed: (razorpayOrderId: string, reason?: string) =>
    unwrap<PaymentDTO>(api.post('/payments/failed', { razorpayOrderId, reason })),
  list: () => unwrap<PaymentDTO[]>(api.get('/payments')),
};
