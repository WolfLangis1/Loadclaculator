/**
 * Enhanced Logging Service
 * Provides structured logging with different levels, request tracking, and monitoring integration
 */

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.requestLogs = [];
    this.errorLogs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
    
    // Start log cleanup interval
    setInterval(() => this.cleanup(), 300000); // Every 5 minutes
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  createLogEntry(level, message, data = {}, context = {}) {
    return {
      timestamp: this.formatTimestamp(),
      level: level.toUpperCase(),
      message,
      data,
      context,
      processId: process.pid,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  log(level, message, data = {}, context = {}) {
    const logEntry = this.createLogEntry(level, message, data, context);
    
    // Console output with colors and emojis
    this.outputToConsole(logEntry);
    
    // Store in memory for API access
    this.storeLog(logEntry);
    
    // In production, send to external logging service
    if (!this.isDevelopment) {
      this.sendToExternalService(logEntry);
    }
  }

  outputToConsole(logEntry) {
    const { timestamp, level, message, data, context } = logEntry;
    
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[90m', // Gray
      SUCCESS: '\x1b[32m' // Green
    };
    
    const emojis = {
      ERROR: '🚨',
      WARN: '⚠️',
      INFO: 'ℹ️',
      DEBUG: '🔍',
      SUCCESS: '✅'
    };
    
    const reset = '\x1b[0m';
    const color = colors[level] || '';
    const emoji = emojis[level] || '';
    
    let output = `${color}${emoji} [${timestamp}] ${level}: ${message}${reset}`;
    
    if (Object.keys(data).length > 0) {
      output += `\n${color}   Data: ${JSON.stringify(data, null, 2)}${reset}`;
    }
    
    if (Object.keys(context).length > 0) {
      output += `\n${color}   Context: ${JSON.stringify(context, null, 2)}${reset}`;
    }
    
    console.log(output);
  }

  storeLog(logEntry) {
    // Store request logs separately for performance monitoring
    if (logEntry.context.type === 'request') {
      this.requestLogs.push(logEntry);
      if (this.requestLogs.length > this.maxLogs) {
        this.requestLogs.shift();
      }
    }
    
    // Store error logs for debugging
    if (logEntry.level === 'ERROR') {
      this.errorLogs.push(logEntry);
      if (this.errorLogs.length > this.maxLogs) {
        this.errorLogs.shift();
      }
    }
  }

  async sendToExternalService(logEntry) {
    // TODO: Implement integration with external logging services
    // Examples: Sentry, DataDog, CloudWatch, etc.
    
    try {
      // Example for Sentry integration
      if (process.env.SENTRY_DSN && logEntry.level === 'ERROR') {
        // await Sentry.captureException(new Error(logEntry.message), {
        //   tags: logEntry.context,
        //   extra: logEntry.data
        // });
      }
      
      // Example for custom webhook
      if (process.env.LOGGING_WEBHOOK_URL) {
        // await fetch(process.env.LOGGING_WEBHOOK_URL, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(logEntry)
        // });
      }
    } catch (error) {
      // Don't throw errors for logging failures
      console.error('Failed to send log to external service:', error.message);
    }
  }

  cleanup() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    this.requestLogs = this.requestLogs.filter(
      log => now - new Date(log.timestamp).getTime() < maxAge
    );
    
    this.errorLogs = this.errorLogs.filter(
      log => now - new Date(log.timestamp).getTime() < maxAge
    );
  }

  // Convenience methods
  error(message, data = {}, context = {}) {
    this.log('error', message, data, context);
  }

  warn(message, data = {}, context = {}) {
    this.log('warn', message, data, context);
  }

  info(message, data = {}, context = {}) {
    this.log('info', message, data, context);
  }

  debug(message, data = {}, context = {}) {
    if (this.isDevelopment) {
      this.log('debug', message, data, context);
    }
  }

  success(message, data = {}, context = {}) {
    this.log('success', message, data, context);
  }

  // Request logging
  logRequest(req, res, duration) {
    const context = {
      type: 'request',
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
          req.headers['x-real-ip'] || 
          req.connection?.remoteAddress || 
          req.ip || 'unknown',
      statusCode: res.statusCode,
      duration: `${duration}ms`
    };

    const level = res.statusCode >= 500 ? 'error' : 
                  res.statusCode >= 400 ? 'warn' : 'info';
    
    this.log(level, `${req.method} ${req.url} - ${res.statusCode}`, {}, context);
  }

  // API error logging
  logApiError(error, endpoint, requestData = {}) {
    const context = {
      type: 'api_error',
      endpoint,
      errorCode: error.code || 'UNKNOWN',
      statusCode: error.statusCode || 500
    };

    this.error(error.message, { 
      stack: error.stack,
      requestData: this.sanitizeData(requestData)
    }, context);
  }

  // Security event logging
  logSecurityEvent(event, severity = 'warn', data = {}) {
    const context = {
      type: 'security',
      event,
      severity
    };

    this.log(severity, `Security event: ${event}`, this.sanitizeData(data), context);
  }

  // Performance logging
  logPerformance(operation, duration, data = {}) {
    const context = {
      type: 'performance',
      operation,
      duration: `${duration}ms`
    };

    const level = duration > 5000 ? 'warn' : 'info';
    this.log(level, `Performance: ${operation}`, data, context);
  }

  // Rate limit logging
  logRateLimit(identifier, limit, remaining) {
    const context = {
      type: 'rate_limit',
      identifier: this.hashIdentifier(identifier),
      limit,
      remaining
    };

    const level = remaining === 0 ? 'warn' : 'debug';
    this.log(level, 'Rate limit check', {}, context);
  }

  // Sanitize sensitive data
  sanitizeData(data) {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...data };

    const sanitizeValue = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          obj[key] = '***REDACTED***';
        } else if (typeof value === 'object' && value !== null) {
          sanitizeValue(value, fullPath);
        }
      }
    };

    sanitizeValue(sanitized);
    return sanitized;
  }

  // Hash identifier for privacy
  hashIdentifier(identifier) {
    // Simple hash for logging (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Get logs for monitoring dashboard
  getLogs(type = 'all', limit = 100) {
    let logs = [];
    
    switch (type) {
      case 'requests':
        logs = this.requestLogs;
        break;
      case 'errors':
        logs = this.errorLogs;
        break;
      case 'all':
      default:
        logs = [...this.requestLogs, ...this.errorLogs]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
    }
    
    return logs.slice(0, limit);
  }

  // Get log statistics
  getStats() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    const recentRequests = this.requestLogs.filter(
      log => new Date(log.timestamp).getTime() > oneHourAgo
    );
    
    const recentErrors = this.errorLogs.filter(
      log => new Date(log.timestamp).getTime() > oneHourAgo
    );
    
    const statusCodes = {};
    recentRequests.forEach(log => {
      const code = log.context.statusCode;
      statusCodes[code] = (statusCodes[code] || 0) + 1;
    });
    
    return {
      totalRequests: recentRequests.length,
      totalErrors: recentErrors.length,
      errorRate: recentRequests.length > 0 ? 
        (recentErrors.length / recentRequests.length) * 100 : 0,
      statusCodes,
      topErrors: this.getTopErrors(recentErrors),
      timeRange: '1 hour'
    };
  }

  getTopErrors(errorLogs) {
    const errorCounts = {};
    errorLogs.forEach(log => {
      const key = log.message;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));
  }
}

// Singleton instance
const logger = new Logger();

export default logger;
export { Logger };