import ERROR_CODES from '../constants/errorCodes.js';

/**
 * Custom API error class.
 * Extends Error so it can be thrown anywhere and caught by global error middleware.
 *
 * @example
 * throw new ApiError(404, 'Incident not found', ERROR_CODES.NOT_FOUND);
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable message
   * @param {string} code - Machine-readable error code from ERROR_CODES
   * @param {any} [details] - Optional extra detail (validation errors, etc.)
   */
  constructor(
    statusCode = 500,
    message = 'Internal Server Error',
    code = ERROR_CODES.INTERNAL_ERROR,
    details = null
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes from programmer errors

    // Preserve stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  // ── Static factories ───────────────────────────────────────────────────────

  static badRequest(message = 'Bad Request', details = null) {
    return new ApiError(400, message, ERROR_CODES.INVALID_INPUT, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, ERROR_CODES.FORBIDDEN);
  }

  static notFound(resource = 'Resource') {
    return new ApiError(404, `${resource} not found`, ERROR_CODES.NOT_FOUND);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, message, ERROR_CODES.CONFLICT);
  }

  static validationError(details) {
    return new ApiError(422, 'Validation failed', ERROR_CODES.VALIDATION_ERROR, details);
  }

  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message, ERROR_CODES.INTERNAL_ERROR);
  }

  static serviceUnavailable(service) {
    return new ApiError(
      503,
      `${service} is not available`,
      ERROR_CODES.SERVICE_UNAVAILABLE
    );
  }
}

export default ApiError;
