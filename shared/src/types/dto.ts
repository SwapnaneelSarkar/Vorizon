import type {
  BillingStatus,
  CallDirection,
  CallOutcome,
  CampaignStatus,
  DncReason,
  EmployeeStatus,
  EmployeeType,
  KnowledgeKind,
  PaymentStatus,
  ResponsibilityKind,
  Role,
  ValidationStatus,
} from '../enums.js';
import type { WorkingHours } from '../schemas/common.js';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
}

export interface OrganizationDTO {
  id: string;
  name: string;
  billingStatus: BillingStatus;
  paymentMethod?: { cardType: string; brand: string; last4: string; addedAt: string };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserDTO;
  tokens: AuthTokens;
}

export interface AIEmployeeDTO {
  id: string;
  organizationId: string;
  type: EmployeeType;
  name: string;
  department: string;
  language: string;
  voice: string;
  workingHours: WorkingHours;
  status: EmployeeStatus;
  businessPhoneNumber?: string;
  escalationNumber?: string;
  tone?: string;
  behavior?: string;
  rules: string[];
  tested: boolean;
  activatedAt?: string;
  knowledgeCount?: number;
  responsibilityCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeItemDTO {
  id: string;
  aiEmployeeId: string;
  kind: KnowledgeKind;
  title: string;
  content?: string;
  sourceFile?: { originalName: string; mime: string; sizeBytes: number };
  parsedTextPreview?: string;
  createdAt: string;
}

export interface ResponsibilityDTO {
  id: string;
  label: string;
  kind: ResponsibilityKind;
  enabled: boolean;
}

export interface ContactDTO {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  tags: string[];
  notes?: string;
  campaignId?: string;
  validationStatus: ValidationStatus;
  optedOut?: boolean;
  createdAt: string;
}

export interface ContactImportResult {
  imported: number;
  invalid: { row: number; reason: string; value?: string }[];
}

export interface CampaignDTO {
  id: string;
  name: string;
  aiEmployeeId: string;
  status: CampaignStatus;
  retryAttempts: number;
  retryInterval: number;
  dailyCallLimit: number;
  workingHours: WorkingHours;
  stats: { total: number; attempted: number; connected: number; failed: number };
  createdAt: string;
}

export interface CallDTO {
  id: string;
  aiEmployeeId: string;
  direction: CallDirection;
  from: string;
  to: string;
  durationSec: number;
  outcome: CallOutcome;
  escalated: boolean;
  provider: string;
  startedAt: string;
  endedAt?: string;
}

export interface UsageSummary {
  totalCalls: number;
  totalMinutes: number;
  totalUsd: number;
  rateUsd: number;
  byDay: { date: string; minutes: number; usd: number; calls: number }[];
  byEmployee: { aiEmployeeId: string; name: string; minutes: number; usd: number; calls: number }[];
  outcomes: { outcome: CallOutcome; count: number }[];
}

export interface InterviewReply {
  sessionId: string;
  reply: string;
}

export interface ComplianceSettingsDTO {
  callingConsent: {
    accepted: boolean;
    acceptedAt?: string;
    acceptedByUserId?: string;
    ip?: string;
  };
  recordingDisclosure: { enabled: boolean; message: string };
  dncCount: number;
}

export interface DncEntryDTO {
  id: string;
  phone: string;
  reason: DncReason;
  note?: string;
  createdAt: string;
}

export interface PaymentDTO {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  purpose: string;
  failureReason?: string;
  createdAt: string;
  paidAt?: string;
}

/** Everything Razorpay Checkout needs on the client; the key secret never leaves the server. */
export interface PaymentOrderDTO {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface ApiError {
  /** requestId correlates the response with its server log lines. */
  error: { code: string; message: string; details?: unknown; requestId?: string };
}
