import type { ComplianceSettingsDTO, DncEntryDTO, DncReason } from '@vorizon/shared';
import { Contact } from '../../models/Contact.js';
import { DncEntry, type DncEntryDoc } from '../../models/DncEntry.js';
import { Organization, type OrganizationDoc } from '../../models/Organization.js';
import { ApiError } from '../../utils/apiError.js';
import { recordAudit } from '../../utils/audit.js';
import { logger } from '../../utils/logger.js';
import { toE164 } from '../../utils/phone.js';

type DncRecord = DncEntryDoc & { _id: unknown; createdAt?: Date };

const DEFAULT_DISCLOSURE = 'This call may be recorded for quality and training purposes.';

function toDncDTO(e: DncRecord): DncEntryDTO {
  return {
    id: String(e._id),
    phone: e.phone,
    reason: e.reason,
    note: e.note || undefined,
    createdAt: e.createdAt?.toISOString() ?? '',
  };
}

async function loadOrg(orgId: string): Promise<OrganizationDoc & { _id: unknown }> {
  const org = await Organization.findById(orgId);
  if (!org) throw ApiError.notFound('Organization not found');
  return org;
}

export async function getComplianceSettings(orgId: string): Promise<ComplianceSettingsDTO> {
  const org = await loadOrg(orgId);
  const dncCount = await DncEntry.countDocuments({ organizationId: orgId });
  return {
    callingConsent: {
      accepted: org.callingConsent?.accepted ?? false,
      acceptedAt: org.callingConsent?.acceptedAt?.toISOString(),
      acceptedByUserId: org.callingConsent?.acceptedByUserId
        ? String(org.callingConsent.acceptedByUserId)
        : undefined,
      ip: org.callingConsent?.ip ?? undefined,
    },
    recordingDisclosure: {
      enabled: org.compliance?.recordingDisclosure?.enabled ?? false,
      message: org.compliance?.recordingDisclosure?.message || DEFAULT_DISCLOSURE,
    },
    dncCount,
  };
}

/** Record explicit AI-calling consent with timestamp and requester IP (TCPA audit trail). */
export async function recordConsent(
  orgId: string,
  userId: string,
  ip: string | undefined,
): Promise<ComplianceSettingsDTO> {
  await Organization.updateOne(
    { _id: orgId },
    {
      callingConsent: {
        accepted: true,
        acceptedAt: new Date(),
        acceptedByUserId: userId,
        ip: ip ?? '',
      },
    },
  );
  await recordAudit({
    organizationId: orgId,
    actorUserId: userId,
    action: 'compliance.consent_accepted',
    targetType: 'Organization',
    targetId: orgId,
    metadata: { ip: ip ?? '' },
  });
  return getComplianceSettings(orgId);
}

export async function updateComplianceSettings(
  orgId: string,
  userId: string,
  input: { recordingDisclosure: { enabled: boolean; message: string } },
): Promise<ComplianceSettingsDTO> {
  await Organization.updateOne(
    { _id: orgId },
    { compliance: { recordingDisclosure: input.recordingDisclosure } },
  );
  await recordAudit({
    organizationId: orgId,
    actorUserId: userId,
    action: 'compliance.settings_updated',
    targetType: 'Organization',
    targetId: orgId,
    metadata: { recordingDisclosureEnabled: input.recordingDisclosure.enabled },
  });
  return getComplianceSettings(orgId);
}

