import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  notificationTemplate,
  otpTemplate,
  passwordResetTemplate,
  welcomeTemplate,
} from './templates.js';

/** Whether transactional email is configured. Unset key → sends become logged no-ops. */
export const isEmailEnabled = Boolean(env.RESEND_API_KEY);

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!isEmailEnabled) return null;
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Core send. Never throws: email is a side effect and must not break the
 * calling flow (registration, payments, campaigns). Returns whether the
 * message was accepted by Resend.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    logger.info({ to, subject }, 'Email skipped (RESEND_API_KEY not set)');
    return false;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      ...(env.EMAIL_REPLY_TO ? { replyTo: env.EMAIL_REPLY_TO } : {}),
    });
    if (error) {
      logger.error({ to, subject, error }, 'Resend rejected email');
      return false;
    }
    logger.info({ to, subject, emailId: data?.id }, 'Email sent');
    return true;
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
    return false;
  }
}

// ---- Reusable transactional emails ----

export function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const t = welcomeTemplate(name, env.APP_BASE_URL);
  return sendEmail({ to, ...t });
}

/** Generic one-time code (e.g. email verification, sensitive-action confirmation). */
export function sendOtpEmail(to: string, code: string, purpose: string): Promise<boolean> {
  const t = otpTemplate(code, purpose);
  return sendEmail({ to, ...t });
}

export function sendPasswordResetEmail(to: string, code: string): Promise<boolean> {
  const t = passwordResetTemplate(code);
  return sendEmail({ to, ...t });
}

export function sendNotificationEmail(
  to: string,
  heading: string,
  message: string,
  cta?: { label: string; url: string },
): Promise<boolean> {
  const t = notificationTemplate(heading, message, cta);
  return sendEmail({ to, ...t });
}
