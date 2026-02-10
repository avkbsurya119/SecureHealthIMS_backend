/**
 * Centralized Error Handler Middleware
 * Catches all errors and returns standardized responses
 * Security: Never leaks sensitive information or stack traces in production
 */

import { ApiError, ApiResponse } from '../utils/errors.js';

/**
 * Global error handler middleware
 * Must be registered LAST in the middleware chain
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for internal debugging (never expose to client)
  console.error('[ERROR]', {
    name: err.name,
    message: err.message,
    errors: err.errors, // Log specific validation errors if present
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Handle operational errors (expected errors)
  if (err instanceof ApiError && err.isOperational) {
    return ApiResponse.error(res, err);
  }

  // Handle Supabase-specific errors
  if (err.code) {
    return handleSupabaseError(err, res);
  }

  // Handle unexpected errors (don't leak details)
  const safeError = new ApiError(
    process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred',
    500,
    false
  );

  return ApiResponse.error(res, safeError);
};

/**
 * Handle Supabase-specific errors
 */
function handleSupabaseError(err, res) {
  const errorMap = {
    '23505': { status: 409, message: 'Resource already exists' },
    '23503': { status: 400, message: 'Invalid reference - related resource not found' },
    '23502': { status: 400, message: 'Required field missing' },
    'PGRST116': { status: 404, message: 'Resource not found' },
    '42P01': { status: 500, message: 'Database configuration error' }
  };

  const mapped = errorMap[err.code];
  if (mapped) {
    const error = new ApiError(mapped.message, mapped.status);
    return ApiResponse.error(res, error);
  }

  // Unknown database error - don't leak details
  const error = new ApiError('Database operation failed', 500, false);
  return ApiResponse.error(res, error);
}

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(`Route ${req.method} ${req.path} not found`, 404);
  return ApiResponse.error(res, error);
};

/**
 * Async handler wrapper
 * Catches async errors and passes to error handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
