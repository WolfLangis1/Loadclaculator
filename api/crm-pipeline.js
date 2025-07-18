// CRM Pipeline API endpoint
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
        const pipelineData = await crmService.getPipelineData(firebaseUid);
        return res.status(200).json({
          success: true,
          data: pipelineData
        });

      case 'POST':
        // Handle moving projects between stages
        const { action, projectId, newStageId, stageIds } = req.body;
        
        if (action === 'move_project') {
          if (!projectId || !newStageId) {
            return res.status(400).json({ error: 'Project ID and new stage ID are required' });
          }
          
          const movedProject = await crmService.moveProjectStage(firebaseUid, projectId, newStageId);
          return res.status(200).json({
            success: true,
            data: movedProject
          });
        }
        
        if (action === 'reorder_stages') {
          if (!stageIds || !Array.isArray(stageIds)) {
            return res.status(400).json({ error: 'Stage IDs array is required' });
          }
          
          await crmService.reorderStages(firebaseUid, stageIds);
          return res.status(200).json({
            success: true,
            data: { reordered: true }
          });
        }
        
        return res.status(400).json({ error: 'Invalid action' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('CRM Pipeline API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}