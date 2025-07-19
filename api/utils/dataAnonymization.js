/**
 * Data Anonymization Utilities
 * Provides functions for anonymizing and pseudonymizing sensitive data for privacy compliance
 */

import crypto from 'crypto';

class DataAnonymizer {
  constructor() {
    // Salt for consistent hashing (should be stored securely in production)
    this.salt = process.env.ANONYMIZATION_SALT || 'default-salt-change-in-production';
  }

  /**
   * Hash a value with salt for consistent pseudonymization
   */
  hash(value, algorithm = 'sha256') {
    if (!value) return null;
    
    const hash = crypto.createHash(algorithm);
    hash.update(value + this.salt);
    return hash.digest('hex');
  }

  /**
   * Anonymize IP address by removing last octet
   */
  anonymizeIP(ipAddress) {
    if (!ipAddress) return null;
    
    // For IPv4
    if (ipAddress.includes('.')) {
      const parts = ipAddress.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }
    
    // For IPv6 - remove last 64 bits
    if (ipAddress.includes(':')) {
      const parts = ipAddress.split(':');
      if (parts.length >= 4) {
        return parts.slice(0, 4).join(':') + '::';
      }
    }
    
    return 'anonymized';
  }

  /**
   * Anonymize email address while preserving domain
   */
  anonymizeEmail(email) {
    if (!email || !email.includes('@')) return null;
    
    const [localPart, domain] = email.split('@');
    const hashedLocal = this.hash(localPart).substring(0, 8);
    return `${hashedLocal}@${domain}`;
  }

  /**
   * Mask sensitive strings (keep first and last characters)
   */
  maskString(str, maskChar = '*') {
    if (!str || str.length <= 2) return maskChar.repeat(3);
    
    if (str.length <= 4) {
      return str[0] + maskChar.repeat(str.length - 2) + str[str.length - 1];
    }
    
    return str.substring(0, 2) + maskChar.repeat(str.length - 4) + str.substring(str.length - 2);
  }

  /**
   * Anonymize user agent string
   */
  anonymizeUserAgent(userAgent) {
    if (!userAgent) return null;
    
    // Extract basic browser and OS info, remove detailed version numbers
    const simplified = userAgent
      .replace(/\d+\.\d+\.\d+/g, 'X.X.X') // Replace version numbers
      .replace(/\([^)]*\)/g, '(anonymized)') // Replace detailed system info
      .replace(/Chrome\/[\d.]+/g, 'Chrome/X.X.X')
      .replace(/Firefox\/[\d.]+/g, 'Firefox/X.X.X')
      .replace(/Safari\/[\d.]+/g, 'Safari/X.X.X')
      .replace(/Edge\/[\d.]+/g, 'Edge/X.X.X');
    
