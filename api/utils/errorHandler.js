/**
 * Enhanced Error Handler
 * Centralized error handling with logging, monitoring, and security features
 */

class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, ApiError);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: this.stack,
        details: this.details
      })
    };
  }
}

class ErrorHandler {
  static logError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode || 500,
        code: error.code || 'UNKNOWN_ERROR'
      },
      context,
      environment: process.env.NODE_ENV
    };

    // Log to console (in production, this should go to proper logging service)
    if (error.statusCode >= 500) {
      console.error('🚨 Server Error:', JSON.stringify(errorInfo, null, 2));
    } else if (error.statusCode >= 400) {
      console.warn('⚠️  Client Error:', JSON.stringify(errorInfo, null, 2));
    } else {
      console.info('ℹ️  Info:', JSON.stringify(errorInfo, null, 2));
    }

    // In production, send to monitoring service (e.g., Sentry, DataDog)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement monitoring service integration
      // await this.sendToMonitoring(errorInfo);
    }

    return errorInfo;
  }

  static createApiError(message, statusCode = 500, code = null, details = null) {
    return new ApiError(
      message, 
      statusCode, 
      code || this.getErrorCode(statusCode), 
      details
    );
  }

  static getErrorCode(statusCode) {
    const errorCodes = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED', 
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT'
    };
    
    return errorCodes[statusCode] || 'UNKNOWN_ERROR';
  }

  static handleApiKeyError(keyName, originalError = null) {
    const error = this.createApiError(
      `API key not configured: ${keyName}`,
      503,
      'API_KEY_MISSING',
      { keyName, originalError: originalError?.message }
    );
    
    this.logError(error, { keyName, type: 'api_key_error' });
    return error;
  }

  static handleRateLimitError(limit, windowMs, identifier) {
    const error = this.createApiError(
      'Rate limit exceeded. Please try again later.',
      429,
      'RATE_LIMITED',
      { limit, windowMs, identifier }
    );
    
    this.logError(error, { type: 'rate_limit', identifier });
    return error;
  }

  static handleValidationError(validationErrors) {
    const error = this.createApiError(
      'Request validation failed',
      400,
      'VALIDATION_ERROR',
      { validationErrors }
    );
    
    this.logError(error, { type: 'validation', errors: validationErrors });
    return error;
  }

  static handleExternalApiError(service, originalError, statusCode = null) {
    const status = statusCode || originalError.status || 502;
    const error = this.createApiError(
      `External API error: ${service}`,
      status,
      'EXTERNAL_API_ERROR',
      { 
        service, 
        originalMessage: originalError.message,
        originalStatus: originalError.status 
      }
    );
    
    this.logError(error, { type: 'external_api', service });
    return error;
  }

  static handleDatabaseError(operation, originalError) {
    const error = this.createApiError(
      'Database operation failed',
      500,
      'DATABASE_ERROR',
      { operation, originalMessage: originalError.message }
    );
    
    this.logError(error, { type: 'database', operation });
    return error;
  }

  static async sendResponse(res, error) {
    const statusCode = error.statusCode || 500;
    const response = error.toJSON ? error.toJSON() : {
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      statusCode: 500,
      timestamp: new Date().toISOString()
    };

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Don't expose internal details in production
    if (process.env.NODE_ENV === 'production') {
      delete response.stack;
      delete response.details;
      
      // Generic error messages for security
      if (statusCode >= 500) {
        response.message = 'Internal server error';
      }
    }

    res.status(statusCode).json(response);
  }

  static expressErrorHandler() {
    return (error, req, res, next) => {
      // Skip if response already sent
      if (res.headersSent) {
        return next(error);
      }

      // Log the error with request context
      const context = {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress,
        body: req.method !== 'GET' ? req.body : undefined
      };

      this.logError(error, context);

      // Convert to ApiError if needed
      const apiError = error instanceof ApiError ? error : 
        this.createApiError(error.message || 'Internal server error');

      this.sendResponse(res, apiError);
    };
  }

  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static notFoundHandler() {
    return (req, res, next) => {
      const error = this.createApiError(
        `Route not found: ${req.method} ${req.url}`,
        404,
        'ROUTE_NOT_FOUND'
      );
      next(error);
    };
  }

  // Utility method to check if error is retryable
  static isRetryableError(error) {
    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
    const retryableStatus = [429, 502, 503, 504];
    
    return retryableCodes.includes(error.code) || 
           retryableStatus.includes(error.statusCode) ||
           retryableStatus.includes(error.status);
  }

  // Create circuit breaker pattern for external APIs
  static createCircuitBreaker(serviceName, options = {}) {
    const defaults = {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitorTimeout: 5000
    };
    
    const config = { ...defaults, ...options };
    let failures = 0;
    let lastFailureTime = null;
    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

    return async (operation) => {
      // Check if circuit should be half-open
      if (state === 'OPEN' && 
          Date.now() - lastFailureTime > config.resetTimeout) {
        state = 'HALF_OPEN';
      }

      // Reject if circuit is open
      if (state === 'OPEN') {
        throw this.createApiError(
          `Service ${serviceName} is temporarily unavailable`,
          503,
          'CIRCUIT_BREAKER_OPEN'
        );
      }

      try {
        const result = await operation();
        
        // Reset on success
        if (state === 'HALF_OPEN') {
          failures = 0;
          state = 'CLOSED';
        }
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = Date.now();

        // Open circuit if threshold reached
        if (failures >= config.failureThreshold) {
          state = 'OPEN';
        }

        throw error;
      }
    };
  }
}

export default ErrorHandler;
export { ApiError, ErrorHandler };