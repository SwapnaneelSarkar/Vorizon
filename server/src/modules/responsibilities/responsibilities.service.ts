import type { ResponsibilityDTO, SetResponsibilitiesInput } from '@vorizon/shared';
import type { HydratedDocument } from 'mongoose';
import { Responsibility, type ResponsibilityDoc } from '../../models/Responsibility.js';
import { loadEmployee, refreshStatus } from '../aiEmployees/aiEmployees.service.js';

type ResponsibilityRecord = HydratedDocument<ResponsibilityDoc>;

function toDTO(r: ResponsibilityRecord): ResponsibilityDTO {
  return {
    id: String(r._id),
    label: r.label,
    kind: r.kind,
    enabled: r.enabled,
  };
}

export async function listResponsibilities(
  orgId: string,
  employeeId: string,
): Promise<ResponsibilityDTO[]> {
  await loadEmployee(orgId, employeeId);
  const items = await Responsibility.find({ aiEmployeeId: employeeId }).sort({ createdAt: 1 });
  return items.map((r) => toDTO(r as ResponsibilityRecord));
}

/** Replace the full responsibility set for an employee. */
export async function setResponsibilities(
  orgId: string,
  employeeId: string,
  input: SetResponsibilitiesInput,
): Promise<ResponsibilityDTO[]> {
  const employee = await loadEmployee(orgId, employeeId);
  await Responsibility.deleteMany({ aiEmployeeId: employeeId });
  const docs = await Responsibility.insertMany(
    input.items.map((item) => ({
      organizationId: orgId,
      aiEmployeeId: employee._id,
      label: item.label,
      kind: item.kind,
      enabled: item.enabled,
    })),
  );
  await refreshStatus(employee);
  return docs.map((r) => toDTO(r as unknown as ResponsibilityRecord));
}
