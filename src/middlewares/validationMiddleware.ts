import { AppError } from '@utils/AppError';
import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

export const validateBody = (schema: ZodObject) => 
  (req: Request, _res: Response, next: NextFunction) => {
  
  try {
    schema.parse({
      body: req.body,
    });

    next();
  }
  catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map(issue => 
        `Field '${issue.path.join('.')}' failed: ${issue.message}`
      );
      
      const combinedMessage = 'Validation failed. ' + errorMessages.join('; ');

      throw new AppError(combinedMessage, 400);
    }

    next(error); 
  }
};
