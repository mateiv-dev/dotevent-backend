import { Request } from 'express';
import { Role } from 'types/Role';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        firebaseId: string;
        email?: string;
        role: Role;
      };
    }
  }
}
