/**
 * Custom Error Classes for Healthcare API
 * Provides standardized error handling with appropriate HTTP status codes
 */

/**
 * Base API Error Class
 */
export class ApiError extends Error {
    /**
     * @param {string} message - Error description
     * @param {number} statusCode - HTTP status code
     * @param {boolean} isOperational - Whether the error is trusted (operational) or a programmer error
     */
    constructor(message, statusCode, isOperational = true) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      this.timestamp = new Date().toISOString();
      Error.captureStackTrace(this, this.constructor);
    }
  }

/**
 * 401 Unauthorized - Authentication failed
 */
export class UnauthenticatedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'UnauthenticatedError';
  }
}

/**
 * 403 Forbidden - Authorization failed (authenticated but not permitted)
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 422 Validation Error
 */
export class ValidationError extends ApiError {
  constructor(message, errors = []) {
    super(message, 422);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * 409 Conflict - Resource already exists
 */
export class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * 403 Consent Required - Patient hasn't granted consent
 */
export class ConsentRequiredError extends ApiError {
  constructor(message = 'Patient consent required to access this resource') {
    super(message, 403);
    this.name = 'ConsentRequiredError';
  }
}

/**
 * 403 Ownership Error - User doesn't own the resource
 */
export class OwnershipError extends ApiError {
  constructor(message = 'You do not own this resource') {
    super(message, 403);
    this.name = 'OwnershipError';
  }
}

/**
 * 429 Rate Limit Error
 */
export class RateLimitError extends ApiError {
  constructor(message = 'Too many requests. Please try again later') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error') {
    super(message, 500, false);
    this.name = 'InternalServerError';
  }
}

/**
 * Standardized API Response Helpers
 */
export class ApiResponse {
  /**
   * Success response (200)
   */
  static success(res, data, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Created response (201)
   */
  static created(res, data, message = 'Resource created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * No content response (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Error response (standardized format)
   */
  static error(res, error) {
    const statusCode = error.statusCode || 500;
    const message = error.isOperational ? error.message : 'Internal server error';

    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        type: error.name || 'Error',
        ...(error.errors && { details: error.errors }),
        timestamp: error.timestamp || new Date().toISOString()
      }
    });
  }
}
