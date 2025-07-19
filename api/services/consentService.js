/**
 * User Consent Management Service
 * Handles GDPR/CCPA consent tracking, cookie consent, and third-party integrations
 */

import { createClient } from '@supabase/supabase-js';
import apiKeyManager from '../utils/apiKeyManager.js';

class ConsentService {
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
   * Available consent types and their purposes
   */
  getConsentTypes() {
    return {
      essential: {
        name: 'Essential Cookies',
        description: 'Required for basic website functionality',
        required: true,
        category: 'necessary'
      },
      analytics: {
        name: 'Analytics & Performance',
        description: 'Help us understand how you use our application',
        required: false,
        category: 'analytics'
      },
      marketing: {
        name: 'Marketing & Communications',
        description: 'Allow us to send you relevant updates and offers',
        required: false,
        category: 'marketing'
      },
      third_party_integrations: {
        name: 'Third-Party Integrations',
        description: 'Enable integrations with Google Drive, HubSpot, CompanyCam, etc.',
        required: false,
        category: 'integrations'
      },
      data_processing: {
        name: 'Data Processing',
        description: 'Process your data for electrical calculations and project management',
        required: false,
        category: 'processing'
      },
      email_communications: {
        name: 'Email Communications',
        description: 'Send you project updates, newsletters, and support communications',
        required: false,
        category: 'communications'
      }
    };
  }

