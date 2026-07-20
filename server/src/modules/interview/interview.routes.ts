import { Router } from 'express';
import { interviewMessageSchema } from '@vorizon/shared';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as svc from './interview.service.js';

export const interviewRoutes = Router({ mergeParams: true });

interviewRoutes.post(
  '/message',
  validate(interviewMessageSchema),
  asyncHandler(async (req, res) => {
    const result = await svc.sendInterviewMessage(req.user!.organizationId, req.params.id, req.body);
    res.json({ data: result });
  }),
);

interviewRoutes.get(
  '/sessions/:sessionId',
  asyncHandler(async (req, res) => {
    const result = await svc.getSession(
      req.user!.organizationId,
      req.params.id,
      req.params.sessionId,
    );
    res.json({ data: result });
  }),
);
