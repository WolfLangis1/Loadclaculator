/**
 * Centralized Logging Service
 * 
 * Provides structured logging with configurable levels, context tracking,
 * and production-safe output management.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  stack?: string;
}

class LoggingService {
  private readonly minLevel: LogLevel;
  private readonly isProduction: boolean;
  private readonly maxBufferSize = 1000;
  private logBuffer: LogEntry[] = [];
  
  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.minLevel = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const logContext = {
      ...context,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      }),
    };
    this.log(LogLevel.ERROR, message, logContext);
  }

  /**
   * Log a critical error (always logged)
   */
  critical(message: string, error?: Error, context?: LogContext): void {
    const logContext = {
      ...context,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      }),
    };
    this.log(LogLevel.CRITICAL, message, logContext);
    
    // In production, also send to error tracking service
    if (this.isProduction) {
      this.sendToErrorTracking(message, error, logContext);
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (level < this.minLevel) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    // Add to buffer
    this.addToBuffer(logEntry);

    // Output to console with appropriate method
    this.outputToConsole(logEntry);
  }

  /**
   * Output log entry to console with proper formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const prefix = `[${entry.timestamp}] ${levelName}:`;
    const message = `${prefix} ${entry.message}`;
    
    // Format context for display
    const contextString = entry.context ? 
      `\nContext: ${JSON.stringify(entry.context, null, 2)}` : '';

    switch (entry.level) {
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        console.debug(message + contextString);
        break;
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.info(message + contextString);
        break;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(message + contextString);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        // eslint-disable-next-line no-console
        console.error(message + contextString);
        if (entry.stack) {
          // eslint-disable-next-line no-console
          console.error('Stack trace:', entry.stack);
        }
        break;
    }
  }

  /**
   * Add entry to buffer (for potential upload or analysis)
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Prevent buffer overflow
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  /**
   * Send critical errors to error tracking service
   */
  private sendToErrorTracking(message: string, error?: Error, context?: LogContext): void {
    // In a real implementation, this would send to Sentry, Bugsnag, etc.
    try {
      // Placeholder for error tracking service integration
      const errorData = {
        message,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : null,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      // In production, send to your error tracking service
      // Example: Sentry.captureException(error, { extra: errorData });
      
      // For now, just ensure it's logged
      // eslint-disable-next-line no-console
      console.error('CRITICAL ERROR:', errorData);
    } catch (trackingError) {
      // Don't let error tracking failure crash the app
      // eslint-disable-next-line no-console
      console.error('Failed to send error to tracking service:', trackingError);
    }
  }

  /**
   * Get recent log entries (for debugging or support)
   */
  getRecentLogs(count = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Export logs as JSON (for support or debugging)
   */
  exportLogs(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      environment: this.isProduction ? 'production' : 'development',
      logs: this.logBuffer,
    }, null, 2);
  }

  /**
   * Create a logger with default context
   */
  createLogger(defaultContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) => 
        this.debug(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) => 
        this.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) => 
        this.warn(message, { ...defaultContext, ...context }),
      error: (message: string, error?: Error, context?: LogContext) => 
        this.error(message, error, { ...defaultContext, ...context }),
      critical: (message: string, error?: Error, context?: LogContext) => 
        this.critical(message, error, { ...defaultContext, ...context }),
    };
  }
}

// Export singleton instance
export const logger = new LoggingService();

// Convenience method for component-specific loggers
export const createComponentLogger = (componentName: string) => {
  return logger.createLogger({ component: componentName });
};

// Utility function for performance logging
export const logPerformance = (name: string, fn: () => void | Promise<void>) => {
  const start = performance.now();
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      logger.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    });
  } else {
    const duration = performance.now() - start;
    logger.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    return result;
  }
};

// Error boundary helper
export const logErrorBoundary = (error: Error, errorInfo: { componentStack: string }) => {
  logger.critical('React Error Boundary caught error', error, {
    component: 'ErrorBoundary',
    componentStack: errorInfo.componentStack,
  });
};

export default logger;