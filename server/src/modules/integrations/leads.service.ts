import type { InboundLeadInput, LeadDTO, LeadStatus } from '@vorizon/shared';
import { Lead, type LeadDoc } from '../../models/Lead.js';
import { logger } from '../../utils/logger.js';
import { toE164 } from '../../utils/phone.js';
import { getVoiceEngine } from '../../voice/index.js';
import { callBlockReason } from '../compliance/compliance.service.js';

type LeadRecord = LeadDoc & { _id: unknown; createdAt?: Date };

function toDTO(l: LeadRecord): LeadDTO {
  return {
    id: String(l._id),
    source: l.source as LeadDTO['source'],
    name: l.name,
    phone: l.phone || undefined,
    email: l.email || undefined,
    company: l.company || undefined,
    campaignId: l.campaignId ? String(l.campaignId) : undefined,
    status: l.status,
    score: l.score ?? undefined,
    aiSummary: l.aiSummary || undefined,
    createdAt: l.createdAt?.toISOString() ?? '',
  };
}

/**
 * Ingest a lead from a connector/webhook and start the closed-loop pipeline.
 * Idempotent on (org, source, externalId). Never throws for pipeline issues —
 * the lead is always persisted first so nothing is lost.
 */
export async function ingestLead(
  orgId: string,
  source: string,
  input: InboundLeadInput,
): Promise<LeadDTO> {
  const phone = input.phone ? (toE164(input.phone) ?? input.phone) : '';

  // Dedupe redeliveries when the platform provides a stable external id.
  if (input.externalId) {
    const existing = await Lead.findOne({ organizationId: orgId, source, externalId: input.externalId });
    if (existing) return toDTO(existing as LeadRecord);
  }

  let lead: LeadRecord;
  try {
    lead = (await Lead.create({
      organizationId: orgId,
      source,
      externalId: input.externalId ?? '',
      name: input.name,
      phone,
      email: input.email ?? '',
      company: input.company ?? '',
      campaignId: input.campaignId ?? null,
      status: 'new',
      raw: input.meta ?? {},
    })) as LeadRecord;
  } catch (err) {
    // Concurrent redelivery lost the unique-index race (org+source+externalId).
    // Return the winner instead of failing the webhook.
    if ((err as { code?: number }).code === 11000 && input.externalId) {
      const existing = await Lead.findOne({ organizationId: orgId, source, externalId: input.externalId });
      if (existing) return toDTO(existing as LeadRecord);
    }
    throw err;
  }

  // Kick off qualification without blocking the webhook response path.
  void qualifyLead(orgId, String(lead._id)).catch((err) =>
    logger.error({ err, leadId: String(lead._id) }, 'Lead qualification failed'),
  );

  logger.info({ leadId: String(lead._id), source, orgId }, 'Lead ingested');
  return toDTO(lead);
}

/**
 * AI-qualify a lead, then hand off. Uses the interview LLM to summarize/score;
 * degrades to a neutral score when no LLM is configured. Compliance is checked
 * before any downstream call attempt.
 */
export async function qualifyLead(orgId: string, leadId: string): Promise<void> {
  const lead = await Lead.findOne({ _id: leadId, organizationId: orgId });
  if (!lead) return;
  lead.status = 'qualifying';
  await lead.save();

  let score = 50;
  let summary = 'Lead received; automated qualification pending LLM configuration.';
  try {
    const engine = getVoiceEngine();
    const { reply } = await engine.interviewTurn({
      systemPrompt:
        'You are a sales qualification assistant. Given a lead, reply with one short line: a 0-100 intent score as "SCORE: <n>" then a one-sentence summary.',
      history: [],
      message: `Lead: ${lead.name}, company: ${lead.company || 'n/a'}, email: ${lead.email || 'n/a'}, phone: ${lead.phone || 'n/a'}. Source: ${lead.source}.`,
      language: 'en',
    });
    const m = reply.match(/SCORE:\s*(\d{1,3})/i);
    if (m) score = Math.min(100, Math.max(0, Number(m[1])));
    summary = reply.replace(/SCORE:\s*\d{1,3}/i, '').trim() || summary;
  } catch (err) {
    logger.warn({ err, leadId }, 'LLM qualification unavailable; using default score');
  }

  lead.score = score;
  lead.aiSummary = summary.slice(0, 500);
  lead.status = score >= 50 ? 'qualified' : 'unqualified';
  await lead.save();

  // Compliance-gated next step: only qualified leads with a callable phone advance.
  if (lead.status === 'qualified' && lead.phone) {
    const blocked = await callBlockReason(orgId, { phone: lead.phone, optedOut: false });
    if (blocked) {
      logger.info({ leadId, reason: blocked }, 'Qualified lead not called (compliance)');
    } else {
      lead.status = 'contacted';
      await lead.save();
      logger.info({ leadId, score }, 'Lead qualified and marked for contact');
    }
  }
}

export async function listLeads(
  orgId: string,
  opts: { status?: LeadStatus; page?: number; limit?: number } = {},
): Promise<{ items: LeadDTO[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const filter: Record<string, unknown> = { organizationId: orgId };
  if (opts.status) filter.status = opts.status;
  const [items, total] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Lead.countDocuments(filter),
  ]);
  return { items: items.map((l) => toDTO(l as LeadRecord)), total };
}

export async function leadStats(orgId: string): Promise<Record<LeadStatus | 'total', number>> {
  const rows = await Lead.aggregate([
    { $match: { organizationId: (await import('mongoose')).default.Types.ObjectId.createFromHexString(orgId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const out = { total: 0 } as Record<string, number>;
  for (const r of rows) {
    out[r._id] = r.count;
    out.total += r.count;
  }
  return out as Record<LeadStatus | 'total', number>;
}
