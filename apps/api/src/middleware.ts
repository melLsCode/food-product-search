import type { ErrorRequestHandler, RequestHandler } from 'express';

import { AppError, NotFoundError } from './errors.js';

/** Turns an unmatched route into an AppError so it uses the same response shape. */
export const notFound: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError('Route not found'));
};

/**
 * The single place that maps an error onto an HTTP response. Anything that is not
 * an AppError is treated as a bug: it is logged in full and reported as a generic
 * 500, so stack traces and third-party error details never reach the client.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  console.error('Unhandled error:', error);

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
};
