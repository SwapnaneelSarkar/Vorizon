import type { Request, Response } from 'express';
import * as svc from './aiEmployees.service.js';

export async function create(req: Request, res: Response) {
  const dto = await svc.createEmployee(req.user!.organizationId, req.body);
  res.status(201).json({ data: dto });
}

export async function list(req: Request, res: Response) {
  const { type, status, page, limit } = req.query as unknown as {
    type?: string;
    status?: string;
    page: number;
    limit: number;
  };
  const result = await svc.listEmployees(req.user!.organizationId, { type, status, page, limit });
  res.json({ data: result });
}

export async function getOne(req: Request, res: Response) {
  const dto = await svc.getEmployee(req.user!.organizationId, req.params.id);
  res.json({ data: dto });
}

export async function update(req: Request, res: Response) {
  const dto = await svc.updateEmployee(req.user!.organizationId, req.params.id, req.body);
  res.json({ data: dto });
}

export async function remove(req: Request, res: Response) {
  await svc.deleteEmployee(req.user!.organizationId, req.params.id);
  res.status(204).send();
}

export async function setPhone(req: Request, res: Response) {
  const dto = await svc.setPhoneConfig(
    req.user!.organizationId,
    req.params.id,
    req.body.businessPhoneNumber,
    req.body.escalationNumber,
  );
  res.json({ data: dto });
}

export async function setBilling(req: Request, res: Response) {
  const dto = await svc.setBilling(req.user!.organizationId, req.params.id, {
    brand: req.body.brand,
    last4: req.body.last4,
  });
  res.json({ data: dto });
}

export async function markTested(req: Request, res: Response) {
  const dto = await svc.markTested(req.user!.organizationId, req.params.id);
  res.json({ data: dto });
}

export async function activate(req: Request, res: Response) {
  const dto = await svc.activateEmployee(req.user!.organizationId, req.params.id);
  res.json({ data: dto });
}
