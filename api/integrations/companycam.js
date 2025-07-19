// CompanyCam Integration API
import fetch from 'node-fetch';
import apiKeyManager from '../utils/apiKeyManager.js';

const COMPANYCAM_API_BASE = 'https://api.companycam.com/v2';

class CompanyCamService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async apiCall(endpoint, options = {}) {
    const url = `${COMPANYCAM_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`CompanyCam API error: ${data.message || response.statusText}`);
    }

    return data;
  }

  // Project Management
  async getProjects() {
    return this.apiCall('/projects');
  }

  async getProject(projectId) {
    return this.apiCall(`/projects/${projectId}`);
  }

  async createProject(projectData) {
    return this.apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: projectData.name,
        address: projectData.address,
        coordinates: projectData.coordinates,
        tags: projectData.tags || []
      })
    });
  }

  async updateProject(projectId, projectData) {
    return this.apiCall(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  }

  // Photo Management
  async getProjectPhotos(projectId) {
    return this.apiCall(`/projects/${projectId}/photos`);
  }

  async uploadPhoto(projectId, photoData, metadata = {}) {
    const formData = new FormData();
    formData.append('photo', photoData);
    formData.append('project_id', projectId);
    
    if (metadata.tags) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }
    if (metadata.notes) {
      formData.append('notes', metadata.notes);
    }

    return this.apiCall('/photos', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
        // Don't set Content-Type for FormData
      }
    });
  }

  async getPhoto(photoId) {
    return this.apiCall(`/photos/${photoId}`);
  }

  async deletePhoto(photoId) {
    return this.apiCall(`/photos/${photoId}`, {
      method: 'DELETE'
    });
  }

  // Tags and Organization
  async getTags() {
    return this.apiCall('/tags');
  }

  async createTag(tagName, color = '#007bff') {
    return this.apiCall('/tags', {
      method: 'POST',
      body: JSON.stringify({
        name: tagName,
        color: color
      })
    });
  }

  async tagPhoto(photoId, tagIds) {
    return this.apiCall(`/photos/${photoId}/tags`, {
      method: 'POST',
      body: JSON.stringify({
        tag_ids: tagIds
      })
    });
  }

  // Users and Teams
  async getUsers() {
    return this.apiCall('/users');
  }

  async getUser(userId) {
    return this.apiCall(`/users/${userId}`);
  }

  // Reports and Analytics
  async getProjectReport(projectId, startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    
    return this.apiCall(`/projects/${projectId}/report?${params.toString()}`);
  }

  // Integration with CRM
  mapCRMProjectToCompanyCam(crmProject) {
    return {
      name: `${crmProject.customer?.name || 'Unknown'} - Electrical Project`,
      address: this.formatAddress(crmProject.customer?.address),
      coordinates: crmProject.customer?.address?.coordinates,
      tags: [
        'electrical',
        'crm-project',
        ...(crmProject.tags || [])
      ]
    };
  }

  formatAddress(address) {
    if (!address) return '';
    return [
      address.street,
      address.city,
      address.state,
      address.zipCode
    ].filter(Boolean).join(', ');
  }

  async syncProjectWithCRM(crmProject) {
    const companyCamProject = this.mapCRMProjectToCompanyCam(crmProject);
    
    // Check if project already exists
    const existingProjects = await this.getProjects();
    const existing = existingProjects.data?.find(p => 
      p.name.includes(crmProject.customer?.name || '') ||
      p.external_id === crmProject.id
    );

    if (existing) {
      return this.updateProject(existing.id, {
        ...companyCamProject,
        external_id: crmProject.id
      });
    } else {
      return this.createProject({
        ...companyCamProject,
        external_id: crmProject.id
      });
    }
  }
}

import { cors } from '../utils/middleware.js';

export default async function handler(req, res) {
  // Apply secure CORS middleware
  if (cors(req, res)) return;

  try {
    const { action } = req.query;
    const requestData = req.body;

    // Use server-side API key for security
    let apiKey;
    try {
      apiKey = apiKeyManager.getCompanyCamKey();
    } catch (error) {
      return res.status(500).json({ error: 'CompanyCam API key not configured on server' });
    }

    const companyCam = new CompanyCamService(apiKey);

    switch (action) {
      case 'get_projects':
        const projects = await companyCam.getProjects();
        return res.status(200).json(projects);

      case 'create_project':
        const { projectData } = requestData;
        const createdProject = await companyCam.createProject(projectData);
        return res.status(201).json({ project: createdProject });

      case 'get_project_photos':
        const { projectId } = requestData;
        const photos = await companyCam.getProjectPhotos(projectId);
        return res.status(200).json(photos);

      case 'upload_photo':
        const { projectId: uploadProjectId, photoData, metadata } = requestData;
        const uploadedPhoto = await companyCam.uploadPhoto(uploadProjectId, photoData, metadata);
        return res.status(201).json({ photo: uploadedPhoto });

      case 'sync_crm_project':
        const { crmProject } = requestData;
        const syncedProject = await companyCam.syncProjectWithCRM(crmProject);
        return res.status(200).json({ project: syncedProject });

      case 'get_tags':
        const tags = await companyCam.getTags();
        return res.status(200).json(tags);

      case 'create_tag':
        const { tagName, color } = requestData;
        const createdTag = await companyCam.createTag(tagName, color);
        return res.status(201).json({ tag: createdTag });

      case 'tag_photo':
        const { photoId, tagIds } = requestData;
        await companyCam.tagPhoto(photoId, tagIds);
        return res.status(200).json({ tagged: true });

      case 'get_project_report':
        const { projectId: reportProjectId, startDate, endDate } = requestData;
        const report = await companyCam.getProjectReport(reportProjectId, startDate, endDate);
        return res.status(200).json(report);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('CompanyCam Integration Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}