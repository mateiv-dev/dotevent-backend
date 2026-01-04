import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import { NextFunction, Request, Response } from 'express';
import { ZodObject } from 'zod';

export const validate = (schema: ZodObject) =>
  asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
    schema.parse(req.body);
    next();
  });
