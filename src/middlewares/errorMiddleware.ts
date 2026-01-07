import { MAX_FILES_COUNT, MAX_FILES_SIZE_MB } from '@config/storage';
import { AppError } from '@utils/AppError';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';

type AsyncMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export const asyncErrorHandler = (fn: AsyncMiddleware) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => next(error));
  };
};

export const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = err;

  if (err instanceof ZodError) {
    const validationErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    error = new AppError('Validation failed', 400, validationErrors);
  }

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError(
        `File is too large. Max limit is ${MAX_FILES_SIZE_MB} MB.`,
        400,
      );
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = new AppError(
        `Too many files. You can upload a maximum of ${MAX_FILES_COUNT} files at once.`,
        400,
      );
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      error = new AppError(
        'Too many files uploaded or invalid field name.',
        400,
      );
    } else {
      error = new AppError(`File upload error: ${err.message}`, 400);
    }
  }

  // 3. Eroarea ta custom din fileFilter (care e Error generic)
  if (err.message === 'UNSUPORTED_FILE_FORMAT') {
    error = new AppError(
      'Invalid file format. Only images and docs are allowed.',
      400,
    );
  }

  if (error.code) {
    if (typeof error.code === 'string' && error.code.startsWith('auth/')) {
      // Firebase Auth
      error = handleFirebaseAuthErrors(error);
    } else if (error.code === 11000) {
      // MongoDB
      error = handleDuplicateFields(error);
    }
  }

  // MongoDB
  if (error.name === 'CastError') {
    error = new AppError(`Invalid ID format supplied`, 400);
  }
  if (error.name === 'ValidationError') {
    error = handleValidationError(error);
  }
  if (
    error.name === 'MongoNetworkError' ||
    error.name === 'MongooseServerSelectionError'
  ) {
    console.error('Database Connection Failure:', error);
    error = new AppError('Internal server configuration error.', 500);
  }

  const validationErrors = (error as AppError).errors;

  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    errors: validationErrors,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};

const handleFirebaseAuthErrors = (err: any): AppError => {
  switch (err.code) {
    case 'auth/id-token-expired':
      return new AppError('Authentication token has expired.', 401);

    case 'auth/id-token-revoked':
      return new AppError('Authentication token has been revoked.', 401);

    case 'auth/argument-error':
    case 'auth/invalid-argument':
    case 'auth/invalid-id-token':
      return new AppError(
        'Invalid authentication token format or signature.',
        401,
      );

    case 'auth/user-disabled':
      return new AppError(
        'Access denied. User account is currently disabled.',
        403,
      );

    case 'auth/user-not-found':
      return new AppError('User not found in Firebase Auth', 404);

    default:
      console.error('Unhandled Firebase Auth Error:', err.code);
      return new AppError(
        'Authentication failed due to an internal error.',
        500,
      );
  }
};

const handleDuplicateFields = (err: any) => {
  const match = err.message.match(/\s+dup key: \{ (.+?):\s+/);
  const field = match ? match[1] : 'field';
  const message = `The provided value for field '${field}' is already in use.`;
  return new AppError(message, 409);
};

const handleValidationError = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data: ${errors.join('; ')}`;
  return new AppError(message, 400);
};
