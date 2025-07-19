/**
 * User Data Rights Service
 * Handles GDPR/CCPA compliance for user data rights:
 * - Right to Access (data export)
 * - Right to Erasure (data deletion)
 * - Right to Rectification (data correction)
 * - Right to Data Portability
 */

import { createClient } from '@supabase/supabase-js';
import apiKeyManager from '../utils/apiKeyManager.js';

class UserDataRightsService {
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
   * Export all user data (Right to Access / Data Portability)
   */
  async exportUserData(userId, options = {}) {
    try {
      const exportData = {
        export_info: {
          user_id: userId,
          export_date: new Date().toISOString(),
          format: options.format || 'json',
          requested_by: options.requestedBy || 'user'
        },
        personal_data: {},
        application_data: {},
        system_data: {}
      };

      // Get user profile information
      const userProfile = await this.getUserProfile(userId);
      if (userProfile) {
        exportData.personal_data.profile = userProfile;
      }

      // Get user projects
      const projects = await this.getUserProjects(userId);
      if (projects && projects.length > 0) {
        exportData.application_data.projects = projects;
      }

      // Get CRM data
      const crmData = await this.getUserCRMData(userId);
      if (crmData) {
        exportData.application_data.crm = crmData;
      }

      // Get activity logs
      const activityLogs = await this.getUserActivityLogs(userId);
      if (activityLogs && activityLogs.length > 0) {
        exportData.system_data.activity_logs = activityLogs;
      }

      // Get consent history
      const consentHistory = await this.getUserConsentHistory(userId);
      if (consentHistory && consentHistory.length > 0) {
        exportData.system_data.consent_history = consentHistory;
      }

      // Get subscription/billing data
      const subscriptionData = await this.getUserSubscriptionData(userId);
      if (subscriptionData) {
        exportData.application_data.subscription = subscriptionData;
      }

      // Log the export request
      await this.logDataRightsAction(userId, 'data_export', {
        data_types: Object.keys(exportData.application_data).concat(Object.keys(exportData.system_data)),
        export_size: JSON.stringify(exportData).length,
        format: options.format || 'json'
      });

      return {
        success: true,
        data: exportData,
        metadata: {
          total_records: this.countRecords(exportData),
          export_size_bytes: JSON.stringify(exportData).length,
          format: options.format || 'json'
        }
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete all user data (Right to Erasure)
   */
  async deleteUserData(userId, options = {}) {
    try {
      const deletionResults = {
        user_id: userId,
        deletion_date: new Date().toISOString(),
        requested_by: options.requestedBy || 'user',
        deletion_type: options.soft_delete ? 'soft' : 'hard',
        deleted_data: {}
      };

      if (options.soft_delete) {
        // Soft delete - mark as deleted but keep for recovery period
        const result = await this.softDeleteUser(userId);
        deletionResults.deleted_data = result;
      } else {
        // Hard delete - permanently remove all data
        const result = await this.hardDeleteUser(userId);
        deletionResults.deleted_data = result;
      }

      // Log the deletion request
      await this.logDataRightsAction(userId, 'data_deletion', {
        deletion_type: options.soft_delete ? 'soft' : 'hard',
        retention_period: options.soft_delete ? '30_days' : 'immediate',
        deleted_tables: Object.keys(deletionResults.deleted_data)
      });

      return {
        success: true,
        data: deletionResults
      };
    } catch (error) {
      console.error('Error deleting user data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Soft delete user (mark as deleted, keep for recovery)
   */
  async softDeleteUser(userId) {
    const deletionResults = {};
    const deletedAt = new Date().toISOString();

    try {
      // Mark user as deleted
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .update({ 
          deleted_at: deletedAt,
          email: `deleted_${userId}@example.com`, // Anonymize email
          name: 'Deleted User'
        })
        .eq('id', userId)
        .select();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      deletionResults.users = userData;

      // Anonymize user projects (but keep for potential recovery)
      const { data: projectData, error: projectError } = await this.supabase
        .from('projects')
        .update({
          name: 'Deleted Project',
          description: 'Project data deleted by user request',
          deleted_at: deletedAt
        })
        .eq('user_id', userId)
        .select();

      if (projectError && projectError.code !== 'PGRST116') {
        console.warn('Warning updating projects:', projectError.message);
      }
      deletionResults.projects = projectData;

      // Delete sensitive CRM data immediately
      await this.deleteCRMData(userId);

      return deletionResults;
    } catch (error) {
      console.error('Error in soft delete:', error);
      throw error;
    }
  }

  /**
   * Hard delete user (permanent removal)
   */
  async hardDeleteUser(userId) {
    const deletionResults = {};

    try {
      // Delete in order of foreign key dependencies
      const tablesToDelete = [
        'activity_logs',
        'user_consent',
        'crm_customers',
        'crm_projects',
        'crm_activities',
        'projects',
        'user_profiles',
        'users'
      ];

      for (const table of tablesToDelete) {
        try {
          const { data, error } = await this.supabase
            .from(table)
            .delete()
            .eq('user_id', userId)
            .select();

          if (error && error.code !== 'PGRST116') {
            console.warn(`Warning deleting from ${table}:`, error.message);
          }

          deletionResults[table] = {
            records_deleted: data?.length || 0,
            success: !error || error.code === 'PGRST116'
          };
        } catch (tableError) {
          console.warn(`Error deleting from ${table}:`, tableError.message);
          deletionResults[table] = {
            records_deleted: 0,
            success: false,
            error: tableError.message
          };
        }
      }

      return deletionResults;
    } catch (error) {
      console.error('Error in hard delete:', error);
      throw error;
    }
  }

  /**
   * Get user profile data
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error getting user profile:', error.message);
        return null;
      }

      // Remove sensitive fields
      const { password, ...profile } = data;
      return profile;
    } catch (error) {
      console.warn('Error getting user profile:', error.message);
      return null;
    }
  }

  /**
   * Get user projects
   */
  async getUserProjects(userId) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.warn('Error getting user projects:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Error getting user projects:', error.message);
      return [];
    }
  }

  /**
   * Get user CRM data
   */
  async getUserCRMData(userId) {
    try {
      const crmData = {};

      // Get CRM customers
      const { data: customers, error: customersError } = await this.supabase
        .from('crm_customers')
        .select('*')
        .eq('user_id', userId);

      if (customersError) {
        console.warn('Error getting CRM customers:', customersError.message);
      } else {
        crmData.customers = customers || [];
      }

      // Get CRM projects
      const { data: crmProjects, error: crmProjectsError } = await this.supabase
        .from('crm_projects')
        .select('*')
        .eq('user_id', userId);

      if (crmProjectsError) {
        console.warn('Error getting CRM projects:', crmProjectsError.message);
      } else {
        crmData.projects = crmProjects || [];
      }

      return Object.keys(crmData).length > 0 ? crmData : null;
    } catch (error) {
      console.warn('Error getting CRM data:', error.message);
      return null;
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(userId) {
    try {
      const { data, error } = await this.supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000); // Limit to recent 1000 entries

      if (error) {
        console.warn('Error getting activity logs:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Error getting activity logs:', error.message);
      return [];
    }
  }

  /**
   * Get user consent history
   */
  async getUserConsentHistory(userId) {
    try {
      const { data, error } = await this.supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error getting consent history:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Error getting consent history:', error.message);
      return [];
    }
  }

  /**
   * Get user subscription data
   */
  async getUserSubscriptionData(userId) {
    try {
      // This would integrate with your billing system
      // For now, return basic subscription info from user profile
      const { data, error } = await this.supabase
        .from('users')
        .select('subscription_tier, subscription_status, subscription_start_date, subscription_end_date')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error getting subscription data:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Error getting subscription data:', error.message);
      return null;
    }
  }

  /**
   * Delete CRM data
   */
  async deleteCRMData(userId) {
    try {
      // Delete CRM customers
      await this.supabase
        .from('crm_customers')
        .delete()
        .eq('user_id', userId);

      // Delete CRM projects
      await this.supabase
        .from('crm_projects')
        .delete()
        .eq('user_id', userId);

      // Delete CRM activities
      await this.supabase
        .from('crm_activities')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.warn('Error deleting CRM data:', error.message);
    }
  }

  /**
   * Log data rights action for compliance
   */
  async logDataRightsAction(userId, action, details) {
    try {
      await this.supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: `data_rights_${action}`,
          details: {
            action_type: action,
            timestamp: new Date().toISOString(),
            ...details
          },
          ip_address: null, // Could be passed from request
          user_agent: 'UserDataRightsService'
        });
    } catch (error) {
      console.warn('Error logging data rights action:', error.message);
    }
  }

  /**
   * Count total records in export data
   */
  countRecords(exportData) {
    let count = 0;
    
    const countInObject = (obj) => {
      for (const value of Object.values(obj)) {
        if (Array.isArray(value)) {
          count += value.length;
        } else if (typeof value === 'object' && value !== null) {
          count++;
          countInObject(value);
        } else if (value !== null && value !== undefined) {
          count++;
        }
      }
    };

    countInObject(exportData);
    return count;
  }

  /**
   * Generate data export in different formats
   */
  async generateExport(userId, format = 'json') {
    const exportResult = await this.exportUserData(userId, { format });
    
    if (!exportResult.success) {
      return exportResult;
    }

    const data = exportResult.data;
    
    switch (format.toLowerCase()) {
      case 'json':
        return {
          success: true,
          data: JSON.stringify(data, null, 2),
          filename: `user_data_export_${userId}_${Date.now()}.json`,
          contentType: 'application/json'
        };

      case 'csv':
        // Convert to CSV format (simplified)
        const csvData = this.convertToCSV(data);
        return {
          success: true,
          data: csvData,
          filename: `user_data_export_${userId}_${Date.now()}.csv`,
          contentType: 'text/csv'
        };

      default:
        return {
          success: false,
          error: 'Unsupported export format'
        };
    }
  }

  /**
   * Convert export data to CSV format
   */
  convertToCSV(data) {
    let csv = 'Category,Type,Field,Value\n';
    
    const flattenObject = (obj, category, type = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object') {
              flattenObject(item, category, `${type}_${key}_${index}`);
            } else {
              csv += `"${category}","${type}_${key}","${index}","${String(item).replace(/"/g, '""')}"\n`;
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          flattenObject(value, category, `${type}_${key}`);
        } else {
          csv += `"${category}","${type}","${key}","${String(value || '').replace(/"/g, '""')}"\n`;
        }
      }
    };

    flattenObject(data.personal_data, 'Personal Data');
    flattenObject(data.application_data, 'Application Data');
    flattenObject(data.system_data, 'System Data');

    return csv;
  }
}

// Singleton instance
const userDataRightsService = new UserDataRightsService();

export default userDataRightsService;
export { UserDataRightsService };