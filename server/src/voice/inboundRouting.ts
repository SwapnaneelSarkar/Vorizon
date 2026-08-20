import { AIEmployee } from '../models/AIEmployee.js';
import { toE164 } from '../utils/phone.js';

/**
 * Attribute a real inbound call (a customer dialing the AI reception number) to
 * the employee/org that owns the dialed number. Inbound calls carry no Vorizon
 * metadata — the provider only tells us which number was dialed — so we reverse-
 * look-up the active inbound employee bound to that business number.
 *
 * Numbers are matched in E.164 (normalized both sides). If several active
 * inbound employees share one number (a shared-number deployment), the most
 * recently activated wins — per-employee dedicated numbers are required to make
 * multiple inbound employees unambiguous.
 */
export async function resolveInboundTarget(
  toNumber: string | undefined | null,
): Promise<{ organizationId: string; aiEmployeeId: string } | null> {
  if (!toNumber) return null;
  const e164 = toE164(toNumber);
  const candidates = [toNumber, ...(e164 && e164 !== toNumber ? [e164] : [])];

  const emp = await AIEmployee.findOne({
    type: 'inbound',
    status: 'active',
    businessPhoneNumber: { $in: candidates },
  }).sort({ activatedAt: -1 });

  if (!emp) return null;
  return { organizationId: String(emp.organizationId), aiEmployeeId: String(emp._id) };
}
