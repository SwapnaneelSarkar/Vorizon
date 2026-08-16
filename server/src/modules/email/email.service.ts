import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  notificationTemplate,
  otpTemplate,
  passwordResetTemplate,
  welcomeTemplate,
} from './templates.js';

/**
 * Email provider selection:
 * - Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD) — preferred; delivers to ANY
 *   recipient (Resend's free tier only delivers to the account owner).
 * - Resend (RESEND_API_KEY) — fallback.
 * - Neither → sends become logged no-ops.
 */
const gmailEnabled = Boolean(env.GMAIL_USER && env.GMAIL_APP_PASSWORD);
export const isEmailEnabled = gmailEnabled || Boolean(env.RESEND_API_KEY);
export const emailProvider = gmailEnabled ? 'gmail' : env.RESEND_API_KEY ? 'resend' : 'none';

let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(env.RESEND_API_KEY);
  return resendClient;
}

let smtp: Transporter | null = null;
function getSmtp(): Transporter | null {
  if (!gmailEnabled) return null;
  if (!smtp) {
    smtp = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') },
    });
  }
  return smtp;
}

/** Display name from EMAIL_FROM, but always send from the authenticated Gmail address. */
function gmailFrom(): string {
  const name = env.EMAIL_FROM.replace(/<[^>]*>/, '').trim() || 'Vorizon';
  return `${name} <${env.GMAIL_USER}>`;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Core send. Never throws: email is a side effect and must not break the
 * calling flow (registration, payments, campaigns). Returns whether the
 * message was accepted by the active provider.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  try {
    const transport = getSmtp();
    if (transport) {
      const info = await transport.sendMail({
        from: gmailFrom(),
        to,
        subject,
        html,
        ...(env.EMAIL_REPLY_TO ? { replyTo: env.EMAIL_REPLY_TO } : {}),
      });
      logger.info({ to, subject, messageId: info.messageId, via: 'gmail' }, 'Email sent');
      return true;
    }

    const resend = getResend();
    if (resend) {
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
      logger.info({ to, subject, emailId: data?.id, via: 'resend' }, 'Email sent');
      return true;
    }

    logger.info({ to, subject }, 'Email skipped (no provider configured)');
    return false;
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
