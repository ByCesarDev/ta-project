import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || (res.statusCode !== 200 && res.statusCode !== 201 ? res.statusCode : 500);

  const responseBody = {
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected server error occurred.',
    ...(err.code ? { code: err.code } : {}),
    ...(err.details ? { details: err.details } : {}),
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  };

  res.status(statusCode).json(responseBody);
};
