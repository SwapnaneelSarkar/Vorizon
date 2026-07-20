import { Router } from 'express';
import {
  billingConfigSchema,
  createEmployeeSchema,
  paginationQuerySchema,
  phoneConfigSchema,
  updateEmployeeSchema,
} from '@vorizon/shared';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as ctrl from './aiEmployees.controller.js';
import { knowledgeRoutes } from '../knowledge/knowledge.routes.js';
import { responsibilityRoutes } from '../responsibilities/responsibilities.routes.js';
import { interviewRoutes } from '../interview/interview.routes.js';

export const employeeRoutes = Router();

employeeRoutes.use(requireAuth);

employeeRoutes.post('/', validate(createEmployeeSchema), asyncHandler(ctrl.create));
employeeRoutes.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(ctrl.list));
employeeRoutes.get('/:id', asyncHandler(ctrl.getOne));
employeeRoutes.patch('/:id', validate(updateEmployeeSchema), asyncHandler(ctrl.update));
employeeRoutes.delete('/:id', asyncHandler(ctrl.remove));

employeeRoutes.patch('/:id/phone', validate(phoneConfigSchema), asyncHandler(ctrl.setPhone));
employeeRoutes.patch('/:id/billing', validate(billingConfigSchema), asyncHandler(ctrl.setBilling));
employeeRoutes.post('/:id/mark-tested', asyncHandler(ctrl.markTested));
employeeRoutes.post('/:id/activate', asyncHandler(ctrl.activate));

// Nested resources (mergeParams so :id is available downstream).
employeeRoutes.use('/:id/knowledge', knowledgeRoutes);
employeeRoutes.use('/:id/responsibilities', responsibilityRoutes);
employeeRoutes.use('/:id/interview', interviewRoutes);
