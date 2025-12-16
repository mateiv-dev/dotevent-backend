import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

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
