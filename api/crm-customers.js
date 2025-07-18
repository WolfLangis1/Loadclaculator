// CRM Customers API endpoint
import { crmService } from './services/crmService.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract Firebase UID from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    // Extract user ID from authorization header (Supabase user ID)
    const firebaseUid = authHeader.replace('Bearer ', '');

    switch (req.method) {
      case 'GET':
        const customers = await crmService.getCustomers(firebaseUid, req.query);
        return res.status(200).json({
          success: true,
          data: customers,
          metadata: {
            total: customers.length
          }
        });

      case 'POST':
        const newCustomer = await crmService.createCustomer(firebaseUid, req.body);
        return res.status(201).json({
          success: true,
          data: newCustomer
        });

      case 'PUT':
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'Customer ID is required' });
        }
        
        const updatedCustomer = await crmService.updateCustomer(firebaseUid, id, req.body);
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