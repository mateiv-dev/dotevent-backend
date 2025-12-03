import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/AppError';
import { Role } from 'types/Role';
import { asyncErrorHandler } from './errorMiddleware';

export const requireAdmin = asyncErrorHandler (async (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== Role.ADMIN) {
    throw new AppError('Forbidden: This resource requires administrator privileges.', 403);
  }
  
  next();
});
