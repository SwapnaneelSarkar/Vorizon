import { Connection, type ConnectionDoc } from '../../../models/Connection.js';
import { logger } from '../../../utils/logger.js';
import { getValidAccessToken } from '../integrations.service.js';

/** Default Zoho API base if the connection didn't capture an api_domain (US DC). */
const DEFAULT_API_DOMAIN = 'https://www.zohoapis.com';

export interface CrmLead {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  source?: string;
  summary?: string;
}

type ConnectionRecord = ConnectionDoc & { _id: unknown };

/**
 * Push a captured lead into the org's connected Zoho CRM as a Lead record.
 * No-op (returns null) when Zoho isn't connected. Never throws — a CRM hiccup
 * must not break lead intake; failures are logged and surfaced on the connection.
 * Returns the created Zoho record id on success.
 */
export async function syncLeadToZoho(orgId: string, lead: CrmLead): Promise<string | null> {
  const conn = (await Connection.findOne({
    organizationId: orgId,
    provider: 'zoho',
    status: 'connected',
  })) as ConnectionRecord | null;
  if (!conn) return null;

  try {
    const token = await getValidAccessToken(conn);
    const apiDomain = (conn.apiDomain || DEFAULT_API_DOMAIN).replace(/\/$/, '');

    // Zoho Leads require Last_Name and Company. Split a single name best-effort.
    const parts = lead.name.trim().split(/\s+/);
    const firstName = parts.length > 1 ? parts[0] : '';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || 'Lead';

    const record: Record<string, unknown> = {
      Last_Name: lastName,
      ...(firstName ? { First_Name: firstName } : {}),
      ...(lead.phone ? { Phone: lead.phone } : {}),
      ...(lead.email ? { Email: lead.email } : {}),
      Company: lead.company || lead.name || 'Unknown',
      Lead_Source: lead.source || 'Vorizon',
      ...(lead.summary ? { Description: lead.summary } : {}),
    };

    const res = await fetch(`${apiDomain}/crm/v2/Leads`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [record] }),
    });
    const text = await res.text();
    const parsed = (text ? JSON.parse(text) : {}) as {
      data?: { status?: string; code?: string; message?: string; details?: { id?: string } }[];
    };
    const row = parsed.data?.[0];
    const id = row?.details?.id;
    if (!res.ok || row?.status === 'error' || !id) {
      throw new Error(`Zoho createLead rejected: ${row?.code ?? row?.message ?? res.status}`);
    }

    logger.info({ orgId, zohoLeadId: id }, 'Lead synced to Zoho CRM');
    return id;
  } catch (err) {
    logger.error({ err, orgId }, 'Zoho lead sync failed');
    await Connection.updateOne(
      { _id: conn._id },
      { $set: { lastError: `CRM sync failed: ${(err as Error).message}`.slice(0, 300) } },
    ).catch(() => undefined);
    return null;
  }
}
