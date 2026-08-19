import type {
  AIEmployeeDTO,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from '@vorizon/shared';
import type { HydratedDocument } from 'mongoose';
import { AIEmployee, type AIEmployeeDoc } from '../../models/AIEmployee.js';
import { Organization } from '../../models/Organization.js';
import { KnowledgeItem } from '../../models/KnowledgeItem.js';
import { Responsibility } from '../../models/Responsibility.js';
import { Contact } from '../../models/Contact.js';
import { Campaign } from '../../models/Campaign.js';
import { ApiError } from '../../utils/apiError.js';
import { toE164 } from '../../utils/phone.js';
import { logger } from '../../utils/logger.js';
import { getVoiceEngine } from '../../voice/index.js';
import {
  canActivate,
  deriveStatus,
  missingForActivation,
  type LifecycleSnapshot,
} from './lifecycle.js';

type EmployeeRecord = HydratedDocument<AIEmployeeDoc>;

export function toEmployeeDTO(
  e: EmployeeRecord,
  counts?: { knowledgeCount?: number; responsibilityCount?: number },
): AIEmployeeDTO {
  return {
    id: String(e._id),
    organizationId: String(e.organizationId),
    type: e.type,
    name: e.name,
    department: e.department ?? '',
    language: e.language ?? 'en-US',
    voice: e.voice ?? 'default',
    workingHours: {
      tz: e.workingHours?.tz ?? 'UTC',
      days: e.workingHours?.days ?? [1, 2, 3, 4, 5],
      start: e.workingHours?.start ?? '09:00',
      end: e.workingHours?.end ?? '17:00',
    },
    status: e.status,
    businessPhoneNumber: e.businessPhoneNumber ?? undefined,
    escalationNumber: e.escalationNumber ?? undefined,
    tone: e.tone ?? '',
    behavior: e.behavior ?? '',
    rules: e.rules ?? [],
    tested: e.tested,
    activatedAt: e.activatedAt ? e.activatedAt.toISOString() : undefined,
    assistantExternalId: e.assistantExternalId ?? undefined,
    voiceProvider: e.voiceProvider ?? undefined,
    knowledgeCount: counts?.knowledgeCount,
    responsibilityCount: counts?.responsibilityCount,
    createdAt: (e as unknown as { createdAt: Date }).createdAt.toISOString(),
    updatedAt: (e as unknown as { updatedAt: Date }).updatedAt.toISOString(),
  };
}

export async function loadEmployee(orgId: string, id: string): Promise<EmployeeRecord> {
  const employee = await AIEmployee.findOne({ _id: id, organizationId: orgId });
  if (!employee) throw ApiError.notFound('AI employee not found');
  return employee as EmployeeRecord;
}

export async function buildSnapshot(employee: EmployeeRecord): Promise<LifecycleSnapshot> {
  const [knowledgeCount, enabledResponsibilityCount, validContactCount, campaignCount] =
    await Promise.all([
      KnowledgeItem.countDocuments({ aiEmployeeId: employee._id }),
      Responsibility.countDocuments({ aiEmployeeId: employee._id, enabled: true }),
      Contact.countDocuments({
        organizationId: employee.organizationId,
        validationStatus: 'valid',
      }),
      Campaign.countDocuments({ aiEmployeeId: employee._id }),
    ]);

  return {
    type: employee.type,
    knowledgeCount,
    enabledResponsibilityCount,
    hasPhoneConfig: Boolean(employee.businessPhoneNumber && employee.escalationNumber),
    billingConfigured: employee.billingConfigured,
    tested: employee.tested,
    validContactCount,
    hasCampaign: campaignCount > 0,
    activated: Boolean(employee.activatedAt),
  };
}

/** Recompute and persist the derived status (never downgrades an activated employee). */
export async function refreshStatus(employee: EmployeeRecord): Promise<EmployeeRecord> {
  const snapshot = await buildSnapshot(employee);
  const status = deriveStatus(snapshot);
  if (status !== employee.status) {
    employee.status = status;
    await employee.save();
  }
  return employee;
}

export async function createEmployee(
  orgId: string,
  input: CreateEmployeeInput,
): Promise<AIEmployeeDTO> {
  const employee = (await AIEmployee.create({
    organizationId: orgId,
    type: input.type,
    name: input.name,
    department: input.department,
    language: input.language,
    voice: input.voice,
    workingHours: input.workingHours,
    status: 'draft',
  })) as EmployeeRecord;
  return toEmployeeDTO(employee);
}

export async function listEmployees(
  orgId: string,
  filter: { type?: string; status?: string; page: number; limit: number },
) {
  const query: Record<string, unknown> = { organizationId: orgId };
  if (filter.type) query.type = filter.type;
  if (filter.status) query.status = filter.status;

  const [items, total] = await Promise.all([
    AIEmployee.find(query)
      .sort({ createdAt: -1 })
      .skip((filter.page - 1) * filter.limit)
      .limit(filter.limit),
    AIEmployee.countDocuments(query),
  ]);

  return {
    items: items.map((e) => toEmployeeDTO(e as EmployeeRecord)),
    total,
    page: filter.page,
    limit: filter.limit,
  };
}

export async function getEmployee(orgId: string, id: string): Promise<AIEmployeeDTO> {
  const employee = await loadEmployee(orgId, id);
  const [knowledgeCount, responsibilityCount] = await Promise.all([
    KnowledgeItem.countDocuments({ aiEmployeeId: employee._id }),
    Responsibility.countDocuments({ aiEmployeeId: employee._id }),
  ]);
  return toEmployeeDTO(employee, { knowledgeCount, responsibilityCount });
}

export async function updateEmployee(
  orgId: string,
  id: string,
  input: UpdateEmployeeInput,
): Promise<AIEmployeeDTO> {
  const employee = await loadEmployee(orgId, id);
  Object.assign(employee, input);
  await employee.save();
  await refreshStatus(employee);
  return toEmployeeDTO(employee);
}

export async function deleteEmployee(orgId: string, id: string): Promise<void> {
  const employee = await loadEmployee(orgId, id);

  const activeCampaign = await Campaign.findOne({
    aiEmployeeId: employee._id,
    status: { $in: ['draft', 'running', 'paused'] },
  });
  if (activeCampaign) {
    throw ApiError.conflict(
      'This AI employee has an active or draft campaign. Delete or complete that campaign first.',
    );
  }

  await Promise.all([
    KnowledgeItem.deleteMany({ aiEmployeeId: employee._id }),
    Responsibility.deleteMany({ aiEmployeeId: employee._id }),
    AIEmployee.deleteOne({ _id: employee._id }),
  ]);
}

export async function setPhoneConfig(
  orgId: string,
  id: string,
  businessPhoneNumber: string,
  escalationNumber: string,
): Promise<AIEmployeeDTO> {
  const employee = await loadEmployee(orgId, id);
  if (employee.type !== 'inbound') {
    throw ApiError.badRequest('Phone configuration only applies to inbound employees');
  }
  if (employee.voiceProvider && employee.voiceProvider !== 'mock') {
    throw ApiError.badRequest(
      `This number is managed by ${employee.voiceProvider} — it was assigned when the employee went live and can’t be edited here.`,
    );
  }
  const businessE164 = toE164(businessPhoneNumber);
  const escalationE164 = toE164(escalationNumber);
  if (!businessE164) throw ApiError.badRequest('Invalid business phone number');
  if (!escalationE164) throw ApiError.badRequest('Invalid escalation phone number');
  employee.businessPhoneNumber = businessE164;
  employee.escalationNumber = escalationE164;
  await employee.save();
  await refreshStatus(employee);
  return toEmployeeDTO(employee);
}

export async function setBilling(
  orgId: string,
  id: string,
  payment: { cardType: string; brand: string; last4: string },
): Promise<AIEmployeeDTO> {
  const employee = await loadEmployee(orgId, id);
  employee.billingConfigured = true;
  await employee.save();
  // Store payment method placeholder at the organization level (no real charge in Phase 1).
  await Organization.updateOne(
    { _id: orgId },
    {
      billingStatus: 'active',
      paymentMethod: {
        cardType: payment.cardType,
        brand: payment.brand,
        last4: payment.last4,
        addedAt: new Date(),
      },
    },
  );
  await refreshStatus(employee);
  return toEmployeeDTO(employee);
}

export async function markTested(orgId: string, id: string): Promise<AIEmployeeDTO> {
  const employee = await loadEmployee(orgId, id);
  employee.tested = true;
  await employee.save();
  await refreshStatus(employee);
  return toEmployeeDTO(employee);
}

/**
 * Bind an inbound employee to the active voice provider's assistant/agent and
 * real inbound number, and persist the result. No-op on the mock engine —
 * there's no real telephony to bind to. Throws with the engine's own message
 * on failure (e.g. no phone number available in the provider account) so
 * activation clearly fails rather than silently going "live" unconnected.
 */
async function provisionInbound(employee: EmployeeRecord): Promise<void> {
  const engine = getVoiceEngine();
  if (engine.provider === 'mock') return;

  const employeeId = String(employee._id);
  let assistantId: string;
  let phoneNumber: string;
  try {
    [{ assistantId }, { phoneNumber }] = await Promise.all([
      engine.syncAssistant(employeeId),
      engine.provisionInboundNumber(employeeId),
    ]);
  } catch (err) {
    logger.error({ err, employeeId, provider: engine.provider }, 'Inbound provisioning failed');
    throw ApiError.badRequest(
      `Could not connect this employee to ${engine.provider}: ${(err as Error).message}`,
    );
  }

  employee.assistantExternalId = assistantId;
  employee.voiceProvider = engine.provider;
  // The number typed in the wizard was a placeholder until now — replace it
  // with the number the provider will actually ring.
  employee.businessPhoneNumber = phoneNumber;
  logger.info({ employeeId, provider: engine.provider, phoneNumber }, 'Inbound employee provisioned');
}

export async function activateEmployee(orgId: string, id: string): Promise<AIEmployeeDTO> {
  const employee = await loadEmployee(orgId, id);
  const snapshot = await buildSnapshot(employee);
  if (!canActivate(snapshot)) {
    throw ApiError.precondition(
      'Cannot activate: prerequisites not met',
      missingForActivation(snapshot),
    );
  }
  if (employee.type === 'inbound') {
    await provisionInbound(employee);
  }
  employee.activatedAt = new Date();
  employee.status = 'active';
  await employee.save();
  return toEmployeeDTO(employee);
}
