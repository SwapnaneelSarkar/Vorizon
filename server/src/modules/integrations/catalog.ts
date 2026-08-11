import type { ConnectorProvider } from '@vorizon/shared';
import { env } from '../../config/env.js';

export interface ConnectorDef {
  provider: ConnectorProvider;
  name: string;
  category: 'ads' | 'messaging' | 'crm' | 'calendar' | 'payments' | 'telephony';
  description: string;
  /** OAuth2 endpoints + scopes. */
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  /** Env keys holding this provider's OAuth app client id/secret. */
  clientIdEnv: keyof typeof env;
  clientSecretEnv: keyof typeof env;
}

/**
 * The connector catalog. Each entry is a metadata-driven OAuth2 provider; the
 * generic OAuth flow (integrations.service.ts) uses these fields, so adding a
 * provider is data, not new control flow. `configured` (computed at runtime)
 * is false until the org/server supplies that provider's client credentials.
 *
 * Client-id/secret env keys are declared here but only need to exist when a
 * provider is actually enabled; missing ones surface as configured:false.
 */
export const CONNECTORS: Record<ConnectorProvider, ConnectorDef> = {
  google_ads: {
    provider: 'google_ads',
    name: 'Google Ads',
    category: 'ads',
    description: 'Search, Display & YouTube campaigns and conversion data.',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/adwords'],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  meta_ads: {
    provider: 'meta_ads',
    name: 'Meta Ads',
    category: 'ads',
    description: 'Facebook & Instagram ad campaigns and Lead Ads.',
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: ['ads_management', 'leads_retrieval', 'business_management'],
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
  },
  whatsapp: {
    provider: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'messaging',
    description: 'Send and receive WhatsApp business messages.',
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
  },
  instagram: {
    provider: 'instagram',
    name: 'Instagram',
    category: 'messaging',
    description: 'Instagram messaging and lead forms.',
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: ['instagram_basic', 'instagram_manage_messages'],
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
  },
  facebook_pages: {
    provider: 'facebook_pages',
    name: 'Facebook Pages',
    category: 'messaging',
    description: 'Page messaging and lead capture.',
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: ['pages_manage_metadata', 'pages_messaging', 'leads_retrieval'],
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
  },
  gmail: {
    provider: 'gmail',
    name: 'Gmail',
    category: 'messaging',
    description: 'Send follow-up emails from the business inbox.',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  google_calendar: {
    provider: 'google_calendar',
    name: 'Google Calendar',
    category: 'calendar',
    description: 'Book appointments on connected calendars.',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  hubspot: {
    provider: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    description: 'Sync leads, contacts and deals to HubSpot CRM.',
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: ['crm.objects.contacts.write', 'crm.objects.deals.write'],
    clientIdEnv: 'HUBSPOT_CLIENT_ID',
    clientSecretEnv: 'HUBSPOT_CLIENT_SECRET',
  },
  salesforce: {
    provider: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    description: 'Sync leads and opportunities to Salesforce.',
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: ['api', 'refresh_token'],
    clientIdEnv: 'SALESFORCE_CLIENT_ID',
    clientSecretEnv: 'SALESFORCE_CLIENT_SECRET',
  },
  zoho: {
    provider: 'zoho',
    name: 'Zoho CRM',
    category: 'crm',
    description: 'Sync leads and deals to Zoho CRM.',
    authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
    tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
    scopes: ['ZohoCRM.modules.ALL'],
    clientIdEnv: 'ZOHO_CLIENT_ID',
    clientSecretEnv: 'ZOHO_CLIENT_SECRET',
  },
  twilio: {
    provider: 'twilio',
    name: 'Twilio',
    category: 'telephony',
    description: 'Programmable SMS and voice.',
    authUrl: '',
    tokenUrl: '',
    scopes: [],
    clientIdEnv: 'TWILIO_CLIENT_ID',
    clientSecretEnv: 'TWILIO_CLIENT_SECRET',
  },
  stripe: {
    provider: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Collect payments and track revenue.',
    authUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    scopes: ['read_write'],
    clientIdEnv: 'STRIPE_CLIENT_ID',
    clientSecretEnv: 'STRIPE_CLIENT_SECRET',
  },
};

/** True when the server has this provider's OAuth app client id + secret. */
export function isConfigured(def: ConnectorDef): boolean {
  return Boolean(env[def.clientIdEnv]) && Boolean(env[def.clientSecretEnv]) && Boolean(def.authUrl);
}
