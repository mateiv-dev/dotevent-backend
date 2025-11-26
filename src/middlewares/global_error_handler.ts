import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app_error';

export const globalErrorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (err.name === 'CastError') {
        err = new AppError(`Invalid ID format supplied`, 400);
    }
    if (err.code === 11000) {
        err = handleDuplicateFields(err);
    }
    if (err.name === 'ValidationError') {
        err = handleValidationError(err);
    }
    if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
        console.error("Database Connection Failure:", err); 
        err = new AppError("Internal server configuration error.", 500);
    }
    
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

const handleDuplicateFields = (err: any) => {
    const match = err.message.match(/\s+dup key: \{ (.+?):\s+/); 
    const field = match ? match[1] : 'field';
    const message = `The provided value for field '${field}' is already in use.`;
    return new AppError(message, 400);
};

const handleValidationError = (err: any) => {
    const errors = Object.values(err.errors).map((el: any) => el.message);
    const message = `Invalid input data: ${errors.join('; ')}`;
    return new AppError(message, 400);
};
