// Data Retention Management API
import { cors } from './utils/middleware.js';
import dataRetentionService from './services/dataRetentionService.js';
import jwt from 'jsonwebtoken';
import apiKeyManager from './utils/apiKeyManager.js';

export default async function handler(req, res) {
  // Apply secure CORS middleware
  if (cors(req, res)) return;

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT token (admin access required)
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

    // Check if user has admin privileges (you may need to adjust this based on your user system)
    if (!decoded.isAdmin && decoded.subscriptionTier !== 'enterprise') {
      return res.status(403).json({ error: 'Administrative access required' });
    }

    if (req.method === 'GET') {
      // Get retention status report
      const { action } = req.query;

      if (action === 'status') {
        const report = await dataRetentionService.getRetentionStatusReport();
        return res.status(200).json({
          success: true,
          data: report
        });
      } else if (action === 'policies') {
        const policies = dataRetentionService.getRetentionPolicies();
        return res.status(200).json({
          success: true,
          data: policies
        });
      } else {
        return res.status(400).json({ error: 'Invalid action. Use "status" or "policies"' });
      }
    }

    if (req.method === 'POST') {
      const { action } = req.body;

      switch (action) {
        case 'cleanup_all':
          const results = await dataRetentionService.runAllCleanupTasks();
          return res.status(200).json({
            success: true,
            message: 'Data retention cleanup completed',
            data: results
          });

        case 'cleanup_activity_logs':
          const activityResult = await dataRetentionService.cleanupActivityLogs();
          return res.status(200).json({
            success: true,
            message: 'Activity logs cleanup completed',
            data: activityResult
          });

        case 'cleanup_guest_sessions':
          const guestResult = await dataRetentionService.cleanupGuestSessions();
          return res.status(200).json({
            success: true,
            message: 'Guest sessions cleanup completed',
            data: guestResult
          });

        case 'cleanup_analytics':
          const analyticsResult = await dataRetentionService.cleanupAnalyticsCache();
          return res.status(200).json({
            success: true,
            message: 'Analytics cache cleanup completed',
            data: analyticsResult
          });

        case 'hard_delete_users':
          const { userIds } = req.body;
          if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({ error: 'userIds array is required' });
          }
          
          const deleteResult = await dataRetentionService.hardDeleteUserData(userIds);
          return res.status(200).json({
            success: true,
            message: 'User data permanently deleted',
            data: deleteResult
          });

        default:
          return res.status(400).json({ 
            error: 'Invalid action',
            available_actions: [
              'cleanup_all',
              'cleanup_activity_logs', 
              'cleanup_guest_sessions',
              'cleanup_analytics',
              'hard_delete_users'
            ]
          });
      }
    }

  } catch (error) {
    console.error('Data retention API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
}