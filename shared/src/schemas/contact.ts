import { z } from 'zod';
import { phoneSchema } from './common.js';

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal('')),
  company: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;
