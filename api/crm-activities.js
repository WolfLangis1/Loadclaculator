// CRM Activities API endpoint
import { crmService } from './services/crmService.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

    const firebaseUid = authHeader.replace('Bearer ', '');

    switch (req.method) {
      case 'GET':
        const activities = await crmService.getActivities(firebaseUid, req.query);
        return res.status(200).json({
          success: true,
          data: activities,
          metadata: {
            total: activities.length
          }
        });

      case 'POST':
        const newActivity = await crmService.createActivity(firebaseUid, req.body);
        return res.status(201).json({
          success: true,
          data: newActivity
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('CRM Activities API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}