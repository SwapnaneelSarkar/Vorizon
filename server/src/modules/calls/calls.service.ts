import type { HydratedDocument } from 'mongoose';
import type { CallDTO } from '@vorizon/shared';
import { Call, type CallDoc } from '../../models/Call.js';
import { Contact } from '../../models/Contact.js';
import { Campaign } from '../../models/Campaign.js';
import { ApiError } from '../../utils/apiError.js';

type CallRecord = HydratedDocument<CallDoc>;

function toDTO(c: CallRecord, contactName?: string): CallDTO {
  return {
    id: String(c._id),
    aiEmployeeId: String(c.aiEmployeeId),
    direction: c.direction,
    from: c.from,
    to: c.to,
    durationSec: c.durationSec,
    outcome: c.outcome,
    escalated: c.escalated,
    provider: c.provider ?? 'mock',
    startedAt: c.startedAt?.toISOString() ?? '',
    endedAt: c.endedAt ? c.endedAt.toISOString() : undefined,
    campaignId: c.campaignId ? String(c.campaignId) : undefined,
    contactId: c.contactId ? String(c.contactId) : undefined,
    contactName,
    transcript: (c.transcript ?? []).map((t) => ({
      role: t.role,
      text: t.text,
      at: t.at ? new Date(t.at).toISOString() : '',
    })),
  };
}

/** All calls placed for a campaign, newest first, with the contact's name joined in. */
export async function listCallsForCampaign(orgId: string, campaignId: string): Promise<CallDTO[]> {
  const campaign = await Campaign.findOne({ _id: campaignId, organizationId: orgId });
  if (!campaign) throw ApiError.notFound('Campaign not found');

  const calls = (await Call.find({ organizationId: orgId, campaignId }).sort({
    createdAt: -1,
  })) as CallRecord[];

  const contactIds = [...new Set(calls.map((c) => c.contactId).filter(Boolean))];
  const contacts = await Contact.find({ _id: { $in: contactIds } }).select('name');
  const nameById = new Map(contacts.map((c) => [String(c._id), c.name]));

  return calls.map((c) => toDTO(c, c.contactId ? nameById.get(String(c.contactId)) : undefined));
}

/** A single call's full detail, including transcript. */
export async function getCall(orgId: string, id: string): Promise<CallDTO> {
  const call = (await Call.findOne({ _id: id, organizationId: orgId })) as CallRecord | null;
  if (!call) throw ApiError.notFound('Call not found');

  const contactName = call.contactId
    ? ((await Contact.findById(call.contactId).select('name'))?.name ?? undefined)
    : undefined;

  return toDTO(call, contactName);
}
