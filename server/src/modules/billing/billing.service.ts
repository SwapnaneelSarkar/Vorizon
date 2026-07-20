import mongoose from 'mongoose';
import type { UsageSummary } from '@vorizon/shared';
import { Call } from '../../models/Call.js';
import { UsageRecord } from '../../models/UsageRecord.js';
import { AIEmployee } from '../../models/AIEmployee.js';
import { env } from '../../config/env.js';

export async function getUsageSummary(
  orgId: string,
  range?: { from?: Date; to?: Date },
): Promise<UsageSummary> {
  const orgObjId = new mongoose.Types.ObjectId(orgId);
  const match: Record<string, unknown> = { organizationId: orgObjId };
  if (range?.from || range?.to) {
    match.billedAt = {
      ...(range.from ? { $gte: range.from } : {}),
      ...(range.to ? { $lte: range.to } : {}),
    };
  }

  const [totals] = await UsageRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: '$minutes' },
        totalUsd: { $sum: '$amountUsd' },
        totalCalls: { $sum: 1 },
      },
    },
  ]);

  const byDay = await UsageRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$billedAt' } },
        minutes: { $sum: '$minutes' },
        usd: { $sum: '$amountUsd' },
        calls: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', minutes: 1, usd: 1, calls: 1 } },
  ]);

  const byEmployeeRaw = await UsageRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$aiEmployeeId',
        minutes: { $sum: '$minutes' },
        usd: { $sum: '$amountUsd' },
        calls: { $sum: 1 },
      },
    },
  ]);
  const employees = await AIEmployee.find({ organizationId: orgObjId }).select('name');
  const nameById = new Map(employees.map((e) => [String(e._id), e.name]));
  const byEmployee = byEmployeeRaw.map((row) => ({
    aiEmployeeId: String(row._id),
    name: nameById.get(String(row._id)) ?? 'Unknown',
    minutes: row.minutes,
    usd: Number(row.usd.toFixed(2)),
    calls: row.calls,
  }));

  const outcomes = await Call.aggregate([
    { $match: { organizationId: orgObjId } },
    { $group: { _id: '$outcome', count: { $sum: 1 } } },
    { $project: { _id: 0, outcome: '$_id', count: 1 } },
  ]);

  return {
    totalCalls: totals?.totalCalls ?? 0,
    totalMinutes: totals?.totalMinutes ?? 0,
    totalUsd: Number((totals?.totalUsd ?? 0).toFixed(2)),
    rateUsd: env.RATE_USD_PER_MINUTE,
    byDay,
    byEmployee,
    outcomes,
  };
}

export async function getEstimate(orgId: string): Promise<{ projectedMonthlyUsd: number }> {
  const orgObjId = new mongoose.Types.ObjectId(orgId);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [agg] = await UsageRecord.aggregate([
    { $match: { organizationId: orgObjId, billedAt: { $gte: since } } },
    { $group: { _id: null, usd: { $sum: '$amountUsd' } } },
  ]);
  return { projectedMonthlyUsd: Number((agg?.usd ?? 0).toFixed(2)) };
}
