// User Data Rights API - GDPR/CCPA Compliance
import { cors } from './utils/middleware.js';
import userDataRightsService from './services/userDataRightsService.js';
import { ValidationSchema } from './utils/validation.js';
import jwt from 'jsonwebtoken';
import apiKeyManager from './utils/apiKeyManager.js';

// Validation schema for data rights requests
const dataRightsSchema = new ValidationSchema()
  .string('action', { required: true, maxLength: 50 })
  .string('format', { required: false, maxLength: 10 })
  .boolean('soft_delete', false)
  .string('confirmation', { required: false, maxLength: 100 });

export default async function handler(req, res) {
  // Apply secure CORS middleware
  if (cors(req, res)) return;

  try {
    // Verify JWT token
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
      requestedBy: 'user'
    };

    switch (req.method) {
      case 'GET':
        const { action, format } = req.query;

        if (action === 'export') {
          // Export user data (Right to Access / Data Portability)
          const exportFormat = format || 'json';
          
          if (!['json', 'csv'].includes(exportFormat.toLowerCase())) {
            return res.status(400).json({
              error: 'Invalid export format',
              supported_formats: ['json', 'csv']
            });
          }

          const exportResult = await userDataRightsService.generateExport(userId, exportFormat);
          
          if (!exportResult.success) {
            return res.status(500).json({
              success: false,
              error: 'Failed to export user data',
              details: exportResult.error
            });
          }

          // Set appropriate headers for file download
          res.setHeader('Content-Type', exportResult.contentType);
          res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');

          return res.status(200).send(exportResult.data);

        } else if (action === 'status') {
          // Get data rights request status (if you implement async processing)
          return res.status(200).json({
            success: true,
            data: {
              user_id: userId,
              available_actions: [
                'export (GET with format=json|csv)',
                'delete (POST with confirmation)',
                'soft_delete (POST with soft_delete=true)'
              ],
              export_formats: ['json', 'csv'],
              estimated_data_size: 'Available on export'
            }
          });

        } else {
          return res.status(400).json({
            error: 'Invalid action',
            available_actions: ['export', 'status'],
            example: '/api/user-data-rights?action=export&format=json'
          });
        }

      case 'POST':
        // Validate request body
        const validation = dataRightsSchema.validate(req.body);
        if (!validation.valid) {
          return res.status(400).json({
            error: 'Invalid request data',
            details: validation.errors
          });
        }

        const { action: postAction, soft_delete, confirmation } = validation.data;

        if (postAction === 'delete') {
          // Delete user data (Right to Erasure)
          
          // Require explicit confirmation for data deletion
          const expectedConfirmation = `DELETE_MY_DATA_${userId}`;
          if (confirmation !== expectedConfirmation) {
            return res.status(400).json({
              error: 'Data deletion requires explicit confirmation',
              required_confirmation: expectedConfirmation,
              message: 'To delete your data, include the required confirmation string in your request'
            });
          }

          const deleteResult = await userDataRightsService.deleteUserData(userId, {
            soft_delete: soft_delete || false,
            ...metadata
          });

          if (!deleteResult.success) {
            return res.status(500).json({
              success: false,
              error: 'Failed to delete user data',
              details: deleteResult.error
            });
          }

          return res.status(200).json({
            success: true,
            message: soft_delete 
              ? 'User data has been marked for deletion. Recovery is possible for 30 days.'
              : 'User data has been permanently deleted.',
            data: {
              deletion_type: soft_delete ? 'soft' : 'hard',
              deletion_date: deleteResult.data.deletion_date,
              deleted_data_summary: Object.keys(deleteResult.data.deleted_data),
              recovery_period: soft_delete ? '30 days' : 'none'
            }
          });

        } else if (postAction === 'export_request') {
          // Request data export (for async processing if needed)
          const { format: exportFormat } = validation.data;
          
          const exportResult = await userDataRightsService.exportUserData(userId, {
            format: exportFormat || 'json',
            ...metadata
          });

          if (!exportResult.success) {
            return res.status(500).json({
              success: false,
              error: 'Failed to export user data',
              details: exportResult.error
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Data export completed',
            data: {
              export_size: exportResult.metadata.export_size_bytes,
              total_records: exportResult.metadata.total_records,
              format: exportResult.metadata.format,
              download_url: `/api/user-data-rights?action=export&format=${exportFormat || 'json'}`
            }
          });

        } else {
          return res.status(400).json({
            error: 'Invalid action',
            available_actions: ['delete', 'export_request'],
            examples: {
              delete: {
                action: 'delete',
                confirmation: `DELETE_MY_DATA_${userId}`,
                soft_delete: false
              },
              export_request: {
                action: 'export_request',
                format: 'json'
              }
            }
          });
        }

      case 'DELETE':
        // Alternative endpoint for data deletion
        const deleteConfirmation = req.headers['x-delete-confirmation'];
        const expectedDeleteConfirmation = `DELETE_MY_DATA_${userId}`;
        
        if (deleteConfirmation !== expectedDeleteConfirmation) {
          return res.status(400).json({
            error: 'Data deletion requires explicit confirmation',
            required_header: 'X-Delete-Confirmation',
            required_value: expectedDeleteConfirmation
          });
        }

        const deleteResult = await userDataRightsService.deleteUserData(userId, {
          soft_delete: false,
          ...metadata
        });

        if (!deleteResult.success) {
          return res.status(500).json({
            success: false,
            error: 'Failed to delete user data',
            details: deleteResult.error
          });
        }

        return res.status(200).json({
          success: true,
          message: 'User data has been permanently deleted.',
          data: {
            deletion_type: 'hard',
            deletion_date: deleteResult.data.deletion_date,
            deleted_data_summary: Object.keys(deleteResult.data.deleted_data)
          }
        });

      default:
        return res.status(405).json({ 
          error: 'Method not allowed',
          allowed_methods: ['GET', 'POST', 'DELETE']
        });
    }

  } catch (error) {
    console.error('User data rights API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred processing your data rights request'
    });
  }
}