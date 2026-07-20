import { z } from 'zod';
import { EMPLOYEE_TYPES, KNOWLEDGE_KINDS, RESPONSIBILITY_KINDS } from '../enums.js';
import { phoneSchema, workingHoursSchema } from './common.js';

export const createEmployeeSchema = z.object({
  type: z.enum(EMPLOYEE_TYPES),
  name: z.string().min(2, 'Employee name is required'),
  department: z.string().min(1, 'Department is required'),
  language: z.string().default('en-US'),
  voice: z.string().default('default'),
  workingHours: workingHoursSchema.optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().min(1).optional(),
  language: z.string().optional(),
  voice: z.string().optional(),
  workingHours: workingHoursSchema.optional(),
  tone: z.string().optional(),
  behavior: z.string().optional(),
  rules: z.array(z.string()).optional(),
});
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const phoneConfigSchema = z.object({
  businessPhoneNumber: phoneSchema,
  escalationNumber: phoneSchema,
});
export type PhoneConfigInput = z.infer<typeof phoneConfigSchema>;

export const billingConfigSchema = z.object({
  brand: z.string().min(1).default('visa'),
  last4: z.string().regex(/^\d{4}$/, '4 digits'),
});
export type BillingConfigInput = z.infer<typeof billingConfigSchema>;

export const createKnowledgeSchema = z.object({
  kind: z.enum(KNOWLEDGE_KINDS),
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
});
export type CreateKnowledgeInput = z.infer<typeof createKnowledgeSchema>;

export const responsibilityItemSchema = z.object({
  label: z.string().min(1),
  kind: z.enum(RESPONSIBILITY_KINDS).default('custom'),
  enabled: z.boolean().default(true),
});

export const setResponsibilitiesSchema = z.object({
  items: z.array(responsibilityItemSchema).min(1, 'Add at least one responsibility'),
});
export type SetResponsibilitiesInput = z.infer<typeof setResponsibilitiesSchema>;

export const interviewMessageSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
});
export type InterviewMessageInput = z.infer<typeof interviewMessageSchema>;
