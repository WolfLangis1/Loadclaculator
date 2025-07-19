/**
 * Audit Trail Service
 * Provides comprehensive audit logging for security-sensitive operations
 * Supports compliance requirements for SOX, GDPR, HIPAA, etc.
 */

import { createClient } from '@supabase/supabase-js';
import apiKeyManager from '../utils/apiKeyManager.js';
import logger from '../utils/logger.js';
import dataAnonymizer from '../utils/dataAnonymization.js';

class AuditTrailService {
  constructor() {
    const supabaseCredentials = apiKeyManager.getSupabaseCredentials();
    this.supabase = createClient(supabaseCredentials.url, supabaseCredentials.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Audit event categories and their retention periods
   */
  getAuditCategories() {
    return {
      authentication: {
        name: 'Authentication Events',
        retention_years: 7,
        critical: true,
        examples: ['login', 'logout', 'password_change', 'mfa_setup']
      },
      authorization: {
        name: 'Authorization Events',
        retention_years: 7,
        critical: true,
        examples: ['permission_grant', 'permission_revoke', 'role_change']
      },
      data_access: {
        name: 'Data Access Events',
        retention_years: 7,
        critical: true,
        examples: ['data_read', 'data_export', 'data_search']
      },
      data_modification: {
        name: 'Data Modification Events',
        retention_years: 7,
        critical: true,
        examples: ['data_create', 'data_update', 'data_delete']
      },
      privacy_rights: {
        name: 'Privacy Rights Events',
        retention_years: 7,
        critical: true,
        examples: ['data_deletion_request', 'data_export_request', 'consent_change']
      },
      system_admin: {
        name: 'System Administration',
        retention_years: 7,
        critical: true,
        examples: ['user_create', 'user_delete', 'system_config_change']
      },
      financial: {
        name: 'Financial Operations',
        retention_years: 7,
        critical: true,
        examples: ['payment_processed', 'subscription_change', 'refund_issued']
      },
      security: {
        name: 'Security Events',
        retention_years: 7,
        critical: true,
        examples: ['security_breach', 'suspicious_activity', 'failed_login_attempts']
      }
    };
  }

  /**
   * Create audit trail entry
   */
  async createAuditEntry(auditData) {
    try {
      const auditEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        category: auditData.category,
        action: auditData.action,
        actor_id: auditData.actor_id, // Who performed the action
        actor_type: auditData.actor_type || 'user', // user, system, api
        subject_id: auditData.subject_id, // What was acted upon
        subject_type: auditData.subject_type, // user, project, customer, etc.
        resource_id: auditData.resource_id,
        resource_type: auditData.resource_type,
        outcome: auditData.outcome || 'success', // success, failure, partial
        details: auditData.details || {},
        metadata: {
          ip_address: auditData.ip_address,
          user_agent: auditData.user_agent,
          session_id: auditData.session_id,
          api_key_id: auditData.api_key_id,
          correlation_id: auditData.correlation_id || crypto.randomUUID()
        },
        security_classification: auditData.security_classification || 'internal',
        retention_date: this.calculateRetentionDate(auditData.category),
        hash: null // Will be calculated
      };

      // Calculate integrity hash
      auditEntry.hash = this.calculateIntegrityHash(auditEntry);

      // Store in database
      const { data, error } = await this.supabase
        .from('audit_trail')
        .insert(auditEntry)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Also log to application logger for immediate access
      logger.info(`Audit: ${auditEntry.category}:${auditEntry.action}`, {
        audit_id: auditEntry.id,
        actor: auditEntry.actor_id,
        subject: auditEntry.subject_id,
        outcome: auditEntry.outcome
      });

      return {
        success: true,
        audit_id: data.id,
        data: data
      };
    } catch (error) {
      console.error('Error creating audit entry:', error);
      // Fallback logging if database fails
      logger.error('Audit trail creation failed', {
        error: error.message,
        audit_data: auditData
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate retention date based on category
   */
  calculateRetentionDate(category) {
    const categories = this.getAuditCategories();
    const retentionYears = categories[category]?.retention_years || 7;
    
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + retentionYears);
    
    return retentionDate.toISOString();
  }

  /**
   * Calculate integrity hash for audit entry
   */
  calculateIntegrityHash(auditEntry) {
    // Create a deterministic string representation
    const hashInput = [
      auditEntry.timestamp,
      auditEntry.category,
      auditEntry.action,
      auditEntry.actor_id,
      auditEntry.subject_id,
      auditEntry.outcome,
      JSON.stringify(auditEntry.details)
    ].join('|');

    return dataAnonymizer.hash(hashInput);
  }

  /**
   * Audit authentication events
   */
  async auditAuthentication(action, userId, details = {}, metadata = {}) {
    return await this.createAuditEntry({
      category: 'authentication',
      action,
      actor_id: userId,
      actor_type: 'user',
      subject_id: userId,
      subject_type: 'user',
      outcome: details.success ? 'success' : 'failure',
      details: {
        method: details.method, // password, oauth, mfa, etc.
        provider: details.provider, // google, github, etc.
        ip_address: metadata.ip_address,
        user_agent: metadata.user_agent,
        failure_reason: details.failure_reason
      },
      ...metadata
    });
  }

  /**
   * Audit data access events
   */
  async auditDataAccess(action, userId, resourceType, resourceId, details = {}, metadata = {}) {
    return await this.createAuditEntry({
      category: 'data_access',
      action,
      actor_id: userId,
      actor_type: 'user',
      resource_id: resourceId,
      resource_type: resourceType,
      subject_id: resourceId,
      subject_type: resourceType,
      outcome: details.success !== false ? 'success' : 'failure',
      details: {
        query_parameters: details.query_parameters,
        returned_records: details.returned_records,
        filters_applied: details.filters_applied,
        export_format: details.export_format,
        failure_reason: details.failure_reason
      },
      ...metadata
    });
  }

  /**
   * Audit data modification events
   */
  async auditDataModification(action, userId, resourceType, resourceId, details = {}, metadata = {}) {
    return await this.createAuditEntry({
      category: 'data_modification',
      action,
      actor_id: userId,
      actor_type: 'user',
      resource_id: resourceId,
      resource_type: resourceType,
      subject_id: resourceId,
      subject_type: resourceType,
      outcome: details.success !== false ? 'success' : 'failure',
      details: {
        changes_made: details.changes_made,
        previous_values: details.previous_values,
        new_values: details.new_values,
        validation_errors: details.validation_errors,
        business_justification: details.business_justification
      },
      security_classification: details.contains_pii ? 'confidential' : 'internal',
      ...metadata
    });
  }

  /**
   * Audit privacy rights events
   */
  async auditPrivacyRights(action, userId, details = {}, metadata = {}) {
    return await this.createAuditEntry({
      category: 'privacy_rights',
      action,
      actor_id: userId,
      actor_type: 'user',
      subject_id: userId,
      subject_type: 'user',
      outcome: details.success !== false ? 'success' : 'failure',
      details: {
        request_type: details.request_type, // deletion, export, rectification
        data_types: details.data_types,
        retention_period: details.retention_period,
        legal_basis: details.legal_basis,
        processor_notified: details.processor_notified
      },
      security_classification: 'confidential',
      ...metadata
    });
  }

  /**
   * Audit financial operations
   */
  async auditFinancial(action, userId, details = {}, metadata = {}) {
    return await this.createAuditEntry({
      category: 'financial',
      action,
      actor_id: userId,
      actor_type: 'user',
      subject_id: details.transaction_id || details.subscription_id,
      subject_type: details.transaction_id ? 'transaction' : 'subscription',
      outcome: details.success !== false ? 'success' : 'failure',
      details: {
        amount: details.amount,
        currency: details.currency,
        payment_method: details.payment_method,
        transaction_id: details.transaction_id,
        subscription_tier: details.subscription_tier,
        billing_period: details.billing_period,
        stripe_event_id: details.stripe_event_id
      },
      security_classification: 'confidential',
      ...metadata
    });
  }

  /**
   * Audit security events
   */
  async auditSecurity(action, details = {}, metadata = {}) {
    return await this.createAuditEntry({
      category: 'security',
      action,
      actor_id: details.actor_id || 'system',
      actor_type: details.actor_type || 'system',
      subject_id: details.subject_id,
      subject_type: details.subject_type,
      outcome: details.outcome || 'detected',
      details: {
        threat_type: details.threat_type,
        severity: details.severity,
        indicators: details.indicators,
        response_action: details.response_action,
        false_positive: details.false_positive
      },
      security_classification: 'restricted',
      ...metadata
    });
  }

  /**
   * Search audit trail
   */
  async searchAuditTrail(filters = {}, options = {}) {
    try {
      let query = this.supabase
        .from('audit_trail')
        .select('*');

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters.actor_id) {
        query = query.eq('actor_id', filters.actor_id);
      }
      
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      
      if (filters.outcome) {
        query = query.eq('outcome', filters.outcome);
      }
      
      if (filters.start_date) {
        query = query.gte('timestamp', filters.start_date);
      }
      
      if (filters.end_date) {
        query = query.lte('timestamp', filters.end_date);
      }

      // Apply sorting and pagination
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      
      query = query
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        total: count,
        filters: filters,
        options: options
      };
    } catch (error) {
      console.error('Error searching audit trail:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate audit trail report
   */
  async generateAuditReport(reportType, filters = {}) {
    try {
      const categories = this.getAuditCategories();
      
      switch (reportType) {
        case 'compliance_summary':
          return await this.generateComplianceSummary(filters);
        
        case 'security_events':
          return await this.generateSecurityEventsReport(filters);
        
        case 'data_access_report':
          return await this.generateDataAccessReport(filters);
        
        case 'user_activity':
          return await this.generateUserActivityReport(filters);
        
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
    } catch (error) {
      console.error('Error generating audit report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate compliance summary report
   */
  async generateComplianceSummary(filters) {
    const { data: auditData } = await this.searchAuditTrail(filters, { limit: 10000 });
    
    const summary = {
      report_type: 'compliance_summary',
      generated_at: new Date().toISOString(),
      period: {
        start: filters.start_date,
        end: filters.end_date
      },
      total_events: auditData.length,
      categories: {},
      outcomes: {},
      critical_events: 0
    };

    // Categorize events
    const categories = this.getAuditCategories();
    for (const event of auditData) {
      // Count by category
      if (!summary.categories[event.category]) {
        summary.categories[event.category] = {
          count: 0,
          critical: categories[event.category]?.critical || false
        };
      }
      summary.categories[event.category].count++;

      // Count by outcome
      if (!summary.outcomes[event.outcome]) {
        summary.outcomes[event.outcome] = 0;
      }
      summary.outcomes[event.outcome]++;

      // Count critical events
      if (categories[event.category]?.critical) {
        summary.critical_events++;
      }
    }

    return {
      success: true,
      data: summary
    };
  }

  /**
   * Generate security events report
   */
  async generateSecurityEventsReport(filters) {
    const securityFilters = { ...filters, category: 'security' };
    const { data: securityEvents } = await this.searchAuditTrail(securityFilters, { limit: 1000 });

    const report = {
      report_type: 'security_events',
      generated_at: new Date().toISOString(),
      total_events: securityEvents.length,
      events_by_severity: {},
      threat_types: {},
      events: securityEvents.map(event => ({
        timestamp: event.timestamp,
        action: event.action,
        severity: event.details.severity,
        threat_type: event.details.threat_type,
        outcome: event.outcome
      }))
    };

    return {
      success: true,
      data: report
    };
  }

  /**
   * Generate data access report
   */
  async generateDataAccessReport(filters) {
    const accessFilters = { ...filters, category: 'data_access' };
    const { data: accessEvents } = await this.searchAuditTrail(accessFilters, { limit: 5000 });

    const report = {
      report_type: 'data_access_report',
      generated_at: new Date().toISOString(),
      total_access_events: accessEvents.length,
      resource_types: {},
      actions: {},
      users: {}
    };

    for (const event of accessEvents) {
      // Count by resource type
      if (!report.resource_types[event.resource_type]) {
        report.resource_types[event.resource_type] = 0;
      }
      report.resource_types[event.resource_type]++;

      // Count by action
      if (!report.actions[event.action]) {
        report.actions[event.action] = 0;
      }
      report.actions[event.action]++;

      // Count by user (pseudonymized)
      const pseudoUserId = dataAnonymizer.generatePseudonymousId(event.actor_id);
      if (!report.users[pseudoUserId]) {
        report.users[pseudoUserId] = 0;
      }
      report.users[pseudoUserId]++;
    }

    return {
      success: true,
      data: report
    };
  }

  /**
   * Generate user activity report
   */
  async generateUserActivityReport(filters) {
    if (!filters.actor_id) {
      throw new Error('User ID required for user activity report');
    }

    const { data: userEvents } = await this.searchAuditTrail(filters, { limit: 1000 });

    const report = {
      report_type: 'user_activity',
      generated_at: new Date().toISOString(),
      user_id: dataAnonymizer.generatePseudonymousId(filters.actor_id),
      total_events: userEvents.length,
      categories: {},
      timeline: userEvents.map(event => ({
        timestamp: event.timestamp,
        category: event.category,
        action: event.action,
        resource_type: event.resource_type,
        outcome: event.outcome
      }))
    };

    return {
      success: true,
      data: report
    };
  }

  /**
   * Verify audit trail integrity
   */
  async verifyIntegrity(auditId = null) {
    try {
      let query = this.supabase.from('audit_trail').select('*');
      
      if (auditId) {
        query = query.eq('id', auditId);
      } else {
        // Verify recent entries
        query = query
          .order('timestamp', { ascending: false })
          .limit(100);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }

      const results = {
        verified: 0,
        corrupted: 0,
        corrupted_entries: []
      };

      for (const entry of data) {
        const calculatedHash = this.calculateIntegrityHash(entry);
        
        if (calculatedHash === entry.hash) {
          results.verified++;
        } else {
          results.corrupted++;
          results.corrupted_entries.push({
            id: entry.id,
            timestamp: entry.timestamp,
            expected_hash: calculatedHash,
            actual_hash: entry.hash
          });
        }
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Error verifying audit trail integrity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
const auditTrailService = new AuditTrailService();

export default auditTrailService;
export { AuditTrailService };