  /**
   * Get current user consent status
   */
  async getUserConsent(userId) {
    try {
      const { data, error } = await this.supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Get the latest consent for each type
      const latestConsents = {};
      const consentTypes = this.getConsentTypes();

      // Initialize with defaults
      for (const [type, config] of Object.entries(consentTypes)) {
        latestConsents[type] = {
          granted: config.required, // Essential cookies default to true
          timestamp: null,
          version: null
        };
      }

      // Apply actual consents
      if (data && data.length > 0) {
        const consentMap = new Map();
        
        // Get the most recent consent for each type
        for (const consent of data) {
          const existing = consentMap.get(consent.consent_type);
          if (!existing || new Date(consent.created_at) > new Date(existing.created_at)) {
            consentMap.set(consent.consent_type, consent);
          }
        }

        // Apply to result
        for (const [type, consent] of consentMap) {
          if (latestConsents[type]) {
            latestConsents[type] = {
              granted: consent.granted,
              timestamp: consent.created_at,
              version: consent.policy_version,
              details: consent.details
            };
          }
        }
      }

      return {
        success: true,
        user_id: userId,
        consents: latestConsents,
        last_updated: data && data.length > 0 ? data[0].created_at : null
      };
    } catch (error) {
      console.error('Error getting user consent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update user consent
   */
  async updateUserConsent(userId, consentUpdates, metadata = {}) {
    try {
      const consentTypes = this.getConsentTypes();
      const timestamp = new Date().toISOString();
      const insertData = [];

      // Validate consent types
      for (const [type, granted] of Object.entries(consentUpdates)) {
        if (!consentTypes[type]) {
          throw new Error(`Invalid consent type: ${type}`);
        }

        // Check if essential consent is being denied
        if (consentTypes[type].required && !granted) {
          throw new Error(`Cannot deny consent for required type: ${type}`);
        }

        insertData.push({
          user_id: userId,
          consent_type: type,
          granted: granted,
          policy_version: '1.0.0', // Update this when privacy policy changes
          ip_address: metadata.ip_address || null,
          user_agent: metadata.user_agent || null,
          details: {
            source: metadata.source || 'user_settings',
            previous_consent: null, // Will be filled from existing data
            ...metadata.additional_details
          }
        });
      }

      // Get previous consents for audit trail
      const currentConsents = await this.getUserConsent(userId);
      if (currentConsents.success) {
        for (const item of insertData) {
          const previousConsent = currentConsents.consents[item.consent_type];
          if (previousConsent && previousConsent.timestamp) {
            item.details.previous_consent = {
              granted: previousConsent.granted,
              timestamp: previousConsent.timestamp
            };
          }
        }
      }

      // Insert new consent records
      const { data, error } = await this.supabase
        .from('user_consent')
        .insert(insertData)
        .select();

      if (error) {
        throw error;
      }

      // Log the consent change for audit purposes
      await this.logConsentChange(userId, consentUpdates, metadata);

      return {
        success: true,
        message: 'User consent updated successfully',
        updated_consents: data,
        timestamp
      };
    } catch (error) {
      console.error('Error updating user consent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize consent for new user
   */
  async initializeUserConsent(userId, initialConsents = {}, metadata = {}) {
    try {
      const consentTypes = this.getConsentTypes();
      const defaultConsents = {};

      // Set defaults
      for (const [type, config] of Object.entries(consentTypes)) {
        defaultConsents[type] = config.required; // Only essential consents granted by default
      }

      // Apply provided consents
      const finalConsents = { ...defaultConsents, ...initialConsents };

      const result = await this.updateUserConsent(userId, finalConsents, {
        ...metadata,
        source: 'user_registration'
      });

      return result;
    } catch (error) {
      console.error('Error initializing user consent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if user has granted consent for specific purpose
   */
  async hasConsent(userId, consentType) {
    try {
      const userConsent = await this.getUserConsent(userId);
      
      if (!userConsent.success) {
        return false;
      }

      const consent = userConsent.consents[consentType];
      return consent && consent.granted;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }

  /**
   * Withdraw all consents (GDPR right to withdraw consent)
   */
  async withdrawAllConsents(userId, metadata = {}) {
    try {
      const consentTypes = this.getConsentTypes();
      const withdrawalUpdates = {};

      // Withdraw all non-essential consents
      for (const [type, config] of Object.entries(consentTypes)) {
        withdrawalUpdates[type] = config.required; // Keep only required consents
      }

      const result = await this.updateUserConsent(userId, withdrawalUpdates, {
        ...metadata,
        source: 'consent_withdrawal'
      });

      return result;
    } catch (error) {
      console.error('Error withdrawing consents:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get consent statistics (for admin dashboard)
   */
  async getConsentStatistics(dateRange = null) {
    try {
      let query = this.supabase
        .from('user_consent')
        .select('consent_type, granted, created_at');

      if (dateRange) {
        if (dateRange.start) {
          query = query.gte('created_at', dateRange.start);
        }
        if (dateRange.end) {
          query = query.lte('created_at', dateRange.end);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Process statistics
      const stats = {
        total_consent_records: data.length,
        by_type: {},
        by_date: {},
        consent_rates: {}
      };

      const consentTypes = this.getConsentTypes();
      
      // Initialize type stats
      for (const type of Object.keys(consentTypes)) {
        stats.by_type[type] = {
          granted: 0,
          denied: 0,
          total: 0
        };
      }

      // Process data
      for (const record of data) {
        const type = record.consent_type;
        const date = record.created_at.split('T')[0];

        // By type
        if (stats.by_type[type]) {
          stats.by_type[type].total++;
          if (record.granted) {
            stats.by_type[type].granted++;
          } else {
            stats.by_type[type].denied++;
          }
        }

        // By date
        if (!stats.by_date[date]) {
          stats.by_date[date] = { granted: 0, denied: 0, total: 0 };
        }
        stats.by_date[date].total++;
        if (record.granted) {
          stats.by_date[date].granted++;
        } else {
          stats.by_date[date].denied++;
        }
      }

      // Calculate consent rates
      for (const [type, typeStats] of Object.entries(stats.by_type)) {
        stats.consent_rates[type] = typeStats.total > 0 
          ? (typeStats.granted / typeStats.total * 100).toFixed(2)
          : 0;
      }

      return {
        success: true,
        statistics: stats,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting consent statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Log consent changes for audit trail
   */
  async logConsentChange(userId, consentUpdates, metadata) {
    try {
      await this.supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'consent_updated',
          details: {
            consent_changes: consentUpdates,
            metadata: metadata,
            timestamp: new Date().toISOString()
          },
          ip_address: metadata.ip_address || null,
          user_agent: metadata.user_agent || null
        });
    } catch (error) {
      console.error('Error logging consent change:', error);
      // Don't throw error as this is non-critical
    }
  }

  /**
   * Get consent banner configuration
   */
  getConsentBannerConfig() {
    return {
      title: 'We value your privacy',
      message: 'We use cookies and similar technologies to provide, protect and improve our services and to personalize content. By clicking "Accept All", you consent to our use of cookies.',
      acceptAllText: 'Accept All',
      rejectAllText: 'Reject Non-Essential',
      customizeText: 'Customize Settings',
      privacyPolicyLink: '/privacy-policy',
      cookiePolicyLink: '/cookie-policy',
      position: 'bottom',
      autoShow: true,
      respectDoNotTrack: true
    };
  }
}

// Singleton instance
const consentService = new ConsentService();

export default consentService;
export { ConsentService };