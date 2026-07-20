import type {
  AIEmployeeDTO,
  AuthResponse,
  CampaignDTO,
  ContactDTO,
  ContactImportResult,
  CreateCampaignInput,
  CreateContactInput,
  CreateEmployeeInput,
  InterviewReply,
  KnowledgeItemDTO,
  LoginInput,
  RegisterInput,
  ResponsibilityDTO,
  SetResponsibilitiesInput,
  UpdateEmployeeInput,
  UsageSummary,
} from '@vorizon/shared';
import { api } from './client';

const unwrap = <T>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);

// ---- auth ----
export const authApi = {
  register: (input: RegisterInput) => unwrap<AuthResponse>(api.post('/auth/register', input)),
  login: (input: LoginInput) => unwrap<AuthResponse>(api.post('/auth/login', input)),
  me: () => unwrap<{ user: AuthResponse['user']; organization: unknown }>(api.get('/auth/me')),
  logout: () => api.post('/auth/logout'),
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
  setBilling: (id: string, brand: string, last4: string) =>
    unwrap<AIEmployeeDTO>(api.patch(`/ai-employees/${id}/billing`, { brand, last4 })),
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
