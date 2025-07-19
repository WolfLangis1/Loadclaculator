/**
 * Enhanced Logging Service
 * Provides structured logging with different levels, request tracking, and monitoring integration
 * Includes automatic data anonymization for privacy compliance
 */

import dataAnonymizer from './dataAnonymization.js';

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.requestLogs = [];
    this.errorLogs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
    this.anonymizeLogsInProduction = process.env.ANONYMIZE_LOGS !== 'false'; // Default to true
    
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
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'email', 'phone', 'address', 'name', 'ssn', 'credit_card'];
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

  // Privacy-compliant logging methods
  
  /**
   * Log activity with automatic anonymization in production
   */
  logActivity(userId, action, details = {}, metadata = {}) {
    const logEntry = {
      timestamp: this.formatTimestamp(),
      level: 'info',
      type: 'activity',
      user_id: userId,
      action,
      details,
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
      session_id: metadata.session_id
    };

    // Apply anonymization in production
    const finalLogEntry = this.shouldAnonymize() 
      ? dataAnonymizer.anonymizeActivityLog(logEntry)
      : this.sanitizeData(logEntry);

    this.info(`User activity: ${action}`, finalLogEntry);
    return finalLogEntry;
  }

  /**
   * Log analytics event with privacy protection
   */
  logAnalyticsEvent(event, properties = {}, userContext = {}) {
    const analyticsEntry = {
      timestamp: this.formatTimestamp(),
      event,
      properties,
      user_id: userContext.user_id,
      session_id: userContext.session_id,
      ip_address: userContext.ip_address,
      user_agent: userContext.user_agent
    };

    // Apply anonymization for analytics
    const anonymizedEntry = this.shouldAnonymize()
      ? dataAnonymizer.anonymizeAnalyticsEvent(analyticsEntry)
      : this.sanitizeData(analyticsEntry);

    this.info(`Analytics: ${event}`, anonymizedEntry);
    return anonymizedEntry;
  }

  /**
   * Log error with privacy protection
   */
  logErrorWithContext(error, context = {}) {
    const errorEntry = {
      timestamp: this.formatTimestamp(),
      level: 'error',
      type: 'error_log',
      message: error.message,
      stack_trace: error.stack,
      context,
      user_id: context.user_id,
      session_id: context.session_id,
      ip_address: context.ip_address
    };

    // Apply anonymization for error logs
    const anonymizedEntry = this.shouldAnonymize()
      ? dataAnonymizer.anonymizeErrorLog(errorEntry)
      : this.sanitizeData(errorEntry);

    this.error(error.message, anonymizedEntry);
    return anonymizedEntry;
  }

  /**
   * Log data access for audit purposes
   */
  logDataAccess(userId, action, resourceType, resourceId, metadata = {}) {
    const auditEntry = {
      timestamp: this.formatTimestamp(),
      level: 'info',
      type: 'data_access',
      user_id: userId,
      action, // 'read', 'write', 'delete', etc.
      resource_type: resourceType, // 'project', 'customer', etc.
      resource_id: resourceId,
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
      success: metadata.success !== false
    };

    // Data access logs are sensitive, always apply some level of anonymization
    const anonymizedEntry = dataAnonymizer.anonymizeActivityLog(auditEntry);
    
    this.info(`Data access: ${action} ${resourceType}`, anonymizedEntry);
    return anonymizedEntry;
  }

  /**
   * Log consent changes for compliance
   */
  logConsentChange(userId, consentChanges, metadata = {}) {
    const consentEntry = {
      timestamp: this.formatTimestamp(),
      level: 'info',
      type: 'consent_change',
      user_id: userId,
      consent_changes: consentChanges,
      previous_consents: metadata.previous_consents,
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
      source: metadata.source || 'unknown'
    };

    // Consent logs are important for compliance, use pseudonymization
    const pseudonymizedEntry = {
      ...consentEntry,
      pseudonymous_user_id: dataAnonymizer.generatePseudonymousId(userId),
      ip_address: dataAnonymizer.anonymizeIP(consentEntry.ip_address),
      user_agent: dataAnonymizer.anonymizeUserAgent(consentEntry.user_agent)
    };
    delete pseudonymizedEntry.user_id;

    this.info('Consent change', pseudonymizedEntry);
    return pseudonymizedEntry;
  }

  /**
   * Create anonymized log export for compliance
   */
  exportAnonymizedLogs(dateRange = null, logTypes = ['all']) {
    let logs = this.getLogs('all', this.maxLogs);
    
    // Filter by date range if provided
    if (dateRange) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      logs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      });
    }

    // Filter by log types
    if (!logTypes.includes('all')) {
      logs = logs.filter(log => logTypes.includes(log.type));
    }

    // Apply anonymization
    const anonymizedLogs = dataAnonymizer.batchAnonymize(logs, 'activity_log');

    return {
      export_info: {
        anonymized: true,
        export_date: new Date().toISOString(),
        date_range: dateRange,
        log_types: logTypes,
        total_logs: anonymizedLogs.length
      },
      logs: anonymizedLogs
    };
  }

  /**
   * Check if logs should be anonymized
   */
  shouldAnonymize() {
    return !this.isDevelopment && this.anonymizeLogsInProduction;
  }

  /**
   * Get anonymized statistics for privacy dashboard
   */
  getAnonymizedStats() {
    const stats = this.getStats();
    
    // Remove or anonymize any potentially identifying information
    return {
      total_requests: stats.requestCount,
      total_errors: stats.errorCount,
      average_response_time: stats.averageResponseTime,
      time_range: stats.timeRange,
      // Don't include top errors as they might contain sensitive info
      anonymized: true,
      generated_at: new Date().toISOString()
    };
  }
}

// Singleton instance
const logger = new Logger();

export default logger;
export { Logger };