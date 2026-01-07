import { NextFunction, Request, Response } from 'express';
import fs from 'fs/promises';
import { asyncErrorHandler } from './errorMiddleware';
import { upload } from './multerMiddleware';

export const handleFileUpload = (fieldName: string, maxFileCount: number) =>
  asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await new Promise<void>((resolve, reject) => {
        upload.array(fieldName, maxFileCount)(req, res, (error) => {
          if (error) return reject(error);
          resolve();
        });
      });

      next();
    } catch (error) {
      if (req.files && Array.isArray(req.files)) {
        const files = req.files as Express.Multer.File[];

        await Promise.all(
          files.map((file) => fs.unlink(file.path).catch(() => {})),
        );
      }

      throw error;
    }
  });
