/**
 * Data Retention and Privacy Compliance Service
 * Handles automated data cleanup, retention policies, and GDPR/CCPA compliance
 */

import { createClient } from '@supabase/supabase-js';
import apiKeyManager from '../utils/apiKeyManager.js';

class DataRetentionService {
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
   * Data retention policies configuration
   */
  getRetentionPolicies() {
    return {
      activity_logs: {
        retention_days: 365, // 1 year
        description: 'User activity and API access logs'
      },
      guest_sessions: {
        retention_days: 30, // 30 days
        description: 'Guest user session data'
      },
      analytics_cache: {
        retention_hours: 24, // 24 hours
        description: 'Cached analytics and reporting data'
      },
      deleted_users: {
        retention_days: 30, // 30 days for recovery
        description: 'Soft-deleted user accounts'
      },
      email_logs: {
        retention_days: 90, // 3 months
        description: 'Email communication logs'
      },
      error_logs: {
        retention_days: 90, // 3 months
        description: 'Application error logs'
      },
      audit_trails: {
        retention_days: 2555, // 7 years (compliance requirement)
        description: 'Security and compliance audit logs'
      }
    };
  }

  /**
   * Clean up expired activity logs
   */
  async cleanupActivityLogs() {
    const policy = this.getRetentionPolicies().activity_logs;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

    try {
      const { data, error } = await this.supabase
        .from('activity_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw error;
      }

      return {
        success: true,
        cleaned_records: data?.length || 0,
        cutoff_date: cutoffDate.toISOString(),
        policy: policy.description
      };
    } catch (error) {
      console.error('Error cleaning up activity logs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up expired guest user sessions
   */
  async cleanupGuestSessions() {
    const policy = this.getRetentionPolicies().guest_sessions;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

    try {
      // Find guest users that haven't been active
      const { data: expiredGuests, error: findError } = await this.supabase
        .from('users')
        .select('id')
        .eq('is_guest', true)
        .lt('last_sign_in_at', cutoffDate.toISOString());

      if (findError) {
        throw findError;
      }

      if (!expiredGuests || expiredGuests.length === 0) {
        return {
          success: true,
          cleaned_records: 0,
          message: 'No expired guest sessions found'
        };
      }

      const guestIds = expiredGuests.map(guest => guest.id);

      // Delete guest user projects and data
      await this.supabase
        .from('projects')
        .delete()
        .in('user_id', guestIds);

      // Delete guest user records
      const { data, error } = await this.supabase
        .from('users')
        .delete()
        .in('id', guestIds);

      if (error) {
        throw error;
      }

      return {
        success: true,
        cleaned_records: guestIds.length,
        cutoff_date: cutoffDate.toISOString(),
        policy: policy.description
      };
    } catch (error) {
      console.error('Error cleaning up guest sessions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up expired analytics cache
   */
  async cleanupAnalyticsCache() {
    const policy = this.getRetentionPolicies().analytics_cache;
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - policy.retention_hours);

    try {
      // Clean up cached analytics data (if you have such a table)
      // This is a placeholder - implement based on your analytics storage
      
      return {
        success: true,
        cleaned_records: 0,
        cutoff_date: cutoffDate.toISOString(),
        policy: policy.description,
        note: 'Analytics cache cleanup - implement based on your caching strategy'
      };
    } catch (error) {
      console.error('Error cleaning up analytics cache:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up soft-deleted users
   */
  async cleanupSoftDeletedUsers() {
    const policy = this.getRetentionPolicies().deleted_users;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

    try {
      // Find soft-deleted users past retention period
      const { data: deletedUsers, error: findError } = await this.supabase
        .from('users')
        .select('id')
        .eq('deleted_at', true)
        .lt('deleted_at', cutoffDate.toISOString());

      if (findError) {
        throw findError;
      }

      if (!deletedUsers || deletedUsers.length === 0) {
        return {
          success: true,
          cleaned_records: 0,
          message: 'No expired soft-deleted users found'
        };
      }

      const userIds = deletedUsers.map(user => user.id);

      // Permanently delete user data
      await this.hardDeleteUserData(userIds);

      return {
        success: true,
        cleaned_records: userIds.length,
        cutoff_date: cutoffDate.toISOString(),
        policy: policy.description
      };
    } catch (error) {
      console.error('Error cleaning up soft-deleted users:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Permanently delete user data (GDPR compliance)
   */
  async hardDeleteUserData(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { success: true, message: 'No users to delete' };
    }

    try {
      // Delete in order of foreign key dependencies
      const tablesToClean = [
        'activity_logs',
        'projects',
        'crm_customers',
        'crm_projects',
        'user_profiles',
        'users'
      ];

      const results = {};

      for (const table of tablesToClean) {
        try {
          const { data, error } = await this.supabase
            .from(table)
            .delete()
            .in('user_id', userIds);

          if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
            console.warn(`Warning deleting from ${table}:`, error.message);
          }

          results[table] = {
            success: !error || error.code === 'PGRST116',
            records_deleted: data?.length || 0
          };
        } catch (tableError) {
          console.warn(`Error deleting from ${table}:`, tableError.message);
          results[table] = {
            success: false,
            error: tableError.message
          };
        }
      }

      return {
        success: true,
        deleted_users: userIds.length,
        table_results: results
      };
    } catch (error) {
      console.error('Error in hard delete user data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run all cleanup tasks
   */
  async runAllCleanupTasks() {
    console.log('Starting data retention cleanup tasks...');
    
    const results = {
      timestamp: new Date().toISOString(),
      tasks: {}
    };

    // Run cleanup tasks
    const tasks = [
      { name: 'activity_logs', method: 'cleanupActivityLogs' },
      { name: 'guest_sessions', method: 'cleanupGuestSessions' },
      { name: 'analytics_cache', method: 'cleanupAnalyticsCache' },
      { name: 'soft_deleted_users', method: 'cleanupSoftDeletedUsers' }
    ];

    for (const task of tasks) {
      try {
        console.log(`Running cleanup task: ${task.name}`);
        results.tasks[task.name] = await this[task.method]();
      } catch (error) {
        console.error(`Error in cleanup task ${task.name}:`, error);
        results.tasks[task.name] = {
          success: false,
          error: error.message
        };
      }
    }

    // Log cleanup results
    await this.logCleanupResults(results);

    return results;
  }

  /**
   * Log cleanup results for audit purposes
   */
  async logCleanupResults(results) {
    try {
      const totalCleaned = Object.values(results.tasks)
        .reduce((sum, task) => sum + (task.cleaned_records || 0), 0);

      await this.supabase
        .from('activity_logs')
        .insert({
          user_id: null,
          action: 'data_retention_cleanup',
          details: {
            total_records_cleaned: totalCleaned,
            tasks_completed: Object.keys(results.tasks).length,
            tasks_successful: Object.values(results.tasks).filter(t => t.success).length,
            full_results: results
          },
          ip_address: '127.0.0.1',
          user_agent: 'DataRetentionService'
        });
    } catch (error) {
      console.error('Error logging cleanup results:', error);
    }
  }

  /**
   * Get data retention status report
   */
  async getRetentionStatusReport() {
    try {
      const policies = this.getRetentionPolicies();
      const report = {
        timestamp: new Date().toISOString(),
        policies,
        current_data_counts: {},
        upcoming_cleanup_estimates: {}
      };

      // Get current data counts
      for (const [tableName] of Object.entries(policies)) {
        try {
          if (tableName === 'analytics_cache') continue; // Skip if not implemented
          
          const { count, error } = await this.supabase
            .from(tableName.replace('_', ''))
            .select('*', { count: 'exact', head: true });

          if (!error) {
            report.current_data_counts[tableName] = count;
          }
        } catch (error) {
          // Ignore tables that don't exist
          report.current_data_counts[tableName] = 'N/A';
        }
      }

      return report;
    } catch (error) {
      console.error('Error generating retention status report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Schedule cleanup tasks (to be called by cron job or scheduler)
   */
  static async scheduleCleanup() {
    const service = new DataRetentionService();
    return await service.runAllCleanupTasks();
  }
}

// Singleton instance
const dataRetentionService = new DataRetentionService();

export default dataRetentionService;
export { DataRetentionService };