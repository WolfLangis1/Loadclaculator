/**
 * Error Handling Service
 * 
 * Provides centralized error handling with proper logging and user-friendly messages
 */

import { ErrorType, AppError } from '../types/error';

export class ErrorHandlingService {
  private static errors: AppError[] = [];
  private static maxErrors = 100;

  /**
   * Create a structured error with appropriate user message
   */
  static createError(
    type: ErrorType,
    message: string,
    userMessage: string,
    details?: any,
    context?: string
  ): AppError {
    const error: AppError = {
      type,
      message,
      userMessage,
      details,
      timestamp: new Date(),
      context,
      recoverable: this.isRecoverable(type)
    };

    this.logError(error);
    return error;
  }

  /**
   * Handle API errors with appropriate user messages
   */
  static handleApiError(error: any, context: string): AppError {
    if (error.name === 'AbortError') {
      return this.createError(
        ErrorType.NETWORK,
        'Request was aborted',
        'Request timed out. Please try again.',
        error,
        context
      );
    }

    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return this.createError(
        ErrorType.NETWORK,
        'Network connection failed',
        'Please check your internet connection and try again.',
        error,
        context
      );
    }

    if (error.status === 401) {
      return this.createError(
        ErrorType.AUTHENTICATION,
        'Authentication failed',
        'Your session has expired. Please refresh the page.',
        error,
        context
      );
    }

    if (error.status === 403) {
      return this.createError(
        ErrorType.AUTHORIZATION,
        'Authorization failed',
        'You do not have permission to access this resource.',
        error,
        context
      );
    }

    if (error.status === 429) {
      return this.createError(
        ErrorType.API_LIMIT,
        'Rate limit exceeded',
        'Too many requests. Please wait a moment and try again.',
        error,
        context
      );
    }

    if (error.status >= 500) {
      return this.createError(
        ErrorType.NETWORK,
        'Server error',
        'Server is temporarily unavailable. Please try again later.',
        error,
        context
      );
    }

    return this.createError(
      ErrorType.UNKNOWN,
      error.message || 'Unknown error occurred',
      'An unexpected error occurred. Please try again.',
      error,
      context
    );
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(
    field: string,
    value: any,
    constraint: string,
    context?: string
  ): AppError {
    return this.createError(
      ErrorType.VALIDATION,
      `Validation failed for ${field}: ${constraint}`,
      `Please check the ${field} field and ensure it ${constraint}`,
      { field, value, constraint },
      context
    );
  }

  /**
   * Handle calculation errors
   */
  static handleCalculationError(
    calculationType: string,
    input: any,
    error: any,
    context?: string
  ): AppError {
    return this.createError(
      ErrorType.CALCULATION,
      `Calculation failed for ${calculationType}: ${error.message}`,
      `Unable to perform ${calculationType}. Please check your input values.`,
      { calculationType, input, originalError: error },
      context
    );
  }

  /**
   * Handle file processing errors
   */
  static handleFileError(
    operation: string,
    fileName: string,
    error: any,
    context?: string
  ): AppError {
    return this.createError(
      ErrorType.FILE_PROCESSING,
      `File ${operation} failed for ${fileName}: ${error.message}`,
      `Unable to ${operation} file "${fileName}". Please check the file and try again.`,
      { operation, fileName, originalError: error },
      context
    );
  }

  /**
   * Wrap async operations with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string,
    fallbackValue?: T
  ): Promise<{ data?: T; error?: AppError }> {
    try {
      const data = await operation();
      return { data };
    } catch (error) {
      const appError = this.handleApiError(error, context);
      
      if (fallbackValue !== undefined) {
        return { data: fallbackValue, error: appError };
      }
      
      return { error: appError };
    }
  }

  /**
   * Create a retry wrapper for failed operations
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
    context = 'operation'
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw this.handleApiError(error, context);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw this.handleApiError(lastError, context);
  }

  /**
   * Log error appropriately based on environment
   */
  private static logError(error: AppError): void {
    // Add to error history
    this.errors.push(error);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', {
        type: error.type,
        message: error.message,
        context: error.context,
        details: error.details,
        timestamp: error.timestamp
      });
    }

    // In production, you might want to send to error tracking service
    // like Sentry, LogRocket, etc.
  }

  /**
   * Determine if error is recoverable
   */
  private static isRecoverable(type: ErrorType): boolean {
    switch (type) {
      case ErrorType.NETWORK:
      case ErrorType.API_LIMIT:
      case ErrorType.VALIDATION:
        return true;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
      case ErrorType.CALCULATION:
      case ErrorType.FILE_PROCESSING:
        return false;
      default:
        return false;
    }
  }

  /**
   * Get recent errors for debugging
   */
  static getRecentErrors(limit = 10): AppError[] {
    return this.errors.slice(-limit);
  }

  /**
   * Clear error history
   */
  static clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): Record<ErrorType, number> {
    const stats = {} as Record<ErrorType, number>;
    
    Object.values(ErrorType).forEach(type => {
      stats[type] = this.errors.filter(e => e.type === type).length;
    });
    
    return stats;
  }
}

/**
 * Error boundary hook for React components
 */
export const useErrorHandler = () => {
  const handleError = (error: any, context = 'component') => {
    return ErrorHandlingService.handleApiError(error, context);
  };

  const handleApiCall = async <T>(
    apiCall: () => Promise<T>,
    context: string,
    fallback?: T
  ) => {
    return ErrorHandlingService.withErrorHandling(apiCall, context, fallback);
  };

  return { handleError, handleApiCall };
};