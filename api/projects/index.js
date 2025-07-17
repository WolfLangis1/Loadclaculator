
import { cors, authenticate } from '../utils/middleware.js';
import { projectService } from '../services/projectService.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (await authenticate(req, res)) return;

  const userId = req.userId;

  try {
    if (req.method === 'GET') {
      const { limit, offset, status, archived } = req.query;
      const { projects, sharedProjects, total } = await projectService.listProjects(userId, limit, offset, status, archived);

      return res.status(200).json({
        success: true,
        projects,
        sharedProjects,
        total,
        limit: parseInt(limit || 50),
        offset: parseInt(offset || 0),
      });
    } else if (req.method === 'POST') {
      const {
        name,
        address,
        clientName,
        clientEmail,
        clientPhone,
        projectType,
        data = {},
        calculations = {},
        sldData = {},
        aerialData = {},
        notes,
        tags,
        templateId
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      const projectData = {
        user_id: userId,
        name,
        address,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        project_type: projectType,
        data,
        calculations,
        sld_data: sldData,
        aerial_data: aerialData,
        notes,
        tags,
        template_id: templateId
      };

      const newProject = await projectService.createProject(projectData);

      await projectService.logActivity(userId, 'project_created', 'project', newProject.id, { project_name: name });

      if (templateId) {
        await projectService.incrementTemplateUsage(templateId);
      }

      return res.status(201).json({
        success: true,
        project: newProject
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Projects API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
