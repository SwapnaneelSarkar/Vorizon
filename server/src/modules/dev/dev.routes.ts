import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { loadEmployee } from '../aiEmployees/aiEmployees.service.js';
import { handleCallEnded } from '../../voice/handleCallEvent.js';
import type { CallOutcome } from '@vorizon/shared';

export const devRoutes = Router();

devRoutes.use(requireAuth);

/**
 * Simulate a completed inbound call so the metering/analytics pipeline can be
 * exercised end-to-end without real telephony. Dev/demo only.
 */
devRoutes.post(
  '/simulate-inbound/:employeeId',
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId;
    const employee = await loadEmployee(orgId, req.params.employeeId);
    if (employee.type !== 'inbound') {
      throw ApiError.badRequest('Employee is not an inbound employee');
    }
    if (!employee.activatedAt) {
      throw ApiError.badRequest('Activate the employee before simulating calls');
    }

    const durationSec: number = Number(req.body?.durationSec ?? 125);
    const outcome: CallOutcome = (req.body?.outcome as CallOutcome) ?? 'completed';
    const escalated = Boolean(req.body?.escalated ?? false);

    const call = await handleCallEnded({
      externalCallId: `mock-inbound-${Date.now()}`,
      status: 'ended',
      direction: 'inbound',
      organizationId: orgId,
      aiEmployeeId: String(employee._id),
      from: '+15551234567',
      to: employee.businessPhoneNumber ?? '+10000000000',
      durationSec,
      outcome,
      escalated,
      transcript: [
        { role: 'customer', text: 'Hi, I have a question about your services.', at: new Date().toISOString() },
        { role: 'ai', text: 'Of course! I would be happy to help with that.', at: new Date().toISOString() },
      ],
    });

    res.status(201).json({ data: { callId: String(call._id), durationSec, outcome } });
  }),
);
