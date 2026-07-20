import type { EmployeeStatus, EmployeeType } from '@vorizon/shared';

/**
 * Snapshot of everything the lifecycle needs to decide an employee's status
 * and whether it can be activated. Kept pure so it is trivially unit-testable.
 */
export interface LifecycleSnapshot {
  type: EmployeeType;
  knowledgeCount: number;
  enabledResponsibilityCount: number;
  hasPhoneConfig: boolean; // business + escalation numbers
  billingConfigured: boolean;
  tested: boolean;
  validContactCount: number;
  hasCampaign: boolean;
  activated: boolean;
}

type Gate = { key: EmployeeStatus; complete: (s: LifecycleSnapshot) => boolean; label: string };

const COMMON_BEFORE_BILLING: Gate[] = [
  {
    key: 'knowledge_added',
    label: 'Add at least one company knowledge item',
    complete: (s) => s.knowledgeCount >= 1,
  },
  {
    key: 'responsibilities_set',
    label: 'Enable at least one responsibility',
    complete: (s) => s.enabledResponsibilityCount >= 1,
  },
];

const PHONE_GATE: Gate = {
  key: 'phone_configured',
  label: 'Set business phone number and human escalation number',
  complete: (s) => s.hasPhoneConfig,
};

const BILLING_GATE: Gate = {
  key: 'billing_added',
  label: 'Add a billing payment method',
  complete: (s) => s.billingConfigured,
};

const TESTED_GATE: Gate = {
  key: 'tested',
  label: 'Complete AI interview and mark as tested',
  complete: (s) => s.tested,
};

const CONTACTS_GATE: Gate = {
  key: 'contacts_uploaded',
  label: 'Upload at least one valid contact',
  complete: (s) => s.validContactCount >= 1,
};

const CAMPAIGN_GATE: Gate = {
  key: 'campaign_created',
  label: 'Create a campaign for this employee',
  complete: (s) => s.hasCampaign,
};

/** Ordered gates (excluding draft/active) for the given employee type. */
export function gatesFor(type: EmployeeType): Gate[] {
  if (type === 'inbound') {
    return [...COMMON_BEFORE_BILLING, PHONE_GATE, BILLING_GATE, TESTED_GATE];
  }
  return [...COMMON_BEFORE_BILLING, BILLING_GATE, TESTED_GATE, CONTACTS_GATE, CAMPAIGN_GATE];
}

/** Furthest consecutively-completed step, or 'active' when activated. */
export function deriveStatus(s: LifecycleSnapshot): EmployeeStatus {
  if (s.activated) return 'active';
  const gates = gatesFor(s.type);
  let status: EmployeeStatus = 'draft';
  for (const gate of gates) {
    if (gate.complete(s)) status = gate.key;
    else break;
  }
  return status;
}

/** Human-readable list of what still blocks activation. Empty => ready. */
export function missingForActivation(s: LifecycleSnapshot): string[] {
  return gatesFor(s.type)
    .filter((gate) => !gate.complete(s))
    .map((gate) => gate.label);
}

export function canActivate(s: LifecycleSnapshot): boolean {
  return missingForActivation(s).length === 0;
}
