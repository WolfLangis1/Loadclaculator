// CRM Customers API endpoint
import { crmService } from './services/crmService.js';
import { cors } from './utils/middleware.js';
import { schemas } from './utils/validation.js';
import jwt from 'jsonwebtoken';
import apiKeyManager from './utils/apiKeyManager.js';

export default async function handler(req, res) {
  // Apply secure CORS middleware
  if (cors(req, res)) return;

  try {
    // Verify JWT token and extract user data
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

    const firebaseUid = decoded.firebaseUid;

    switch (req.method) {
      case 'GET':
        // Validate query parameters
        const queryValidation = schemas.searchFilters.validate(req.query);
        if (!queryValidation.valid) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid query parameters',
            details: queryValidation.errors
          });
        }
        
        const customers = await crmService.getCustomers(firebaseUid, queryValidation.data);
        return res.status(200).json({
          success: true,
          data: customers,
          metadata: {
            total: customers.length
          }
        });

      case 'POST':
        // Validate request body
        const bodyValidation = schemas.customer.validate(req.body);
        if (!bodyValidation.valid) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid customer data',
            details: bodyValidation.errors
          });
        }
        
        const newCustomer = await crmService.createCustomer(firebaseUid, bodyValidation.data);
        return res.status(201).json({
          success: true,
          data: newCustomer
        });

      case 'PUT':
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'Customer ID is required' });
        }
        
        // Validate UUID format for ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
          return res.status(400).json({ error: 'Invalid customer ID format' });
        }
        
        // Validate request body
        const updateValidation = schemas.customer.validate(req.body);
        if (!updateValidation.valid) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid customer data',
            details: updateValidation.errors
          });
        }
        
        const updatedCustomer = await crmService.updateCustomer(firebaseUid, id, updateValidation.data);
        return res.status(200).json({
          success: true,
          data: updatedCustomer
        });

      case 'DELETE':
        const { id: deleteId } = req.query;
        if (!deleteId) {
          return res.status(400).json({ error: 'Customer ID is required' });
        }
        
        await crmService.deleteCustomer(firebaseUid, deleteId);
        return res.status(200).json({
          success: true,
          data: { deleted: true }
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('CRM Customers API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}