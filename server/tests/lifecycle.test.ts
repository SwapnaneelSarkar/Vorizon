import { describe, expect, it } from 'vitest';
import {
  canActivate,
  deriveStatus,
  missingForActivation,
  type LifecycleSnapshot,
} from '../src/modules/aiEmployees/lifecycle.js';

const base: LifecycleSnapshot = {
  type: 'inbound',
  knowledgeCount: 0,
  enabledResponsibilityCount: 0,
  hasPhoneConfig: false,
  billingConfigured: false,
  tested: false,
  validContactCount: 0,
  hasCampaign: false,
  activated: false,
};

describe('lifecycle (inbound)', () => {
  it('starts at draft', () => {
    expect(deriveStatus(base)).toBe('draft');
    expect(canActivate(base)).toBe(false);
  });

  it('advances through steps in order', () => {
    const s = { ...base, knowledgeCount: 1 };
    expect(deriveStatus(s)).toBe('knowledge_added');
    expect(deriveStatus({ ...s, enabledResponsibilityCount: 1 })).toBe('responsibilities_set');
    expect(
      deriveStatus({ ...s, enabledResponsibilityCount: 1, hasPhoneConfig: true }),
    ).toBe('phone_configured');
  });

  it('cannot activate until tested + all gates', () => {
    const ready: LifecycleSnapshot = {
      ...base,
      knowledgeCount: 1,
      enabledResponsibilityCount: 1,
      hasPhoneConfig: true,
      billingConfigured: true,
      tested: false,
    };
    expect(canActivate(ready)).toBe(false);
    expect(missingForActivation(ready)).toContain('Complete AI interview and mark as tested');
    expect(canActivate({ ...ready, tested: true })).toBe(true);
  });
});

describe('lifecycle (outbound)', () => {
  it('requires contacts + campaign, not phone', () => {
    const s: LifecycleSnapshot = {
      ...base,
      type: 'outbound',
      knowledgeCount: 1,
      enabledResponsibilityCount: 1,
      billingConfigured: true,
      tested: true,
      validContactCount: 0,
      hasCampaign: false,
    };
    expect(canActivate(s)).toBe(false);
    expect(missingForActivation(s)).toEqual([
      'Upload at least one valid contact',
      'Create a campaign for this employee',
    ]);
    expect(canActivate({ ...s, validContactCount: 5, hasCampaign: true })).toBe(true);
  });
});
