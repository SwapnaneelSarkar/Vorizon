import mongoose from 'mongoose';
import { Call } from '../../models/Call.js';
import { AIEmployee } from '../../models/AIEmployee.js';
import { Contact } from '../../models/Contact.js';
import { Campaign } from '../../models/Campaign.js';
import { getUsageSummary } from '../billing/billing.service.js';

export async function getDashboard(orgId: string) {
  const orgObjId = new mongoose.Types.ObjectId(orgId);
  const usage = await getUsageSummary(orgId);

  const [
    employeeCount,
    activeEmployeeCount,
    contactCount,
    campaignCount,
    transferredCalls,
    recentCalls,
  ] = await Promise.all([
    AIEmployee.countDocuments({ organizationId: orgObjId }),
    AIEmployee.countDocuments({ organizationId: orgObjId, status: 'active' }),
    Contact.countDocuments({ organizationId: orgObjId }),
    Campaign.countDocuments({ organizationId: orgObjId }),
    Call.countDocuments({ organizationId: orgObjId, escalated: true }),
    Call.find({ organizationId: orgObjId }).sort({ createdAt: -1 }).limit(10),
  ]);

  return {
    kpis: {
      totalCalls: usage.totalCalls,
      totalMinutes: usage.totalMinutes,
      totalUsd: usage.totalUsd,
      employees: employeeCount,
      activeEmployees: activeEmployeeCount,
      contacts: contactCount,
      campaigns: campaignCount,
      transferredToHuman: transferredCalls,
    },
    outcomes: usage.outcomes,
    byDay: usage.byDay,
    byEmployee: usage.byEmployee,
    recentCalls: recentCalls.map((c) => ({
      id: String(c._id),
      direction: c.direction,
      from: c.from,
      to: c.to,
      durationSec: c.durationSec,
      outcome: c.outcome,
      escalated: c.escalated,
      startedAt: c.startedAt?.toISOString(),
    })),
  };
}
