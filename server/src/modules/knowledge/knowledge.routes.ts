import { Router } from 'express';
import { upload } from '../../middleware/upload.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as ctrl from './knowledge.controller.js';

// mergeParams to access :id (aiEmployeeId) from the parent router.
export const knowledgeRoutes = Router({ mergeParams: true });

knowledgeRoutes.post('/', upload.single('file'), asyncHandler(ctrl.add));
knowledgeRoutes.get('/', asyncHandler(ctrl.list));
knowledgeRoutes.delete('/:knowledgeId', asyncHandler(ctrl.remove));
