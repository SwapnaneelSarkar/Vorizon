import { z } from 'zod';

/** Consent must be an explicit true — an unchecked box cannot enable calling. */
export const recordConsentSchema = z.object({
  accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must explicitly accept the AI calling consent' }),
  }),
});
export type RecordConsentInput = z.infer<typeof recordConsentSchema>;

export const updateComplianceSettingsSchema = z.object({
  recordingDisclosure: z.object({
    enabled: z.boolean(),
    message: z.string().min(10).max(500),
  }),
});
export type UpdateComplianceSettingsInput = z.infer<typeof updateComplianceSettingsSchema>;

export const addDncSchema = z.object({
  phone: z.string().min(5, 'Phone number is required'),
  note: z.string().max(300).optional(),
});
export type AddDncInput = z.infer<typeof addDncSchema>;

export const optOutSchema = z.object({
  phone: z.string().min(5, 'Phone number is required'),
});
export type OptOutInput = z.infer<typeof optOutSchema>;
