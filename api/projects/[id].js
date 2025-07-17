
import { cors, authenticate } from '../utils/middleware.js';
import { projectService } from '../services/projectService.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (await authenticate(req, res)) return;

  const userId = req.userId;
  const projectId = req.query.id;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  try {
    const project = await projectService.getProjectById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = project.user_id === userId;
    const share = project.project_shares?.find(s => s.shared_with_user_id === userId);
    const hasAccess = isOwner || share;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const permission = isOwner ? 'admin' : share?.permission || 'view';

    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        project: {
          ...project,
          permission,
          isOwner
        }
      });
    } else if (req.method === 'PUT') {
      if (permission === 'view') {
        return res.status(403).json({ error: 'Insufficient permissions to edit' });
      }

      const {
        name,
        address,
        clientName,
        clientEmail,
        clientPhone,
        projectType,
        status,
        data,
        calculations,
        sldData,
        aerialData,
        notes,
        tags
      } = req.body;

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (address !== undefined) updates.address = address;
      if (clientName !== undefined) updates.client_name = clientName;
      if (clientEmail !== undefined) updates.client_email = clientEmail;
      if (clientPhone !== undefined) updates.client_phone = clientPhone;
      if (projectType !== undefined) updates.project_type = projectType;
      if (status !== undefined) updates.status = status;
      if (data !== undefined) updates.data = data;
      if (calculations !== undefined) updates.calculations = calculations;
      if (sldData !== undefined) updates.sld_data = sldData;
      if (aerialData !== undefined) updates.aerial_data = aerialData;
      if (notes !== undefined) updates.notes = notes;
      if (tags !== undefined) updates.tags = tags;

      updates.version = project.version + 1;

      const updatedProject = await projectService.updateProject(projectId, updates);

      await projectService.logActivity(userId, 'project_updated', 'project', projectId, { changes: Object.keys(updates) });

      return res.status(200).json({
        success: true,
        project: updatedProject
      });
    } else if (req.method === 'DELETE') {
      if (!isOwner) {
        return res.status(403).json({ error: 'Only project owner can delete' });
      }

      await projectService.softDeleteProject(projectId);

      await projectService.logActivity(userId, 'project_deleted', 'project', projectId, { project_name: project.name });

      return res.status(200).json({
        success: true,
        message: 'Project archived successfully'
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Project API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
