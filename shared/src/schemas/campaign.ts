import { z } from 'zod';
import { workingHoursSchema } from './common.js';

export const createCampaignSchema = z.object({
  name: z.string().min(2, 'Campaign name is required'),
  aiEmployeeId: z.string().min(1, 'Select an outbound AI employee'),
  callingSchedule: workingHoursSchema.optional(),
  retryAttempts: z.coerce.number().int().min(0).max(10).default(0),
  retryInterval: z.coerce.number().int().min(0).default(60),
  dailyCallLimit: z.coerce.number().int().min(1).default(100),
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
