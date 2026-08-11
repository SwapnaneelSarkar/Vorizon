import { z } from 'zod';
import { CONNECTOR_PROVIDERS } from '../enums.js';

export const startConnectSchema = z.object({
  provider: z.enum(CONNECTOR_PROVIDERS),
});
export type StartConnectInput = z.infer<typeof startConnectSchema>;

/** Inbound lead payload (from an ad-platform webhook or manual push). */
export const inboundLeadSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(5).max(20).optional(),
  email: z.string().email().optional(),
  company: z.string().max(200).optional(),
  campaignId: z.string().optional(),
  externalId: z.string().max(200).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export type InboundLeadInput = z.infer<typeof inboundLeadSchema>;
