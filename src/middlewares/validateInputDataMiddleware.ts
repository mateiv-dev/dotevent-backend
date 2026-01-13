import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import { NextFunction, Request, Response } from 'express';
import { ZodObject } from 'zod';

export const validate = (schema: ZodObject) =>
  asyncErrorHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData;
      next();
    },
  );
