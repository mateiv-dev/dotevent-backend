export interface ValidationErrorItem {
  field: string;
  message: string;
}

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  public readonly errors?: ValidationErrorItem[] | undefined;

  constructor(
    message: string,
    statusCode: number,
    errors?: ValidationErrorItem[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
