import { supabase } from '../utils/db.js';

const getProjectById = async (projectId) => {
  const { data: project, error } = await supabase
    .from('projects')
    .select('*, project_shares!project_shares_project_id_fkey(*)')
    .eq('id', projectId)
    .single();

  if (error) {
    throw new Error('Failed to fetch project');
  }
  return project;
};

const listProjects = async (userId, limit = 50, offset = 0, status, archived = false) => {
  let query = supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (archived === 'true') {
    query = query.not('archived_at', 'is', null);
  } else {
    query = query.is('archived_at', null);
  }

  const { data: projects, error, count } = await query;

  if (error) {
    throw new Error('Failed to fetch projects');
  }

  const { data: sharedProjects } = await supabase
    .from('project_shares')
    .select('project_id, permission, projects(*)')
    .eq('shared_with_user_id', userId)
    .is('projects.archived_at', null);

  return {
    projects,
    sharedProjects: sharedProjects?.map(share => ({
      ...share.projects,
      permission: share.permission,
      isShared: true
    })) || [],
    total: count,
  };
};

const createProject = async (projectData) => {
  const { data: newProject, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create project');
  }
  return newProject;
};

const updateProject = async (projectId, updates) => {
  const { data: updatedProject, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update project');
  }
  return updatedProject;
};

const softDeleteProject = async (projectId) => {
  const { data: archivedProject, error } = await supabase
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to delete project');
  }
  return archivedProject;
};

const logActivity = async (userId, action, resourceType, resourceId, details) => {
  const { error } = await supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
  });
  if (error) {
    console.error('Failed to log activity:', error);
  }
};

const incrementTemplateUsage = async (templateId) => {
  const { error } = await supabase.rpc('increment_template_usage', { p_template_id: templateId });
  if (error) {
    console.error('Failed to increment template usage:', error);
  }
};

export const projectService = {
  getProjectById,
  listProjects,
  createProject,
  updateProject,
  softDeleteProject,
  logActivity,
  incrementTemplateUsage,
};