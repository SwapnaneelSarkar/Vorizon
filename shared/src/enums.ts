export const EMPLOYEE_TYPES = ['inbound', 'outbound'] as const;
export type EmployeeType = (typeof EMPLOYEE_TYPES)[number];

export const EMPLOYEE_STATUSES = [
  'draft',
  'knowledge_added',
  'responsibilities_set',
  'phone_configured',
  'billing_added',
  'tested',
  'contacts_uploaded',
  'campaign_created',
  'active',
] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const ROLES = ['owner', 'admin', 'member'] as const;
export type Role = (typeof ROLES)[number];

export const KNOWLEDGE_KINDS = [
  'description',
  'product',
  'service',
  'pricing',
  'faq',
  'policy',
  'file',
  'url',
  'note',
] as const;
export type KnowledgeKind = (typeof KNOWLEDGE_KINDS)[number];

export const RESPONSIBILITY_KINDS = ['preset', 'custom'] as const;
export type ResponsibilityKind = (typeof RESPONSIBILITY_KINDS)[number];

export const CALL_DIRECTIONS = ['inbound', 'outbound'] as const;
export type CallDirection = (typeof CALL_DIRECTIONS)[number];

export const CALL_OUTCOMES = ['completed', 'transferred', 'no_answer', 'failed'] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export const CAMPAIGN_STATUSES = ['draft', 'running', 'paused', 'completed'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const VALIDATION_STATUSES = ['valid', 'invalid', 'pending'] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export const BILLING_STATUSES = ['inactive', 'active', 'past_due'] as const;
export type BillingStatus = (typeof BILLING_STATUSES)[number];

export const DNC_REASONS = ['manual', 'opt_out'] as const;
export type DncReason = (typeof DNC_REASONS)[number];

export const PAYMENT_STATUSES = ['created', 'paid', 'failed'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** External platforms Vorizon connects to (the integration catalog). */
export const CONNECTOR_PROVIDERS = [
  'google_ads',
  'meta_ads',
  'whatsapp',
  'instagram',
  'facebook_pages',
  'gmail',
  'google_calendar',
  'hubspot',
  'salesforce',
  'zoho',
  'twilio',
  'stripe',
] as const;
export type ConnectorProvider = (typeof CONNECTOR_PROVIDERS)[number];

export const CONNECTION_STATUSES = ['connected', 'disconnected', 'error', 'expired'] as const;
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

/** Lead lifecycle across the closed loop (ad → qualify → call → deal). */
export const LEAD_STATUSES = [
  'new',
  'qualifying',
  'qualified',
  'unqualified',
  'contacted',
  'converted',
  'lost',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Preset responsibilities from the requirement doc. */
export const RESPONSIBILITY_PRESETS = [
  'Answer customer questions',
  'Book appointments',
  'Generate leads',
  'Qualify customers',
  'Collect customer information',
  'Explain products',
  'Transfer important calls',
  'Schedule callbacks',
  'Answer FAQs',
  'Record customer complaints',
  'Never provide discounts without approval',
  'Escalate angry customers',
  'End every call professionally',
] as const;
