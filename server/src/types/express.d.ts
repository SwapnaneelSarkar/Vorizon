import type { Role } from '@vorizon/shared';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        organizationId: string;
        role: Role;
      };
    }
  }
}

export {};
