import type { CampaignDTO, CallOutcome, CreateCampaignInput } from '@vorizon/shared';
import type { HydratedDocument } from 'mongoose';
import { Campaign, type CampaignDoc } from '../../models/Campaign.js';
import { Contact } from '../../models/Contact.js';
import { ApiError } from '../../utils/apiError.js';
import { handleCallEnded } from '../../voice/handleCallEvent.js';
import { loadEmployee, refreshStatus } from '../aiEmployees/aiEmployees.service.js';

type CampaignRecord = HydratedDocument<CampaignDoc>;

function toDTO(c: CampaignRecord): CampaignDTO {
  return {
    id: String(c._id),
    name: c.name,
    aiEmployeeId: String(c.aiEmployeeId),
    status: c.status,
    retryAttempts: c.retryAttempts,
    retryInterval: c.retryInterval,
    dailyCallLimit: c.dailyCallLimit,
    workingHours: {
      tz: c.callingSchedule?.tz ?? 'UTC',
      days: c.callingSchedule?.days ?? [1, 2, 3, 4, 5],
      start: c.callingSchedule?.start ?? '09:00',
      end: c.callingSchedule?.end ?? '17:00',
    },
    stats: {
      total: c.stats?.total ?? 0,
      attempted: c.stats?.attempted ?? 0,
      connected: c.stats?.connected ?? 0,
      failed: c.stats?.failed ?? 0,
    },
    createdAt: (c as unknown as { createdAt: Date }).createdAt.toISOString(),
  };
}

export async function createCampaign(
  orgId: string,
  input: CreateCampaignInput,
): Promise<CampaignDTO> {
  const employee = await loadEmployee(orgId, input.aiEmployeeId);
  if (employee.type !== 'outbound') {
    throw ApiError.badRequest('Campaigns require an outbound AI employee');
  }
  const campaign = (await Campaign.create({
    organizationId: orgId,
    aiEmployeeId: employee._id,
    name: input.name,
    callingSchedule: input.callingSchedule,
    retryAttempts: input.retryAttempts,
    retryInterval: input.retryInterval,
    dailyCallLimit: input.dailyCallLimit,
    status: 'draft',
  })) as CampaignRecord;
  await refreshStatus(employee);
  return toDTO(campaign);
}

export async function listCampaigns(orgId: string): Promise<CampaignDTO[]> {
  const items = await Campaign.find({ organizationId: orgId }).sort({ createdAt: -1 });
  return items.map((c) => toDTO(c as CampaignRecord));
}

export async function getCampaign(orgId: string, id: string): Promise<CampaignDTO> {
  const campaign = await Campaign.findOne({ _id: id, organizationId: orgId });
  if (!campaign) throw ApiError.notFound('Campaign not found');
  return toDTO(campaign as CampaignRecord);
}

async function loadCampaign(orgId: string, id: string): Promise<CampaignRecord> {
  const campaign = await Campaign.findOne({ _id: id, organizationId: orgId });
  if (!campaign) throw ApiError.notFound('Campaign not found');
  return campaign as CampaignRecord;
}

/** Deterministic mock outcome so runs are reproducible (no Math.random). */
function mockOutcome(i: number): { outcome: CallOutcome; durationSec: number; escalated: boolean } {
  const cycle = i % 5;
  if (cycle === 3) return { outcome: 'no_answer', durationSec: 0, escalated: false };
  if (cycle === 4) return { outcome: 'failed', durationSec: 0, escalated: false };
  if (cycle === 2) return { outcome: 'transferred', durationSec: 90 + ((i * 7) % 120), escalated: true };
  return { outcome: 'completed', durationSec: 60 + ((i * 13) % 180), escalated: false };
}

/**
 * Launch a campaign. Assigns valid org contacts, then synchronously simulates
 * calls up to the daily limit (Phase 1). Each simulated call flows through the
 * shared metering pipeline, producing Call + UsageRecord records.
 */
export async function launchCampaign(orgId: string, id: string): Promise<CampaignDTO> {
  const campaign = await loadCampaign(orgId, id);
  const employee = await loadEmployee(orgId, String(campaign.aiEmployeeId));
  if (!employee.tested) {
    throw ApiError.precondition('Cannot launch campaign', [
      'Complete AI interview and mark as tested',
    ]);
  }

  // Assign unassigned valid contacts to this campaign.
  await Contact.updateMany(
    { organizationId: orgId, validationStatus: 'valid', campaignId: null },
    { campaignId: campaign._id },
  );

  const contacts = await Contact.find({
    organizationId: orgId,
    campaignId: campaign._id,
    validationStatus: 'valid',
  });
  if (contacts.length === 0) {
    throw ApiError.precondition('Cannot launch campaign', ['Upload at least one valid contact']);
  }

  campaign.status = 'running';
  campaign.stats = {
    total: contacts.length,
    attempted: 0,
    connected: 0,
    failed: 0,
  } as CampaignRecord['stats'];
  await campaign.save();

  const toCall = contacts.slice(0, campaign.dailyCallLimit);
  for (let i = 0; i < toCall.length; i++) {
    const contact = toCall[i];
    const { outcome, durationSec, escalated } = mockOutcome(i);
    await handleCallEnded({
      externalCallId: `mock-outbound-${String(campaign._id)}-${i}`,
      status: 'ended',
      direction: 'outbound',
      organizationId: orgId,
      aiEmployeeId: String(employee._id),
      from: '+18005550100',
      to: contact.phone,
      contactId: String(contact._id),
      campaignId: String(campaign._id),
      durationSec,
      outcome,
      escalated,
    });
  }

  // Mark completed if everyone eligible was called this run.
  const fresh = await loadCampaign(orgId, id);
  if ((fresh.stats?.attempted ?? 0) >= (fresh.stats?.total ?? 0)) {
    fresh.status = 'completed';
    await fresh.save();
  }
  return toDTO(fresh);
}

export async function pauseCampaign(orgId: string, id: string): Promise<CampaignDTO> {
  const campaign = await loadCampaign(orgId, id);
  if (campaign.status === 'running') campaign.status = 'paused';
  await campaign.save();
  return toDTO(campaign);
}

export async function resumeCampaign(orgId: string, id: string): Promise<CampaignDTO> {
  const campaign = await loadCampaign(orgId, id);
  if (campaign.status === 'paused') campaign.status = 'running';
  await campaign.save();
  return toDTO(campaign);
}
