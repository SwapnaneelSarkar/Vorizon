import type { HydratedDocument } from 'mongoose';
import type { CampaignDTO, CreateCampaignInput } from '@vorizon/shared';
import { Campaign, type CampaignDoc } from '../../models/Campaign.js';
import { Contact } from '../../models/Contact.js';
import { ApiError } from '../../utils/apiError.js';
import { loadEmployee, refreshStatus } from '../aiEmployees/aiEmployees.service.js';
import { campaignQueue } from './campaignQueue.js';

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

/**
 * Launch a campaign. Validates prerequisites, assigns valid contacts, marks the
 * campaign running, and hands execution to the (non-blocking) campaign queue so
 * the request returns immediately. Clients poll GET /campaigns/:id for progress.
 */
export async function launchCampaign(orgId: string, id: string): Promise<CampaignDTO> {
  const campaign = await loadCampaign(orgId, id);
  if (campaign.status === 'running') {
    throw ApiError.conflict('Campaign is already running');
  }
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

  const total = await Contact.countDocuments({
    organizationId: orgId,
    campaignId: campaign._id,
    validationStatus: 'valid',
  });
  if (total === 0) {
    throw ApiError.precondition('Cannot launch campaign', ['Upload at least one valid contact']);
  }

  campaign.status = 'running';
  campaign.stats = {
    total,
    attempted: 0,
    connected: 0,
    failed: 0,
  } as CampaignRecord['stats'];
  await campaign.save();

  campaignQueue.enqueue(orgId, id);
  return toDTO(campaign);
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
