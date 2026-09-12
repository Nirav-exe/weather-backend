/**
 * Operational error type for expected failures (bad input, upstream 404s,
 * upstream outages, etc). Anything thrown that is NOT an ApiError is treated
 * by the error handler as an unexpected bug and its details are hidden from
 * the client.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
