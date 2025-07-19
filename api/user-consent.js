// User Consent Management API
import { cors } from './utils/middleware.js';
import consentService from './services/consentService.js';
import { schemas, ValidationSchema } from './utils/validation.js';
import jwt from 'jsonwebtoken';
import apiKeyManager from './utils/apiKeyManager.js';

// Validation schema for consent updates
const consentUpdateSchema = new ValidationSchema()
  .boolean('essential', false)
  .boolean('analytics', false)
  .boolean('marketing', false)
  .boolean('third_party_integrations', false)
  .boolean('data_processing', false)
  .boolean('email_communications', false);

export default async function handler(req, res) {
  // Apply secure CORS middleware
  if (cors(req, res)) return;

  try {
    // For GET requests to banner config, no auth required
    if (req.method === 'GET' && req.query.action === 'banner_config') {
      const config = consentService.getConsentBannerConfig();
      return res.status(200).json({
        success: true,
        data: config
      });
    }

    // For GET requests to consent types, no auth required
    if (req.method === 'GET' && req.query.action === 'consent_types') {
      const types = consentService.getConsentTypes();
      return res.status(200).json({
        success: true,
        data: types
      });
    }

    // Verify JWT token for user-specific operations
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      const jwtSecret = apiKeyManager.getJwtSecret();
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userId = decoded.userId;

    // Extract client metadata for audit trail
    const metadata = {
      ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
      source: req.body?.source || 'api'
    };

    switch (req.method) {
      case 'GET':
        const { action } = req.query;

        if (action === 'status' || !action) {
          // Get user's current consent status
          const consentStatus = await consentService.getUserConsent(userId);
          
          if (!consentStatus.success) {
            return res.status(500).json({
              success: false,
              error: 'Failed to retrieve consent status'
            });
          }

          return res.status(200).json({
            success: true,
            data: consentStatus
          });
        } else if (action === 'statistics') {
          // Admin only - get consent statistics
          if (!decoded.isAdmin && decoded.subscriptionTier !== 'enterprise') {
            return res.status(403).json({ error: 'Administrative access required' });
          }

          const { start_date, end_date } = req.query;
          const dateRange = {};
          
          if (start_date) dateRange.start = start_date;
          if (end_date) dateRange.end = end_date;

          const stats = await consentService.getConsentStatistics(
            Object.keys(dateRange).length > 0 ? dateRange : null
          );

          return res.status(200).json({
            success: true,
            data: stats
          });
        } else {
          return res.status(400).json({ 
            error: 'Invalid action',
            available_actions: ['status', 'statistics', 'banner_config', 'consent_types']
          });
        }

      case 'POST':
        const { action: postAction } = req.body;

        if (postAction === 'update' || !postAction) {
          // Update user consent
          const { consents } = req.body;

          if (!consents || typeof consents !== 'object') {
            return res.status(400).json({
              error: 'Consents object is required',
              example: {
                consents: {
                  analytics: true,
                  marketing: false,
                  third_party_integrations: true
                }
              }
            });
          }

          // Validate consent data
          const validation = consentUpdateSchema.validate(consents);
          if (!validation.valid) {
            return res.status(400).json({
              error: 'Invalid consent data',
              details: validation.errors
            });
          }

          const result = await consentService.updateUserConsent(
            userId, 
            validation.data, 
            metadata
          );

          if (!result.success) {
            return res.status(400).json({
              success: false,
              error: result.error
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Consent preferences updated successfully',
            data: result
          });
        } else if (postAction === 'initialize') {
          // Initialize consent for new user (typically called during registration)
          const { consents } = req.body;

          const result = await consentService.initializeUserConsent(
            userId,
            consents || {},
            metadata
          );

          if (!result.success) {
            return res.status(400).json({
              success: false,
              error: result.error
            });
          }

          return res.status(200).json({
            success: true,
            message: 'User consent initialized successfully',
            data: result
          });
        } else if (postAction === 'withdraw_all') {
          // Withdraw all non-essential consents (GDPR compliance)
          const result = await consentService.withdrawAllConsents(userId, metadata);

          if (!result.success) {
            return res.status(400).json({
              success: false,
              error: result.error
            });
          }

          return res.status(200).json({
            success: true,
            message: 'All non-essential consents withdrawn successfully',
            data: result
          });
        } else {
          return res.status(400).json({
            error: 'Invalid action',
            available_actions: ['update', 'initialize', 'withdraw_all']
          });
        }

      case 'PUT':
        // Alias for POST update action
        const { consents } = req.body;

        if (!consents) {
          return res.status(400).json({
            error: 'Consents object is required'
          });
        }

        // Validate consent data
        const validation = consentUpdateSchema.validate(consents);
        if (!validation.valid) {
          return res.status(400).json({
            error: 'Invalid consent data',
            details: validation.errors
          });
        }

        const result = await consentService.updateUserConsent(
          userId, 
          validation.data, 
          metadata
        );

        if (!result.success) {
          return res.status(400).json({
            success: false,
            error: result.error
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Consent preferences updated successfully',
          data: result
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('User consent API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
}