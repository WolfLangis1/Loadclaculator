// CRM Projects API endpoint
import { crmService } from './services/crmService.js';
import { cors, authenticate } from './utils/middleware.js';
import jwt from 'jsonwebtoken';
import apiKeyManager from './utils/apiKeyManager.js';

export default async function handler(req, res) {
  // Apply CORS middleware
  if (cors(req, res)) return;

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
        const projects = await crmService.getProjects(firebaseUid, req.query);
        return res.status(200).json({
          success: true,
          data: projects,
          metadata: {
            total: projects.length
          }
        });

      case 'POST':
        const newProject = await crmService.createProject(firebaseUid, req.body);
        return res.status(201).json({
          success: true,
          data: newProject
        });

      case 'PUT':
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'Project ID is required' });
        }
        
        const updatedProject = await crmService.updateProject(firebaseUid, id, req.body);
        return res.status(200).json({
          success: true,
          data: updatedProject
        });

      case 'DELETE':
        const { id: deleteId } = req.query;
        if (!deleteId) {
          return res.status(400).json({ error: 'Project ID is required' });
        }
        
        await crmService.deleteProject(firebaseUid, deleteId);
        return res.status(200).json({
          success: true,
          data: { deleted: true }
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('CRM Projects API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}