import type { Request, Response } from 'express';
import { createKnowledgeSchema } from '@vorizon/shared';
import { ApiError } from '../../utils/apiError.js';
import * as svc from './knowledge.service.js';

export async function add(req: Request, res: Response) {
  const orgId = req.user!.organizationId;
  const employeeId = req.params.id;

  if (req.file) {
    const dto = await svc.addFileKnowledge(orgId, employeeId, req.file, req.body.title);
    return res.status(201).json({ data: dto });
  }

  const parsed = createKnowledgeSchema.parse(req.body);
  if (!parsed.content) {
    throw ApiError.badRequest('Text knowledge requires content');
  }
  const dto = await svc.addTextKnowledge(orgId, employeeId, parsed);
  res.status(201).json({ data: dto });
}

export async function list(req: Request, res: Response) {
  const dtos = await svc.listKnowledge(req.user!.organizationId, req.params.id);
  res.json({ data: dtos });
}

export async function remove(req: Request, res: Response) {
  await svc.deleteKnowledge(req.user!.organizationId, req.params.id, req.params.knowledgeId);
  res.status(204).send();
}
