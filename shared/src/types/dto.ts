import type {
  BillingStatus,
  CallDirection,
  CallOutcome,
  CampaignStatus,
  ConnectionStatus,
  ConnectorProvider,
  DncReason,
  EmployeeStatus,
  EmployeeType,
  KnowledgeKind,
  LeadStatus,
  PaymentStatus,
  PlanType,
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
  plan?: PlanType;
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
  /** Set once an inbound employee is bound to a real voice provider's assistant/agent at activation. */
  assistantExternalId?: string;
  /** The voice provider this employee was activated against ('mock' before real telephony is connected). */
  voiceProvider?: string;
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

export interface CallTranscriptTurn {
  role: 'ai' | 'customer';
  text: string;
  at: string;
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
  campaignId?: string;
  contactId?: string;
  contactName?: string;
  transcript: CallTranscriptTurn[];
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

export interface WalletDTO {
  balanceUsd: number;
  active: boolean;
  low: boolean;
  lowThresholdUsd: number;
  transactions: {
    id: string;
    type: 'credit' | 'debit';
    amountUsd: number;
    balanceAfterUsd: number;
    reason: string;
    createdAt: string;
  }[];
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

/** A connector in the catalog, with this org's live connection status. */
export interface ConnectorInfo {
  provider: ConnectorProvider;
  name: string;
  category: 'ads' | 'messaging' | 'crm' | 'calendar' | 'payments' | 'telephony';
  description: string;
  /** False when the server lacks the OAuth app credentials for this provider. */
  configured: boolean;
  connection?: ConnectionDTO;
}

export interface ConnectionDTO {
  id: string;
  provider: ConnectorProvider;
  status: ConnectionStatus;
  accountLabel?: string;
  connectedAt?: string;
  lastError?: string;
}

export interface LeadDTO {
  id: string;
  source: ConnectorProvider | 'manual' | 'webhook';
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  campaignId?: string;
  status: LeadStatus;
  score?: number;
  aiSummary?: string;
  createdAt: string;
}

export interface ApiError {
  /** requestId correlates the response with its server log lines. */
  error: { code: string; message: string; details?: unknown; requestId?: string };
}
