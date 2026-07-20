import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { CreateUserInput, Role, UserDTO } from '@vorizon/shared';
import { User, type UserDoc } from '../../models/User.js';
import { ApiError } from '../../utils/apiError.js';

type UserRecord = UserDoc & { _id: unknown };

function toUserDTO(u: UserRecord): UserDTO {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    organizationId: String(u.organizationId),
  };
}

export async function listUsers(orgId: string): Promise<UserDTO[]> {
  const users = await User.find({ organizationId: orgId }).sort({ createdAt: 1 });
  return users.map((u) => toUserDTO(u as UserRecord));
}

export async function createUser(
  orgId: string,
  input: CreateUserInput,
): Promise<{ user: UserDTO; tempPassword?: string }> {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw ApiError.conflict('A user with that email already exists');

  // If no password supplied, generate a temporary one and return it once.
  const tempPassword = input.password ?? randomBytes(9).toString('base64url');
  const user = (await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await bcrypt.hash(tempPassword, 10),
    organizationId: orgId,
    role: input.role,
  })) as UserRecord;

  return { user: toUserDTO(user), tempPassword: input.password ? undefined : tempPassword };
}

async function countOwners(orgId: string): Promise<number> {
  return User.countDocuments({ organizationId: orgId, role: 'owner' });
}

export async function updateUserRole(
  orgId: string,
  actorUserId: string,
  targetUserId: string,
  role: Role,
): Promise<UserDTO> {
  const target = await User.findOne({ _id: targetUserId, organizationId: orgId });
  if (!target) throw ApiError.notFound('User not found');

  // Prevent removing the last owner.
  if (target.role === 'owner' && role !== 'owner' && (await countOwners(orgId)) <= 1) {
    throw ApiError.badRequest('Cannot demote the last owner');
  }
  target.role = role;
  await target.save();
  return toUserDTO(target as UserRecord);
}

export async function deleteUser(
  orgId: string,
  actorUserId: string,
  targetUserId: string,
): Promise<void> {
  if (actorUserId === targetUserId) throw ApiError.badRequest('You cannot remove yourself');
  const target = await User.findOne({ _id: targetUserId, organizationId: orgId });
  if (!target) throw ApiError.notFound('User not found');
  if (target.role === 'owner' && (await countOwners(orgId)) <= 1) {
    throw ApiError.badRequest('Cannot remove the last owner');
  }
  await User.deleteOne({ _id: targetUserId, organizationId: orgId });
}