    return simplified;
  }

  /**
   * Generate pseudonymous ID for analytics
   */
  generatePseudonymousId(userId, sessionId = null) {
    const input = sessionId ? `${userId}-${sessionId}` : userId;
    return this.hash(input).substring(0, 16);
  }

  /**
   * Anonymize location data
   */
  anonymizeLocation(location) {
    if (!location) return null;
    
    if (typeof location === 'object') {
      // Reduce precision of coordinates
      return {
        lat: location.lat ? Math.round(location.lat * 100) / 100 : null,
        lng: location.lng ? Math.round(location.lng * 100) / 100 : null,
        city: location.city || null,
        state: location.state || null,
        country: location.country || null
        // Remove street address, postal code, etc.
      };
    }
    
    // For string addresses, remove house numbers and detailed info
    return location
      .replace(/\d+\s+/g, 'XXX ') // Replace house numbers
      .replace(/\b\d{5}(-\d{4})?\b/g, 'XXXXX'); // Replace zip codes
  }

  /**
   * Anonymize activity log data
   */
  anonymizeActivityLog(logEntry) {
    const anonymized = { ...logEntry };
    
    // Anonymize IP address
    if (anonymized.ip_address) {
      anonymized.ip_address = this.anonymizeIP(anonymized.ip_address);
    }
    
    // Anonymize user agent
    if (anonymized.user_agent) {
      anonymized.user_agent = this.anonymizeUserAgent(anonymized.user_agent);
    }
    
    // Create pseudonymous user ID
    if (anonymized.user_id) {
      anonymized.pseudonymous_user_id = this.generatePseudonymousId(anonymized.user_id);
      delete anonymized.user_id; // Remove real user ID
    }
    
    // Anonymize details if they contain sensitive info
    if (anonymized.details && typeof anonymized.details === 'object') {
      anonymized.details = this.anonymizeObjectDetails(anonymized.details);
    }
    
    return anonymized;
  }

  /**
   * Recursively anonymize object details
   */
  anonymizeObjectDetails(obj) {
    const anonymized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check for fields that should be anonymized
      if (lowerKey.includes('email')) {
        anonymized[key] = value ? this.anonymizeEmail(value) : value;
      } else if (lowerKey.includes('ip') || lowerKey.includes('address')) {
        anonymized[key] = value ? this.anonymizeIP(value) : value;
      } else if (lowerKey.includes('name') && typeof value === 'string') {
        anonymized[key] = value ? this.maskString(value) : value;
      } else if (lowerKey.includes('phone')) {
        anonymized[key] = value ? this.maskString(value) : value;
      } else if (typeof value === 'object' && value !== null) {
        anonymized[key] = this.anonymizeObjectDetails(value);
      } else {
        anonymized[key] = value;
      }
    }
    
    return anonymized;
  }

  /**
   * Anonymize analytics event data
   */
  anonymizeAnalyticsEvent(event) {
    const anonymized = { ...event };
    
    // Create pseudonymous identifiers
    if (anonymized.user_id) {
      anonymized.pseudonymous_user_id = this.generatePseudonymousId(anonymized.user_id);
      delete anonymized.user_id;
    }
    
    if (anonymized.session_id) {
      anonymized.pseudonymous_session_id = this.hash(anonymized.session_id).substring(0, 12);
      delete anonymized.session_id;
    }
    
    // Remove or anonymize PII from properties
    if (anonymized.properties) {
      anonymized.properties = this.anonymizeObjectDetails(anonymized.properties);
    }
    
    // Anonymize referrer URLs (remove query parameters that might contain PII)
    if (anonymized.referrer) {
      try {
        const url = new URL(anonymized.referrer);
        anonymized.referrer = `${url.protocol}//${url.hostname}${url.pathname}`;
      } catch (e) {
        anonymized.referrer = 'invalid-url';
      }
    }
    
    return anonymized;
  }

  /**
   * Anonymize error log data
   */
  anonymizeErrorLog(errorLog) {
    const anonymized = { ...errorLog };
    
    // Anonymize user identification
    if (anonymized.user_id) {
      anonymized.pseudonymous_user_id = this.generatePseudonymousId(anonymized.user_id);
      delete anonymized.user_id;
    }
    
    // Clean stack traces of potential PII
    if (anonymized.stack_trace) {
      anonymized.stack_trace = anonymized.stack_trace
        .replace(/\/Users\/[^/]+/g, '/Users/***') // Remove usernames from paths
        .replace(/\/home\/[^/]+/g, '/home/***')
        .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\***')
        .replace(/email=[^&\s]+/g, 'email=***') // Remove email from URLs
        .replace(/token=[^&\s]+/g, 'token=***'); // Remove tokens
    }
    
    // Anonymize error context
    if (anonymized.context) {
      anonymized.context = this.anonymizeObjectDetails(anonymized.context);
    }
    
    return anonymized;
  }

  /**
   * Batch anonymize multiple records
   */
  batchAnonymize(records, type = 'activity_log') {
    if (!Array.isArray(records)) return [];
    
    return records.map(record => {
      switch (type) {
        case 'activity_log':
          return this.anonymizeActivityLog(record);
        case 'analytics':
          return this.anonymizeAnalyticsEvent(record);
        case 'error_log':
          return this.anonymizeErrorLog(record);
        default:
          return this.anonymizeObjectDetails(record);
      }
    });
  }

  /**
   * Generate anonymized data export
   */
  createAnonymizedExport(data) {
    const anonymized = {
      export_info: {
        anonymized: true,
        anonymization_date: new Date().toISOString(),
        anonymization_method: 'pseudonymization_with_hashing'
      },
      data: {}
    };
    
    for (const [category, records] of Object.entries(data)) {
      if (Array.isArray(records)) {
        anonymized.data[category] = this.batchAnonymize(records, category);
      } else if (typeof records === 'object' && records !== null) {
        anonymized.data[category] = this.anonymizeObjectDetails(records);
      } else {
        anonymized.data[category] = records;
      }
    }
    
    return anonymized;
  }

  /**
   * Check if data contains potential PII
   */
  containsPII(data) {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    
    const piiFields = [
      'email', 'name', 'phone', 'address', 'ssn', 'credit_card',
      'ip_address', 'user_agent', 'location', 'user_id'
    ];
    
    const checkObject = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        // Check if key name suggests PII
        if (piiFields.some(field => lowerKey.includes(field))) {
          return true;
        }
        
        // Check if value looks like PII (basic patterns)
        if (typeof value === 'string') {
          if (value.includes('@') && value.includes('.')) return true; // Email pattern
          if (/^\d{3}-\d{3}-\d{4}$/.test(value)) return true; // Phone pattern
          if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) return true; // IP pattern
        }
        
        // Recursively check nested objects
        if (typeof value === 'object' && value !== null) {
          if (checkObject(value)) return true;
        }
      }
      return false;
    };
    
    return checkObject(data);
  }
}

// Singleton instance
const dataAnonymizer = new DataAnonymizer();

export default dataAnonymizer;
export { DataAnonymizer };