export async function listDnc(
  orgId: string,
  opts: { page?: number; limit?: number } = {},
): Promise<{ items: DncEntryDTO[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const [items, total] = await Promise.all([
    DncEntry.find({ organizationId: orgId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    DncEntry.countDocuments({ organizationId: orgId }),
  ]);
  return { items: items.map((e) => toDncDTO(e as DncRecord)), total };
}

export async function addToDnc(
  orgId: string,
  rawPhone: string,
  reason: DncReason,
  opts: { userId?: string; note?: string } = {},
): Promise<DncEntryDTO> {
  const phone = toE164(rawPhone);
  if (!phone) throw ApiError.badRequest('Invalid phone number');

  // Upsert: adding an existing number is idempotent (opt_out wins over manual).
  const entry = (await DncEntry.findOneAndUpdate(
    { organizationId: orgId, phone },
    {
      $setOnInsert: { organizationId: orgId, phone, addedByUserId: opts.userId ?? null },
      $set: { ...(opts.note ? { note: opts.note } : {}), reason },
    },
    { new: true, upsert: true },
  )) as DncRecord;

  await recordAudit({
    organizationId: orgId,
    actorUserId: opts.userId,
    action: 'compliance.dnc_added',
    targetType: 'DncEntry',
    targetId: String(entry._id),
    metadata: { phone, reason },
  });
  return toDncDTO(entry);
}

export async function removeFromDnc(orgId: string, entryId: string, userId: string): Promise<void> {
  const entry = await DncEntry.findOne({ _id: entryId, organizationId: orgId });
  if (!entry) throw ApiError.notFound('DNC entry not found');
  await entry.deleteOne();
  await recordAudit({
    organizationId: orgId,
    actorUserId: userId,
    action: 'compliance.dnc_removed',
    targetType: 'DncEntry',
    targetId: entryId,
    metadata: { phone: entry.phone },
  });
}

/**
 * Opt a phone number out of all future AI calls: adds it to the DNC list and
 * flags every matching contact. Used by the API and by voice-provider webhooks.
 */
export async function optOutPhone(
  orgId: string,
  rawPhone: string,
  opts: { userId?: string; source?: string } = {},
): Promise<DncEntryDTO> {
  const entry = await addToDnc(orgId, rawPhone, 'opt_out', {
    userId: opts.userId,
    note: opts.source ? `Opted out via ${opts.source}` : 'Opted out',
  });
  await Contact.updateMany(
    { organizationId: orgId, phone: entry.phone, optedOut: { $ne: true } },
    { optedOut: true, optedOutAt: new Date() },
  );
  return entry;
}

export async function isOnDnc(orgId: string, phone: string): Promise<boolean> {
  const hit = await DncEntry.exists({ organizationId: orgId, phone });
  return Boolean(hit);
}

/** True when the org has recorded explicit consent to run AI calls. */
export async function hasCallingConsent(orgId: string): Promise<boolean> {
  const org = await Organization.findById(orgId).select('callingConsent');
  return Boolean(org?.callingConsent?.accepted);
}

/** Recording disclosure text to play/announce at call start, or null when disabled. */
export async function getRecordingDisclosure(orgId: string): Promise<string | null> {
  const org = await Organization.findById(orgId).select('compliance');
  if (!org?.compliance?.recordingDisclosure?.enabled) return null;
  return org.compliance.recordingDisclosure.message || DEFAULT_DISCLOSURE;
}

/**
 * Single pre-dial gate used by the campaign runner: consent, DNC, and opt-out.
 * Returns null when calling is allowed, otherwise the reason it is blocked.
 */
export async function callBlockReason(
  orgId: string,
  contact: { phone: string; optedOut?: boolean | null },
): Promise<string | null> {
  if (contact.optedOut) return 'opted_out';
  if (await isOnDnc(orgId, contact.phone)) return 'dnc';
  return null;
}

/** Log-and-skip helper so every skipped dial leaves an audit trace. */
export async function recordSkippedCall(
  orgId: string,
  campaignId: string,
  phone: string,
  reason: string,
): Promise<void> {
  logger.info({ orgId, campaignId, phone, reason }, 'Call skipped for compliance');
  await recordAudit({
    organizationId: orgId,
    action: 'compliance.call_skipped',
    targetType: 'Campaign',
    targetId: campaignId,
    metadata: { phone, reason },
  });
}
