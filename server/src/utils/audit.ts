import { AuditLog } from '../models/AuditLog.js';
import { logger } from './logger.js';

/**
 * Record a sensitive action. Fire-and-forget: audit failures must never break
 * the underlying operation.
 */
export async function recordAudit(entry: {
  organizationId: string;
  actorUserId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await AuditLog.create({
      organizationId: entry.organizationId,
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      targetType: entry.targetType ?? '',
      targetId: entry.targetId ?? '',
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    logger.warn({ err, action: entry.action }, 'Failed to write audit log');
  }
}
