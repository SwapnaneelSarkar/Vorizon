import { z } from 'zod';

export const workingHoursSchema = z.object({
  tz: z.string().default('UTC'),
  days: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM').default('09:00'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM').default('17:00'),
});
export type WorkingHours = z.infer<typeof workingHoursSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Loose E.164-ish check; server does strict validation via libphonenumber. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s\-().]{7,20}$/, 'Invalid phone number');
